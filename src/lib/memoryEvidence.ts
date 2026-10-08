import type { EvidenceCount, MemoryEvidence, Rating, ReviewObservation, WordProgress } from '../types'
import { localDateKey } from './studyStats'

const count = (): EvidenceCount => ({ attempts: 0, successes: 0 })
export function emptyEvidence(): MemoryEvidence {
  return { version: 1, recognition: count(), selfReportedRecall: count(), verifiedRecall: count(),
    retention: { selfReportedRecall: count(), verifiedRecall: count() },
    sevenDayRetention: { selfReportedRecall: count(), verifiedRecall: count() }, failureDays: [] }
}
const add = (old: EvidenceCount, success: boolean) => ({ attempts: old.attempts + 1, successes: old.successes + Number(success) })
export function updateMemoryEvidence(progress: WordProgress, rating: Rating, observation: ReviewObservation, now: number): MemoryEvidence {
  const old = progress.evidence ?? emptyEvidence()
  const next: MemoryEvidence = { ...old, retention: { ...old.retention }, sevenDayRetention: { ...old.sevenDayRetention }, failureDays: [...old.failureDays] }
  const day = localDateKey(new Date(now))
  if (rating === 'unknown') next.failureDays = [...new Set([...old.failureDays, day])].sort().slice(-90)
  const source = observation.evaluationSource
  const independent = observation.hintUsed === false && !observation.shortTermPractice
  if (source === 'recognition') next.recognition = add(old.recognition, rating !== 'unknown')
  if (!source || source === 'recognition' || !independent) return next
  next[source] = add(old[source], rating === 'known')
  // A known interval alone says nothing about the source of an old review.
  // Require an observed earlier independent trial and an untouched cross-day gap.
  const previous = source === 'verifiedRecall' ? old.lastVerifiedAt : old.lastIndependentAt
  if (previous !== undefined && observation.firstAttemptOfDay === true && observation.intervalSinceLastReview !== null
    && localDateKey(new Date(previous)) !== day && progress.lastStudiedAt !== undefined
    && localDateKey(new Date(progress.lastStudiedAt)) !== day) {
    next.retention[source] = add(old.retention[source], rating === 'known')
    if (observation.intervalSinceLastReview >= 7 * 86_400_000 && now - previous >= 7 * 86_400_000) {
      next.sevenDayRetention[source] = add(old.sevenDayRetention[source], rating === 'known')
    }
  }
  if (source === 'verifiedRecall') { next.lastVerifiedAt = now; next.lastVerifiedCorrect = rating === 'known' }
  else next.lastIndependentAt = now
  return next
}
export function evidenceSummary(progress?: WordProgress) {
  const observed = (value?: EvidenceCount) => value?.attempts ? { ...value, accuracy: Math.round(value.successes / value.attempts * 100) } : null
  const e = progress?.evidence
  return { recognition: observed(e?.recognition), selfReportedRecall: observed(e?.selfReportedRecall), verifiedRecall: observed(e?.verifiedRecall),
    retention: { selfReportedRecall: observed(e?.retention.selfReportedRecall), verifiedRecall: observed(e?.retention.verifiedRecall) },
    sevenDayRetention: { selfReportedRecall: observed(e?.sevenDayRetention.selfReportedRecall), verifiedRecall: observed(e?.sevenDayRetention.verifiedRecall) },
    lastVerifiedCorrect: e?.lastVerifiedCorrect ?? null }
}
export function makeObservation(progress: WordProgress | undefined, now: number, firstAttemptOfDay: boolean, responseDurationMs: number | null): ReviewObservation {
  const explanationAt = Math.max(progress?.lastExplanationAt ?? 0, progress?.intervention?.reviewedAt ?? 0)
  const reviewedToday = explanationAt > 0 && localDateKey(new Date(explanationAt)) === localDateKey(new Date(now))
  const repeatedToday = progress?.seen && progress.lastStudiedAt !== undefined && localDateKey(new Date(progress.lastStudiedAt)) === localDateKey(new Date(now))
  return { evaluationSource: 'selfReportedRecall', hintUsed: Boolean(reviewedToday), shortTermPractice: Boolean(reviewedToday || repeatedToday), firstAttemptOfDay,
    responseDurationMs, intervalSinceLastReview: progress?.seen && progress.lastStudiedAt !== undefined ? Math.max(0, now - Math.max(progress.lastStudiedAt, explanationAt)) : null }
}
