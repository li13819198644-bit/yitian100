import { describe, expect, it } from 'vitest'
import type { AppStats, ReviewObservation, StudyMode, VocabWord } from '../types'
import { buildDailyReport } from './dailyReport'
import { makeObservation } from './memoryEvidence'
import { createProgress, scheduleReview } from './srs'
import { localDateKey, recordStudyResult } from './studyStats'

const DAY = 86_400_000
const now = new Date(2026, 9, 7, 12).getTime()
const word: VocabWord = { id: 'a', word: 'a', meaning: '含义', phonetic: '', collocation: '', example: '', difficulty: 2, level: 'B2' }
const base = (): AppStats => ({ todayDate: localDateKey(new Date(now)), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 })
const observation = (source: ReviewObservation['evaluationSource'] = 'selfReportedRecall'): ReviewObservation => ({
  evaluationSource: source, hintUsed: false, shortTermPractice: false, firstAttemptOfDay: true, responseDurationMs: 100, intervalSinceLastReview: null,
})
describe('honest memory diagnostics', () => {
  it('preserves the first error, records source and timing, and counts words uniquely', () => {
    let stats = recordStudyResult(base(), 'a', false, 'self', now, { rating: 'unknown', session: 'learn', isNew: true, observation: observation() })
    stats = recordStudyResult(stats, 'a', true, 'self', now + 1000, { rating: 'known', session: 'learn', isNew: false, observation: { ...observation(), firstAttemptOfDay: false, shortTermPractice: true } })
    const report = buildDailyReport([word], [], stats, [], now)
    expect(report.vocabulary).toMatchObject({ uniqueWords: 1, attempts: 2, observedFirstAnswerByMode: { self: { correct: 0, count: 1 } } })
    expect(report.vocabulary.results[0].firstAnswer).toEqual({ correct: false, mode: 'self' })
    expect(report.vocabulary.results[0].detail?.events?.[0]).toMatchObject({ hintUsed: false, responseDurationMs: 100, intervalSinceLastReview: null, evaluationSource: 'selfReportedRecall', firstAttemptOfDay: true })
    expect(report.memoryDiagnostics.selfReportedRecall).toEqual({ attempts: 1, successes: 0, accuracy: 0 })
    expect(report.memoryDiagnostics.verifiedRecall.accuracy).toBeNull()
  })
  it('captures each observed mode first answer without overwriting it with a correction', () => {
    let stats = base()
    for (const mode of ['self', 'choice', 'spelling', 'sentence', 'recall', 'production', 'assisted', 'usage'] as StudyMode[]) {
      stats = recordStudyResult(stats, 'a', false, mode, now, { rating: 'unknown', session: 'quiz', isNew: false, observation: observation(null) })
      stats = recordStudyResult(stats, 'a', true, mode, now + 1, { rating: 'known', session: 'quiz', isNew: false, observation: observation(null) })
    }
    const byMode = buildDailyReport([word], [], stats, [], now).vocabulary.observedFirstAnswerByMode
    expect(Object.values(byMode).every((value) => value.count === 1 && value.correct === 0)).toBe(true)
  })
  it('does not invent coverage or per-mode first answers for historical records', () => {
    let stats = recordStudyResult(base(), 'a', true, 'choice', now)
    stats = recordStudyResult(stats, 'a', false, 'choice', now + 1, { rating: 'unknown', session: 'quiz', isNew: false, observation: observation('recognition') })
    const report = buildDailyReport([word], [], stats, [], now)
    expect(report.vocabulary.observedFirstAnswerByMode.choice.count).toBe(0)
    expect(report.memoryDiagnostics.coverage).toMatchObject({ eventsRecorded: 1, attemptsWithMissingEvents: 1 })
    expect(report.memoryDiagnostics.verifiedRecallCoverage).toBe('unknown')
    expect(report.vocabulary.firstAnswerByMode.choice).toMatchObject({ count: 1, correct: 1 })
  })
  it('reports cross-day and seven-day self-report separately from verification', () => {
    const first = scheduleReview(createProgress('a', now), 'known', now, observation())
    const later = scheduleReview(first, 'known', now + 7 * DAY, makeObservation(first, now + 7 * DAY, true, 100))
    const report = buildDailyReport([word], [later], base(), [], now + 7 * DAY)
    expect(report.memoryDiagnostics.crossDay.selfReportedRecall).toMatchObject({ attempts: 1, successes: 1 })
    expect(report.memoryDiagnostics.sevenDay.selfReportedRecall).toMatchObject({ attempts: 1, successes: 1 })
    expect(report.memoryDiagnostics.crossDay.verifiedRecall.accuracy).toBeNull()
    expect(report.memoryDiagnostics.verifiedRecallWords).toBe(0)
  })
  it('uses explicit snapshots for leech changes and leaves old practice dates unchanged', () => {
    const old = { ...createProgress('a', now - DAY), seen: 8, incorrect: 5, lapses: 5, lastRating: 'unknown' as const, practiceDay: '2026-10-06', mistakesToday: 2 }
    const stats = { ...base(), dailyHistory: [
      { date: '2026-10-06', attempts: 0, correct: 0, firstAnswers: {}, leechSnapshot: { at: now - DAY, count: 3 } },
      { date: '2026-10-07', attempts: 0, correct: 0, firstAnswers: {}, leechSnapshot: { at: now, count: 1 } },
    ] }
    const report = buildDailyReport([word], [old], stats, [], now)
    expect(report.memoryDiagnostics.leeches).toMatchObject({ currentCount: 1, change: -2, baselineDate: '2026-10-06' })
    expect(report.memoryDiagnostics.overdueBacklog).toBe(1)
    expect(old.practiceDay).toBe('2026-10-06')
    expect(buildDailyReport([word], [old], base(), [], now).memoryDiagnostics.leeches.change).toBeNull()
  })
  it('counts recognition accuracy from actual correctness rather than its conservative fuzzy rating', () => {
    const stats = recordStudyResult(base(), 'a', true, 'choice', now, { rating: 'fuzzy', session: 'quiz', isNew: false, observation: observation('recognition') })
    expect(buildDailyReport([word], [], stats, [], now).memoryDiagnostics.recognition).toEqual({ attempts: 1, successes: 1, accuracy: 100 })
  })
})
