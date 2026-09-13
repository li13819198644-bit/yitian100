import { describe, expect, it } from 'vitest'
import { buildDailyReport, dailyReportFile } from './dailyReport'
import { recordStudyResult, localDateKey } from './studyStats'
import { recordGrammarAnswer } from './grammar'
import type { AppStats } from '../types'

const now = new Date(2026, 8, 13, 12).getTime()
const base: AppStats = { todayDate: localDateKey(new Date(now)), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }
const context = { rating: 'unknown' as const, session: 'learn' as const, isNew: true }

describe('daily report measurements', () => {
  it('does not let an earlier self-rating hide the first objective test', () => {
    const self = recordStudyResult(base, 'a', true, 'self', now, context)
    const tested = recordStudyResult(self, 'a', false, 'choice', now + 1, context)
    const corrected = recordStudyResult(tested, 'a', true, 'spelling', now + 2, context)
    const report = buildDailyReport([], [], corrected, [], now)
    expect(report.vocabulary.firstAnswerByMode.self.accuracy).toBe(100)
    expect(report.vocabulary.objectiveFirstAnswer).toEqual({ count: 1, correct: 0, accuracy: 0 })
    expect(report.vocabulary.firstAnswerByMode.choice.count).toBe(1)
    expect(report.vocabulary.firstAnswerByMode.spelling.count).toBe(0)
  })
  it('counts distinct new and old words, not repeat attempts', () => {
    let stats = recordStudyResult(base, 'refute', false, 'choice', now, context)
    stats = recordStudyResult(stats, 'refute', true, 'spelling', now + 1000, { rating: 'known', session: 'review', isNew: false })
    stats = recordStudyResult(stats, 'valid', true, 'self', now + 2000, { rating: 'known', session: 'review', isNew: false })
    const report = buildDailyReport([], [], stats, [], now)
    expect(report.vocabulary).toMatchObject({ uniqueWords: 2, attempts: 3, newWordsRecorded: 1, oldWordsRecorded: 1, mistakeWordsRecorded: 1, detailCoverage: 'complete' })
    expect(report.vocabulary.results[0]).toMatchObject({ id: 'refute', recordedMistakes: 1, firstAnswer: { correct: false }, detail: { lastCorrect: true, attempts: 2 } })
    expect(report.vocabulary.objectiveFirstAnswer).toEqual({ count: 1, correct: 0, accuracy: 0 })
    expect(report.vocabulary.firstAnswerByMode.self).toEqual({ count: 1, correct: 1, accuracy: 100 })
  })
  it('keeps first attempts separate by mode instead of treating correction as first success', () => {
    const first = recordStudyResult(base, 'a', false, 'choice', now, context)
    const second = recordStudyResult(first, 'a', true, 'spelling', now + 1, context)
    const report = buildDailyReport([], [], second, [], now)
    expect(report.vocabulary.firstAnswerByMode.spelling.count).toBe(0)
    expect(report.vocabulary.results[0].detail?.modes.spelling).toEqual({ attempts: 1, correct: 1 })
  })
  it('does not infer missing per-word mistakes from legacy daily totals', () => {
    const legacy: AppStats = { ...base, todaySeen: ['a'], dailyHistory: [{ date: base.todayDate, attempts: 20, correct: 8, firstAnswers: { a: { correct: false, mode: 'choice' } } }] }
    const report = buildDailyReport([], [], legacy, [], now)
    expect(report.vocabulary.attempts).toBe(20)
    expect(report.vocabulary.detailCoverage).toBe('partial')
    expect(report.vocabulary.results[0].recordedMistakes).toBeNull()
    const updated = recordStudyResult(legacy, 'a', true, 'choice', now, context)
    const result = buildDailyReport([], [], updated, [], now)
    expect(result.vocabulary.attempts).toBe(21)
    expect(result.vocabulary.detailedAttempts).toBe(1)
    expect(result.vocabulary.unclassifiedWords).toBe(1)
  })
  it('reports unknown totals if only todaySeen survives', () => {
    const report = buildDailyReport([], [], { ...base, todaySeen: ['a'] }, [], now)
    expect(report.vocabulary.attempts).toBeNull()
    expect(report.vocabulary.objectiveFirstAnswer.accuracy).toBeNull()
    expect(report.vocabulary.detailCoverage).toBe('partial')
  })
  it('starts a new local day without leaking yesterday into today', () => {
    const first = recordStudyResult(base, 'a', false, 'choice', now, context)
    const tomorrow = new Date(2026, 8, 14, 0, 1).getTime()
    const empty = buildDailyReport([], [], first, [], tomorrow)
    expect(empty.date).toBe('2026-09-14')
    expect(empty.vocabulary.uniqueWords).toBe(0)
    const next = recordStudyResult(first, 'a', true, 'choice', tomorrow, { ...context, isNew: false })
    expect(buildDailyReport([], [], next, [], tomorrow).vocabulary.objectiveFirstAnswer.accuracy).toBe(100)
    expect(first.dailyHistory?.[0].wordDetails?.a.correct).toBe(0)
  })
  it('records grammar daily errors and chosen distractors without rewriting first answers', () => {
    const first = recordGrammarAnswer('tense-1', false, undefined, now, 0)
    const corrected = recordGrammarAnswer('tense-1', true, first, now + 1, 1)
    const report = buildDailyReport([], [], base, [corrected], now)
    expect(report.grammar).toMatchObject({ uniqueQuestionsRecorded: 1, attemptsRecorded: 2, correctRecorded: 1, mistakeQuestionsRecorded: 1, detailCoverage: 'complete' })
    expect(report.grammar.firstAnswer).toEqual({ count: 1, correct: 0, accuracy: 0 })
    expect(report.grammar.results[0].wrongAnswers).toEqual([{ answer: 'go', count: 1 }])
    expect(report.grammar.results[0].correctAnswer).toBe('goes')
  })
  it('does not label lifetime grammar accuracy as daily accuracy', () => {
    const legacy = recordGrammarAnswer('tense-1', true, undefined, now)
    delete legacy.dailyHistory
    const unknown = buildDailyReport([], [], base, [legacy], now)
    expect(unknown.grammar.attemptsRecorded).toBe(0)
    expect(unknown.grammar.detailCoverage).toBe('partial')
    expect(unknown.grammar.legacyQuestionsWithoutDailyDetails).toBe(1)
    const updated = recordGrammarAnswer('tense-1', true, legacy, now + 1000, 1)
    const report = buildDailyReport([], [], base, [updated], now)
    expect(report.grammar.firstAnswer.accuracy).toBeNull()
    expect(report.grammar.attemptsRecorded).toBe(1)
    expect(report.grammar.detailCoverage).toBe('partial')
  })
  it('keeps grammar days independent', () => {
    const first = recordGrammarAnswer('tense-1', false, undefined, now, 0)
    const tomorrow = new Date(2026, 8, 14, 9).getTime()
    const second = recordGrammarAnswer('tense-1', true, first, tomorrow, 1)
    expect(buildDailyReport([], [], base, [second], now).grammar.firstAnswer.accuracy).toBe(0)
    expect(buildDailyReport([], [], base, [second], tomorrow).grammar.firstAnswer.accuracy).toBe(100)
    expect(second.dailyHistory?.[0].wrongOptions).toEqual({ 0: 1 })
  })
  it('caps recorded history at ninety days', () => {
    let stats = base
    let grammar = recordGrammarAnswer('tense-1', true, undefined, now)
    for (let i = 1; i <= 100; i++) {
      const date = new Date(2026, 8, 13 + i, 12).getTime()
      stats = recordStudyResult(stats, 'a', true, 'choice', date, context)
      grammar = recordGrammarAnswer('tense-1', true, grammar, date, 1)
    }
    expect(stats.dailyHistory).toHaveLength(90)
    expect(grammar.dailyHistory).toHaveLength(90)
  })
  it('exports an empty report without inventing success, time spent, or account details', () => {
    const report = buildDailyReport([], [], base, [], now)
    expect(report.vocabulary.attempts).toBe(0)
    expect(report.grammar.firstAnswer.accuracy).toBeNull()
    const file = dailyReportFile(report)
    expect(file.name).toBe('yitian100-daily-report-2026-09-13.json')
    expect(file.type).toBe('application/json')
    expect(report).not.toHaveProperty('email')
    expect(report).not.toHaveProperty('duration')
  })
})
