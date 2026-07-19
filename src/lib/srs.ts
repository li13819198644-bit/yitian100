import type { Rating, VocabWord, WordProgress } from '../types'

const DAY = 24 * 60 * 60 * 1000
const MINUTE = 60 * 1000

export interface DailyPlanOptions {
  baseNewWordsPerDay: number
  dailyCapacity?: number
  reviewCap?: number
  weakPracticeLimit?: number
  now?: number
}

export interface DailyPlan {
  dueReviewWords: VocabWord[]
  newWords: VocabWord[]
  weakPracticeWords: VocabWord[]
  forecastReviewLoad: number[]
  forecastPressure: number
  reviewDebt: number
  weakDebt: number
  recommendedNewCount: number
  dailyCapacity: number
}

export function createProgress(wordId: string, now = Date.now()): WordProgress {
  return {
    wordId,
    nextReviewAt: now,
    repetitions: 0,
    easeFactor: 2.5,
    stability: 0,
    difficultyScore: 5,
    lapses: 0,
    seen: 0,
    correct: 0,
    incorrect: 0,
    mastered: false,
    updatedAt: now,
  }
}

export function qualityFromRating(rating: Rating): number {
  if (rating === 'known') return 5
  if (rating === 'fuzzy') return 3
  return 1
}

function recoveryIntervalCapMs(lapses: number, repetitions: number, rating: Rating): number | undefined {
  if (lapses < 3 || repetitions >= Math.min(8, Math.max(3, Math.ceil(lapses / 2)))) return undefined
  if (rating === 'fuzzy') {
    if (lapses >= 10) return 30 * MINUTE
    if (lapses >= 6) return 6 * 60 * MINUTE
    return 12 * 60 * MINUTE
  }
  if (lapses >= 10) return 12 * 60 * MINUTE
  if (lapses >= 6) return DAY
  return 2 * DAY
}

export function scheduleReview(progress: WordProgress, rating: Rating, now = Date.now()): WordProgress {
  const quality = qualityFromRating(rating)
  const wasCorrect = quality >= 3
  const previousStability = progress.stability ?? Math.max(0, progress.repetitions)
  const previousDifficulty = progress.difficultyScore ?? 5
  const easeFactor = Math.max(
    1.3,
    progress.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  )
  const difficultyScore = Math.min(
    10,
    Math.max(1, previousDifficulty + (rating === 'known' ? -0.35 : rating === 'fuzzy' ? 0.25 : 1.15)),
  )

  let repetitions = progress.repetitions
  let lapses = progress.lapses
  let intervalMs = 0
  let stability = previousStability

  if (quality < 3) {
    repetitions = 0
    lapses += 1
    stability = Math.max(0.08, previousStability * 0.35)
    intervalMs = 10 * MINUTE
  } else {
    repetitions += 1
    const difficultyDrag = Math.max(0.45, 1.15 - difficultyScore / 12)
    if (rating === 'fuzzy') {
      stability = Math.max(0.25, previousStability * 1.35 * difficultyDrag || 0.25)
      intervalMs = repetitions <= 1 ? 6 * 60 * MINUTE : Math.max(1, stability) * DAY
    } else if (repetitions === 1) {
      stability = Math.max(1, 1.1 * difficultyDrag)
      intervalMs = stability * DAY
    } else if (repetitions === 2) {
      stability = Math.max(3, previousStability * 2.4 * difficultyDrag)
      intervalMs = stability * DAY
    } else {
      stability = Math.max(previousStability + 1, previousStability * easeFactor * difficultyDrag)
      intervalMs = Math.round(stability) * DAY
    }
    intervalMs = Math.min(intervalMs, recoveryIntervalCapMs(lapses, repetitions, rating) ?? intervalMs)
    stability = Math.min(stability, intervalMs / DAY)
  }

  const seen = progress.seen + 1
  const correct = progress.correct + (wasCorrect ? 1 : 0)
  const incorrect = progress.incorrect + (wasCorrect ? 0 : 1)

  return {
    ...progress,
    repetitions,
    easeFactor,
    stability,
    difficultyScore,
    lapses,
    seen,
    correct,
    incorrect,
    lastRating: rating,
    mastered: repetitions >= 4 && stability >= 14 && easeFactor >= 2.2 && lapses === 0,
    nextReviewAt: now + intervalMs,
    updatedAt: now,
  }
}

export function scheduleQuizResult(progress: WordProgress, correct: boolean, now = Date.now()): WordProgress {
  return scheduleReview(progress, correct ? 'fuzzy' : 'unknown', now)
}

export function accuracy(progress: WordProgress[]): number {
  const attempts = progress.reduce((sum, item) => sum + item.correct + item.incorrect, 0)
  if (!attempts) return 0
  const correct = progress.reduce((sum, item) => sum + item.correct, 0)
  return Math.round((correct / attempts) * 100)
}

export function isWeak(progress: WordProgress): boolean {
  const attempts = progress.correct + progress.incorrect
  const accuracy = attempts ? progress.correct / attempts : 1
  return progress.lapses > 0 || progress.lastRating === 'unknown' || progress.easeFactor < 2 || (progress.incorrect >= 3 && accuracy < 0.6)
}

export function isLeech(progress: WordProgress): boolean {
  const attempts = progress.correct + progress.incorrect
  const accuracy = attempts ? progress.correct / attempts : 1
  return progress.lapses >= 5 || (progress.incorrect >= 4 && accuracy < 0.45)
}

function progressMap(progress: WordProgress[]): Map<string, WordProgress> {
  return new Map(progress.map((item) => [item.wordId, item]))
}

export function getDueReviewWords(words: VocabWord[], progress: WordProgress[], now = Date.now()): VocabWord[] {
  const byId = progressMap(progress)
  return words
    .filter((word) => {
      const item = byId.get(word.id)
      return item ? item.nextReviewAt <= now : false
    })
    .sort((a, b) => (byId.get(a.id)?.nextReviewAt ?? 0) - (byId.get(b.id)?.nextReviewAt ?? 0))
}

export function getNewWords(words: VocabWord[], progress: WordProgress[], limit = Number.POSITIVE_INFINITY): VocabWord[] {
  const byId = progressMap(progress)
  return words.filter((word) => !byId.has(word.id)).slice(0, Math.max(0, limit))
}

export function getWeakPracticeWords(words: VocabWord[], progress: WordProgress[], limit = 20, now = Date.now()): VocabWord[] {
  const byId = progressMap(progress)
  return words
    .filter((word) => {
      const item = byId.get(word.id)
      return item ? item.nextReviewAt > now && isWeak(item) : false
    })
    .sort((a, b) => {
      const left = byId.get(a.id)
      const right = byId.get(b.id)
      return Number(Boolean(right && isLeech(right))) - Number(Boolean(left && isLeech(left)))
        || (right?.lapses ?? 0) - (left?.lapses ?? 0)
        || (left?.easeFactor ?? 2.5) - (right?.easeFactor ?? 2.5)
    })
    .slice(0, Math.max(0, limit))
}

export function recommendNewWordCount(dueReviewCount: number, baseNewWordsPerDay: number, dailyCapacity = 160): number {
  return Math.max(0, Math.min(baseNewWordsPerDay, dailyCapacity - dueReviewCount))
}

export function recommendNewWordCountWithWeakDebt(
  dueReviewCount: number,
  weakDebt: number,
  availableNewWords: number,
  baseNewWordsPerDay: number,
  dailyCapacity = 160,
  forecastLoad: number[] = [],
): number {
  if (weakDebt >= Math.max(30, baseNewWordsPerDay * 0.8)) return 0
  const pressureAdjusted = recommendNewWordCountWithForecast(dueReviewCount + Math.floor(weakDebt / 2), baseNewWordsPerDay, dailyCapacity, forecastLoad)
  return Math.min(availableNewWords, pressureAdjusted)
}

export function forecastReviewLoad(progress: WordProgress[], days = 7, now = Date.now()): number[] {
  return Array.from({ length: days }, (_, dayIndex) => {
    const start = now + dayIndex * DAY
    const end = start + DAY
    return progress.filter((item) => item.nextReviewAt >= start && item.nextReviewAt < end).length
  })
}

export function forecastPressure(load: number[], dailyCapacity = 160): number {
  const overload = load.reduce((sum, count) => sum + Math.max(0, count - dailyCapacity), 0)
  const peak = Math.max(0, ...load)
  return overload + Math.max(0, peak - dailyCapacity * 0.8)
}

export function recommendNewWordCountWithForecast(
  dueReviewCount: number,
  baseNewWordsPerDay: number,
  dailyCapacity = 160,
  forecastLoad: number[] = [],
): number {
  const pressure = forecastPressure(forecastLoad, dailyCapacity)
  const forecastPenalty = Math.ceil(pressure / 2)
  return recommendNewWordCount(dueReviewCount + forecastPenalty, baseNewWordsPerDay, dailyCapacity)
}

export function buildDailyPlan(words: VocabWord[], progress: WordProgress[], options: DailyPlanOptions): DailyPlan {
  const now = options.now ?? Date.now()
  const dailyCapacity = options.dailyCapacity ?? 160
  const byId = progressMap(progress)
  const dueReviewWords = getDueReviewWords(words, progress, now)
  const reviewDebt = dueReviewWords.length
  const load = forecastReviewLoad(progress, 7, now)
  const pressure = forecastPressure(load, dailyCapacity)
  const weakDebt = words.filter((word) => {
    const item = byId.get(word.id)
    return item ? isWeak(item) : false
  }).length
  const availableNewWords = getNewWords(words, progress).length
  const recommendedNewCount = recommendNewWordCountWithWeakDebt(reviewDebt, weakDebt, availableNewWords, options.baseNewWordsPerDay, dailyCapacity, load)
  const reviewLimit = options.reviewCap ?? reviewDebt

  return {
    dueReviewWords: dueReviewWords.slice(0, Math.max(0, reviewLimit)),
    newWords: getNewWords(words, progress, recommendedNewCount),
    weakPracticeWords: getWeakPracticeWords(words, progress, options.weakPracticeLimit ?? 20, now),
    forecastReviewLoad: load,
    forecastPressure: pressure,
    reviewDebt,
    weakDebt,
    recommendedNewCount,
    dailyCapacity,
  }
}

export function chooseReviewSession(words: VocabWord[], progress: WordProgress[], options: DailyPlanOptions): VocabWord[] {
  return buildDailyPlan(words, progress, options).dueReviewWords
}

export function chooseLearnSession(words: VocabWord[], progress: WordProgress[], options: DailyPlanOptions): VocabWord[] {
  return buildDailyPlan(words, progress, options).newWords
}

export function chooseWeakPracticeSession(words: VocabWord[], progress: WordProgress[], options: DailyPlanOptions): VocabWord[] {
  return buildDailyPlan(words, progress, options).weakPracticeWords
}

export function chooseDailyWords(words: VocabWord[], progress: WordProgress[], target = 100, now = Date.now()): VocabWord[] {
  const byId = new Map(progress.map((item) => [item.wordId, item]))
  const overdue = words
    .filter((word) => (byId.get(word.id)?.nextReviewAt ?? 0) <= now && byId.has(word.id))
    .sort((a, b) => (byId.get(a.id)?.nextReviewAt ?? 0) - (byId.get(b.id)?.nextReviewAt ?? 0))
  const newWords = words.filter((word) => !byId.has(word.id))
  const futureWeak = words
    .filter((word) => {
      const item = byId.get(word.id)
      return item && item.nextReviewAt > now && isWeak(item)
    })
    .sort((a, b) => (byId.get(b.id)?.lapses ?? 0) - (byId.get(a.id)?.lapses ?? 0))
  const knownFill = words
    .filter((word) => {
      const item = byId.get(word.id)
      return item && item.nextReviewAt > now && !isWeak(item)
    })
    .sort((a, b) => (byId.get(a.id)?.nextReviewAt ?? 0) - (byId.get(b.id)?.nextReviewAt ?? 0))

  return [...overdue, ...newWords, ...futureWeak, ...knownFill].slice(0, target)
}

export function insertDelayedRetry(ids: string[], currentIndex: number, wordId: string, rating: Rating): string[] {
  if (rating === 'known') return ids

  const nextIds = ids.filter((id, index) => id !== wordId || index <= currentIndex)
  const firstGap = rating === 'unknown' ? 3 : 8
  const firstIndex = Math.min(nextIds.length, currentIndex + firstGap + 1)
  nextIds.splice(firstIndex, 0, wordId)

  if (rating === 'unknown') {
    const secondIndex = Math.min(nextIds.length, firstIndex + 7)
    nextIds.splice(secondIndex, 0, wordId)
  }

  return nextIds
}
