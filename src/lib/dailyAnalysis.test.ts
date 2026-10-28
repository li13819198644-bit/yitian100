import { describe, expect, it } from 'vitest'
import { analyzeDailyReports, offsetDate, parseCardDrafts, parseDailyUpload } from '../../supabase/functions/_shared/dailyAnalysis'
import { applyPersonalCards, buildDailyUpload, planForDate, type AnalysisJob } from './dailyAnalysis'
import { buildDailyReport } from './dailyReport'
import { recordStudyResult } from './studyStats'
import { seedWords } from '../data/seedWords'
import type { AppSettings, AppStats } from '../types'
import { report } from '../test/dailyAnalysisFixtures'

describe('server learning analysis', () => {
  it('does not treat choice recognition or repeated same-day answers as independent recall', () => {
    const choice = report(undefined, true, 'choice')
    const repeated = report()
    for (const item of repeated.vocabulary.results) { item.attempts = 100; item.mistakes = 0 }
    const a = analyzeDailyReports([choice, choice], choice.date)
    expect(a.evidence.recognition).toEqual({ count: 10, known: 10 })
    expect(a.evidence.self.count).toBe(0)
    expect(a.newWords).toBe(0)
    const b = analyzeDailyReports([repeated, repeated], repeated.date)
    expect(b.evidence.self.count).toBe(10)
    expect(b.evidence.crossDaySelf.count).toBe(0)
  })
  it('reduces load when the next-day first self-rating is forgotten, even if final practice succeeds', () => {
    const earlier = report('2026-10-27')
    const today = report('2026-10-28', false)
    today.vocabulary.results.forEach(word => { word.attempts = 20; word.mistakes = 1 })
    const result = analyzeDailyReports([earlier, today], today.date)
    expect(result.reviewWords).toBe(15)
    expect(result.evidence.crossDaySelf).toEqual({ count: 10, known: 0 })
    expect(result.focusWords[0].reason).toContain('跨天首答又不会')
    expect(result.planDate).toBe('2026-10-29')
  })
  it('allows at most five new words only after several complete, stable days and honors relief and target settings', () => {
    const days = ['2026-10-26', '2026-10-27', '2026-10-28'].map(date => report(date))
    expect(analyzeDailyReports(days, days[2].date).newWords).toBe(0)
    days[2].preferences.reliefMode = false
    expect(analyzeDailyReports(days, days[2].date)).toMatchObject({ reviewWords: 20, newWords: 5 })
    days[2].preferences.dailyTarget = 0
    expect(analyzeDailyReports(days, days[2].date).newWords).toBe(0)
    days[2].preferences.dailyTarget = 100
    days[1].vocabulary.detailCoverage = 'partial'
    expect(analyzeDailyReports(days, days[2].date).newWords).toBe(0)
  })
  it('keeps null first answers unknown and ignores future/out-of-window reports', () => {
    const day = report()
    day.vocabulary.results.forEach(word => { word.firstAnswer = null })
    const result = analyzeDailyReports([report('2026-10-01'), report('2026-10-29'), day], day.date)
    expect(result.evidence.self.count).toBe(0)
    expect(result.analyzedDays).toBe(1)
    expect(offsetDate('2026-12-31', 1)).toBe('2027-01-01')
  })
  it('rejects invalid dates, duplicate words, and forged counts at the worker boundary', () => {
    const day = report()
    expect(() => parseDailyUpload({ ...day, date: '2026-02-31' })).toThrow()
    expect(() => parseDailyUpload({ ...day, timeZone: 'not-a-zone' })).toThrow()
    day.vocabulary.results[1].id = day.vocabulary.results[0].id
    expect(() => parseDailyUpload(day)).toThrow()
  })
  it('rejects drafts for unrelated words and missing translations', () => {
    const words = report().vocabulary.results
    expect(() => parseCardDrafts({ drafts: [{ wordId: 'foreign' }] }, words)).toThrow()
    expect(() => parseCardDrafts({ drafts: [{ wordId: words[0].id, hook: '这是一个直接动作场景帮助记忆', example: 'word0 appears.', translation: '' }] }, words)).toThrow()
  })
})
describe('phone upload and personal results', () => {
  it('uploads only today, preserves unknowns, and omits cumulative progress and account data', () => {
    const now = new Date(2026, 9, 28, 12).getTime()
    const settings = { reliefMode: true, dailyTarget: 100 } as AppSettings
    const initial: AppStats = { todayDate: '', todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }
    const stats = recordStudyResult(initial, seedWords[0].id, false, 'self', now, { rating: 'unknown', session: 'review', isNew: false })
    const payload = buildDailyUpload(buildDailyReport(seedWords, [], stats, [], now), seedWords, settings)
    expect(payload.vocabulary.results).toHaveLength(1)
    expect(payload.vocabulary.results[0].firstAnswer).toEqual({ mode: 'self', correct: false })
    expect(JSON.stringify(payload)).not.toMatch(/currentProgress|password|email|exportedAt|dailyHistory/)
    expect(parseDailyUpload({ ...payload, email: 'private@example.com' })).not.toHaveProperty('email')
  })
  it('applies a plan only on its local day, for the latest revision, and in its timezone', () => {
    const result = analyzeDailyReports([report()], '2026-10-28')
    const job = { report_date: '2026-10-28', revision: 1, status: 'completed', result, updated_at: '2026-10-28T12:00:00Z' } as AnalysisJob
    expect(planForDate([job], '2026-10-29', result.timeZone)).toBe(result)
    expect(planForDate([job], '2026-10-28', result.timeZone)).toBeNull()
    expect(planForDate([job], '2026-10-29', 'UTC')).toBeNull()
    expect(planForDate([job, { ...job, revision: 2, status: 'pending', result: null }], '2026-10-29', result.timeZone)).toBeNull()
  })
  it('overlays only accepted memory aids while preserving IDs, definitions, roots, and the original card', () => {
    const original = seedWords.find(word => word.word === 'discern')!
    const updated = applyPersonalCards([original], [{ word_id: original.id, content: { wordId: original.id, word: original.word, hook: '个人助记', example: 'I discern a difference.', translation: '我辨出一处不同。' } }])[0]
    expect(updated.id).toBe(original.id)
    expect(updated.memoryHook).toBe(original.memoryHook)
    expect(updated.senses).toBe(original.senses)
    expect(updated.meaning).toBe(original.meaning)
    expect(original.evilHook).not.toBe('个人助记')
    expect(applyPersonalCards([original], [])[0]).toBe(original)
  })
})
