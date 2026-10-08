import type { StudyMode, WordProgress } from '../types'
import { scheduleReview } from './srs'

export function scheduleRetrieval(progress: WordProgress, correct: boolean, mode: StudyMode, now = Date.now()): WordProgress {
  if (progress.excluded) return progress
  // Compatibility for historical callers: a mode name alone cannot verify recall.
  const assisted = mode === 'assisted'
  const rating = correct ? (assisted || mode === 'usage' || mode === 'choice' ? 'fuzzy' : 'known') : 'unknown'
  const next = scheduleReview(progress, rating, now, {
    evaluationSource: mode === 'choice' ? 'recognition' : null,
    hintUsed: assisted ? true : mode === 'choice' ? false : null,
    shortTermPractice: assisted, responseDurationMs: null, firstAttemptOfDay: null,
    intervalSinceLastReview: progress.lastStudiedAt === undefined ? null : Math.max(0, now - progress.lastStudiedAt),
  })
  return assisted && correct ? { ...next, lastSuccessfulReviewAt: progress.lastSuccessfulReviewAt } : next
}
