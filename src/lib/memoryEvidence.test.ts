import { describe, expect, it } from 'vitest'
import type { ReviewObservation } from '../types'
import { evidenceSummary, makeObservation } from './memoryEvidence'
import { createProgress, scheduleQuizResult, scheduleReview } from './srs'
import { scheduleRetrieval } from './retrieval'

const DAY = 86_400_000
const now = new Date(2026, 9, 7, 12).getTime()
const observation = (overrides: Partial<ReviewObservation> = {}): ReviewObservation => ({
  evaluationSource: 'selfReportedRecall', hintUsed: false, shortTermPractice: false,
  firstAttemptOfDay: true, responseDurationMs: 1000, intervalSinceLastReview: DAY, ...overrides,
})
describe('explicit memory evidence', () => {
  it('does not infer recall or retention from ten historical choice successes', () => {
    let progress = createProgress('a', now)
    for (let i = 0; i < 10; i++) progress = scheduleRetrieval(progress, true, 'choice', now + i * DAY)
    expect(progress.repetitions).toBe(0)
    expect(evidenceSummary(progress)).toMatchObject({ recognition: { attempts: 10, successes: 10 }, selfReportedRecall: null, verifiedRecall: null, lastVerifiedCorrect: null,
      retention: { selfReportedRecall: null, verifiedRecall: null } })
    expect(evidenceSummary({ ...progress, evidence: undefined })).toMatchObject({ recognition: null, verifiedRecall: null })
  })
  it('keeps quiz recognition from improving stability or verified recall', () => {
    const progress = { ...createProgress('a', now), repetitions: 5, stability: 30, lastRating: 'known' as const }
    const next = scheduleQuizResult(progress, true, now)
    expect(next).toMatchObject({ repetitions: 5, stability: 30, mastered: false })
    expect(evidenceSummary(next).verifiedRecall).toBeNull()
  })
  it('does not count hints, interrupted observations, or short-term corrections as independent recall', () => {
    for (const fields of [{ hintUsed: true }, { hintUsed: null }, { shortTermPractice: true }]) {
      const progress = { ...createProgress('a', now), repetitions: 2, stability: 3 }
      const next = scheduleReview(progress, 'known', now, observation(fields))
      expect(evidenceSummary(next).selfReportedRecall).toBeNull()
      if (fields.hintUsed === true || fields.shortTermPractice) expect(next).toMatchObject({ repetitions: 2, stability: 3 })
    }
  })
  it('uses a cross-day observed interval for retention, and a seven-day interval for seven-day retention', () => {
    const first = scheduleReview(createProgress('a', now), 'known', now, observation({ intervalSinceLastReview: null }))
    const repeat = scheduleReview(first, 'known', now + 1000, makeObservation(first, now + 1000, false, 100))
    expect(repeat.repetitions).toBe(first.repetitions)
    expect(evidenceSummary(repeat).retention.selfReportedRecall).toBeNull()
    const tomorrow = scheduleReview(repeat, 'known', now + DAY, makeObservation(repeat, now + DAY, true, 100))
    expect(evidenceSummary(tomorrow).retention.selfReportedRecall).toMatchObject({ attempts: 1, successes: 1 })
    expect(evidenceSummary(tomorrow).sevenDayRetention.selfReportedRecall).toBeNull()
    const later = scheduleReview(tomorrow, 'unknown', now + 8 * DAY, makeObservation(tomorrow, now + 8 * DAY, true, 100))
    expect(evidenceSummary(later).sevenDayRetention.selfReportedRecall).toMatchObject({ attempts: 1, successes: 0 })
    expect(evidenceSummary(later).verifiedRecall).toBeNull()
  })
  it('keeps missing historical times unknown rather than converting old mastery into evidence', () => {
    const legacy = { ...createProgress('a', now - 8 * DAY), seen: 10, repetitions: 5, stability: 30, mastered: true }
    const current = makeObservation(legacy, now, true, null)
    expect(current.intervalSinceLastReview).toBeNull()
    const next = scheduleReview(legacy, 'known', now, current)
    expect(evidenceSummary(next).selfReportedRecall).toMatchObject({ attempts: 1 })
    expect(evidenceSummary(next).retention.selfReportedRecall).toBeNull()
    expect(evidenceSummary(next).lastVerifiedCorrect).toBeNull()
  })
  it('separates explicitly verified trials from self-report, including verified retention', () => {
    let progress = createProgress('a', now)
    for (let i = 0; i < 5; i++) progress = scheduleReview(progress, 'known', now + i * 7 * DAY,
      observation({ evaluationSource: 'verifiedRecall', intervalSinceLastReview: i ? 7 * DAY : null }))
    expect(evidenceSummary(progress)).toMatchObject({ selfReportedRecall: null, verifiedRecall: { attempts: 5, successes: 5 }, lastVerifiedCorrect: true,
      retention: { verifiedRecall: { attempts: 4, successes: 4 } }, sevenDayRetention: { verifiedRecall: { attempts: 4, successes: 4 } } })
    const failed = scheduleReview(progress, 'unknown', now + 35 * DAY, observation({ evaluationSource: 'verifiedRecall' }))
    expect(evidenceSummary(failed).lastVerifiedCorrect).toBe(false)
  })
  it('deduplicates failure days and observes current-day explanations conservatively', () => {
    const first = scheduleReview(createProgress('a', now), 'unknown', now, observation())
    const again = scheduleReview(first, 'unknown', now + 1000, makeObservation(first, now + 1000, false, 100))
    expect(again.evidence?.failureDays).toHaveLength(1)
    const coach = { ...again, intervention: { reason: 'meaning' as const, reviewedAt: now + 2000 } }
    const immediate = scheduleReview(coach, 'known', now + 3000, makeObservation(coach, now + 3000, false, 100))
    expect(immediate).toMatchObject({ repetitions: 0, stability: again.stability, mastered: false })
    expect(immediate.nextReviewAt).toBeGreaterThanOrEqual(new Date(2026, 9, 8, 9).getTime())
    expect(makeObservation(immediate, now + DAY, true, 100)).toMatchObject({ hintUsed: false, shortTermPractice: false })
    const tomorrow = scheduleReview(immediate, 'unknown', now + DAY, makeObservation(immediate, now + DAY, true, 100))
    expect(tomorrow.evidence?.failureDays).toHaveLength(2)
  })
  it('treats browsing ordinary details as a hint and measures the interval from the latest explanation', () => {
    const old = { ...createProgress('a', now - DAY), seen: 2, lastStudiedAt: now - DAY, lastExplanationAt: now }
    expect(makeObservation(old, now + 1000, true, 100)).toMatchObject({ hintUsed: true, shortTermPractice: true, intervalSinceLastReview: 1000 })
    const next = scheduleReview(old, 'known', now + 1000, makeObservation(old, now + 1000, true, 100))
    expect(next.stability).toBe(old.stability)
    expect(evidenceSummary(next).selfReportedRecall).toBeNull()
  })
  it('does not count a seven-day gap when the explanation was refreshed yesterday', () => {
    const first = scheduleReview(createProgress('a', now), 'known', now, makeObservation(undefined, now, true, 100))
    const refreshed = { ...first, lastExplanationAt: now + 6 * DAY }
    const next = scheduleReview(refreshed, 'known', now + 7 * DAY, makeObservation(refreshed, now + 7 * DAY, true, 100))
    expect(evidenceSummary(next).retention.selfReportedRecall).toMatchObject({ attempts: 1 })
    expect(evidenceSummary(next).sevenDayRetention.selfReportedRecall).toBeNull()
  })
  it('keeps an unassisted same-day successful repeat on its existing due date', () => {
    const first = scheduleReview(createProgress('a', now), 'known', now, makeObservation(undefined, now, true, 100))
    const repeat = scheduleReview(first, 'known', now + 1000, makeObservation(first, now + 1000, false, 100))
    expect(repeat.nextReviewAt).toBe(first.nextReviewAt)
    expect(repeat.easeFactor).toBe(first.easeFactor)
    expect(repeat.stability).toBe(first.stability)
  })
})
