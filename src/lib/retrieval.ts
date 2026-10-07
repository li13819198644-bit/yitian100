import type { StudyMode, WordProgress } from '../types'
import { localDateKey, localDateOffset } from './studyStats'
import { scheduleReview } from './srs'

export function scheduleRetrieval(progress: WordProgress, correct: boolean, mode: StudyMode, now = Date.now()): WordProgress {
  if (progress.excluded) return progress
  if (mode !== 'assisted' || !correct) return scheduleReview(progress, correct ? (mode === 'usage' || mode === 'choice' ? 'fuzzy' : 'known') : 'unknown', now)
  // A choice revealed the answer: retain the score without increasing memory strength.
  let nextReviewAt = now + 6 * 60 * 60 * 1000
  if (progress.practiceDay === localDateKey(new Date(now)) && (progress.mistakesToday ?? 0) >= 2) {
    const tomorrow = localDateOffset(now, 1); tomorrow.setHours(9, 0, 0, 0)
    nextReviewAt = Math.max(nextReviewAt, tomorrow.getTime())
  }
  return { ...progress, seen: progress.seen + 1, correct: progress.correct + 1,
    mastered: false, lastRating: 'fuzzy', lastStudiedAt: now, updatedAt: now, nextReviewAt }
}
