import type { Rating, VocabWord, WordProgress } from '../types'

const DAY = 24 * 60 * 60 * 1000

export function createProgress(wordId: string, now = Date.now()): WordProgress {
  return {
    wordId,
    nextReviewAt: now,
    repetitions: 0,
    easeFactor: 2.5,
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
  const easeFactor = Math.max(
    1.3,
    progress.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  )

  let repetitions = progress.repetitions
  let lapses = progress.lapses
  let intervalDays = 0

  if (quality < 3) {
    repetitions = 0
    lapses += 1
    intervalDays = 0.08
  } else {
    repetitions += 1
    if (rating === 'fuzzy') {
      intervalDays = repetitions <= 1 ? 0.5 : Math.max(1, repetitions * 1.2)
    } else if (repetitions === 1) {
      intervalDays = 1
    } else if (repetitions === 2) {
      intervalDays = 3
    } else {
      intervalDays = Math.round((repetitions - 1) * easeFactor)
    }
  }

  const seen = progress.seen + 1
  const correct = progress.correct + (wasCorrect ? 1 : 0)
  const incorrect = progress.incorrect + (wasCorrect ? 0 : 1)

  return {
    ...progress,
    repetitions,
    easeFactor,
    lapses,
    seen,
    correct,
    incorrect,
    lastRating: rating,
    mastered: repetitions >= 4 && easeFactor >= 2.2 && lapses === 0,
    nextReviewAt: now + intervalDays * DAY,
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
