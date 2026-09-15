import { describe, expect, it } from 'vitest'
import { advancedGrammarTopics, grammarQuestions, grammarTopics } from '../data/grammar'
import { buildDailyReport } from './dailyReport'
import { chooseGrammarQuestions, mergeGrammarProgress, recordGrammarAnswer } from './grammar'

const now = new Date(2026, 8, 13, 14).getTime()
const nextDay = new Date(2026, 8, 14, 9).getTime()

describe('grammar content', () => {
  it('retains every original id and gives the expansion separate ids', () => {
    const oldTopics = ['tense', 'modal', 'conditional', 'relative', 'verb-pattern', 'passive', 'agreement', 'connector']
    const originalIds = oldTopics.flatMap((id) => Array.from({ length: 5 }, (_, i) => `${id}-${i + 1}`))
    expect(grammarQuestions.slice(0, 40).map((q) => q.id)).toEqual(originalIds)
    expect(advancedGrammarTopics.flatMap((topic) => topic.questions)).toHaveLength(40)
    expect(advancedGrammarTopics.some((topic) => oldTopics.includes(topic.id))).toBe(false)
  })
  it('includes a new-topic error and its chosen distractor in daily reports', () => {
    const q = advancedGrammarTopics[0].questions[0]
    const choice = (q.answer + 1) % 4
    const result = recordGrammarAnswer(q.id, false, undefined, now, choice)
    const report = buildDailyReport([], [], { todayDate: '', todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }, [result], now)
    expect(report.grammar.uniqueQuestionsRecorded).toBe(1)
    expect(report.grammar.results[0]).toMatchObject({ topic: advancedGrammarTopics[0].title, sentence: q.sentence, wrongAnswers: [{ answer: q.options[choice], count: 1 }] })
    expect(chooseGrammarQuestions(grammarQuestions.map((item) => item.id), [result], true, nextDay)).toEqual([q.id])
  })
  it('contains sixteen topics and eighty unique, complete questions', () => {
    expect(grammarTopics).toHaveLength(16)
    expect(grammarQuestions).toHaveLength(80)
    expect(new Set(grammarQuestions.map((q) => q.id)).size).toBe(80)
    for (const topic of grammarTopics) {
      expect(topic.questions).toHaveLength(5)
      for (const q of topic.questions) {
        expect(q.topicId).toBe(topic.id)
        expect(q.sentence).toContain('___')
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options).size).toBe(4)
        expect(q.options[q.answer]).toBeTruthy()
        expect(q.explanation.length).toBeGreaterThan(15)
        expect(q.translation).toBeTruthy()
      }
    }
  })
})

describe('grammar scheduling', () => {
  it('keeps first-answer accuracy when a mistake is corrected', () => {
    const wrong = recordGrammarAnswer('q1', false, undefined, now)
    const corrected = recordGrammarAnswer('q1', true, wrong, now + 1000)
    expect(corrected).toMatchObject({ attempts: 2, correct: 1, firstCorrect: false, lastCorrect: true, reviewStage: 0 })
    expect(corrected.nextReviewAt).toBe(nextDay)
  })
  it('schedules a mistake tomorrow rather than looping immediately', () => {
    expect(recordGrammarAnswer('q1', false, undefined, now).nextReviewAt).toBe(nextDay)
  })
  it('advances correct reviews across days but not within the same day', () => {
    const first = recordGrammarAnswer('q1', true, undefined, now)
    const repeated = recordGrammarAnswer('q1', true, first, now + 1000)
    expect(repeated.reviewStage).toBe(1)
    expect(repeated.nextReviewAt).toBe(first.nextReviewAt)
    const later = recordGrammarAnswer('q1', true, repeated, nextDay)
    expect(later.reviewStage).toBe(2)
    expect(later.nextReviewAt).toBe(new Date(2026, 8, 17, 9).getTime())
  })
  it('resets intervals on failure without losing lifetime history', () => {
    const previous = { ...recordGrammarAnswer('q1', true, undefined, now), reviewStage: 4 }
    const wrong = recordGrammarAnswer('q1', false, previous, nextDay)
    expect(wrong).toMatchObject({ reviewStage: 0, attempts: 2, correct: 1, firstCorrect: true })
  })
  it('caps the interval at fourteen days', () => {
    const previous = { ...recordGrammarAnswer('q1', true, undefined, now), reviewStage: 4 }
    expect(recordGrammarAnswer('q1', true, previous, nextDay).nextReviewAt).toBe(new Date(2026, 8, 28, 9).getTime())
  })
})

describe('grammar queue and restore', () => {
  it('prioritizes overdue then unseen, with no duplicates and at most five', () => {
    const due = { ...recordGrammarAnswer('due', false, undefined, now - 100000), nextReviewAt: now - 1 }
    const later = recordGrammarAnswer('later', true, undefined, now)
    const result = chooseGrammarQuestions(['later', 'new', 'due', 'due', 'n2', 'n3', 'n4'], [due, later], false, now, () => 0.5)
    expect(result[0]).toBe('due')
    expect(result).toHaveLength(5)
    expect(new Set(result).size).toBe(5)
    expect(result).not.toContain('later')
  })
  it('review excludes unseen and not-yet-due questions', () => {
    const later = recordGrammarAnswer('later', false, undefined, now)
    expect(chooseGrammarQuestions(['later', 'new'], [later], true, now)).toEqual([])
    expect(chooseGrammarQuestions(['later', 'new'], [later], true, nextDay)).toEqual(['later'])
  })
  it('merges newest records and preserves local records absent from old snapshots', () => {
    const older = recordGrammarAnswer('q1', false, undefined, now)
    const newer = recordGrammarAnswer('q1', true, older, nextDay)
    const other = recordGrammarAnswer('q2', true, undefined, now)
    expect(mergeGrammarProgress([newer, other], [older])).toEqual([newer, other])
    expect(mergeGrammarProgress([newer], [])).toEqual([newer])
  })
})
