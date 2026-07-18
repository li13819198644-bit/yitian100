import type { Rating, VocabWord, WordProgress } from '../types'

const DAY = 24 * 60 * 60 * 1000
const MINUTE = 60 * 1000

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

export function accuracy(progress: WordProgress[]): number {
  const attempts = progress.reduce((sum, item) => sum + item.correct + item.incorrect, 0)
  if (!attempts) return 0
  const correct = progress.reduce((sum, item) => sum + item.correct, 0)
  return Math.round((correct / attempts) * 100)
}

export function isWeak(progress: WordProgress): boolean {
  return progress.lapses > 0 || progress.lastRating === 'unknown' || progress.easeFactor < 2
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
