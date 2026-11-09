import { describe, expect, it } from 'vitest'
import { questions, skills } from './data'
import { DAY, gradeWriting, mergeWriting, nextQuestion, skillProgress, wordCount } from './engine'
import { emptyWriting, type Attempt } from './types'

const q = questions.find(item => item.id === 'passive-write-1')!
const skill = skills.find(item => item.id === 'passive')!
const now = new Date(2026, 10, 9, 12).getTime()
const attempt = (patch: Partial<Attempt> = {}): Attempt => ({ id: 'a', questionId: q.id, skillId: q.skillId, at: now, original: q.answer, mode: 'independent', feedback: { status: 'pass', issues: [] }, reference: q.answer, suggestion: q.explanation, ...patch })
describe('bounded writing feedback', () => {
  it('covers each skill with recognition and at least two production contexts', () => {
    expect(new Set(questions.map(item => item.id)).size).toBe(questions.length)
    for (const skill of skills.filter(item => item.id !== 'writing')) {
      expect(questions.some(item => item.skillId === skill.id && item.mode === 'recognition')).toBe(true)
      expect(questions.filter(item => item.skillId === skill.id && item.mode === 'independent').length).toBeGreaterThanOrEqual(2)
    }
  })
  it('accepts all references, harmless punctuation and validated alternatives', () => {
    for (const question of questions) for (const text of [question.answer, ...(question.alternatives ?? [])]) expect(gradeWriting(question, ` ${text.toUpperCase()} `).status).toBe('pass')
  })
  it('catches a missing passive be and relates feedback to grammar', () => {
    expect(gradeWriting(q, 'As technology advances, some jobs may replaced by machines.')).toMatchObject({ status: 'error', issues: [{ type: 'grammar' }] })
  })
  it('never rejects a reasonable unknown paraphrase merely for not matching', () => {
    expect(gradeWriting(q, 'As technology develops, machines might take over certain jobs.').status).toBe('unverified')
    expect(() => gradeWriting(q, '  ')).toThrow()
  })
  it('grades wrong recognition choices separately', () => {
    expect(gradeWriting(questions[0], questions[0].options![0]).status).toBe('error')
  })
})
describe('spacing and independent evidence', () => {
  it('does not count crossing midnight as a full-day delay', () => {
    const late = new Date(2026, 10, 9, 23, 59).getTime()
    const records = [attempt({ at: late }), attempt({ id: 'b', questionId: 'new', at: late + 120000 })]
    expect(skillProgress(skill, records, late + 120000).independentDays).toBe(1)
  })
  it('holds transfer questions back until the permitted difficulty tier', () => {
    const transfer = questions.filter(item => item.difficulty === 2)
    expect(nextQuestion(transfer, emptyWriting(), 'passive')).toBeUndefined()
    expect(nextQuestion(transfer, emptyWriting(), 'passive', 2)?.difficulty).toBe(2)
  })
  it('does not promote recognition, imitation, same-day or repeated-item success', () => {
    const records = [attempt(), attempt({ id: 'b', questionId: 'other', at: now + 1000 }), attempt({ id: 'c', at: now + DAY }), attempt({ id: 'd', questionId: 'third', at: now + 2 * DAY, mode: 'imitation' }), attempt({ id: 'e', at: now + 3 * DAY, mode: 'recognition' })]
    expect(skillProgress(skill, records, now + 4 * DAY).independentDays).toBe(1)
  })
  it('requires new independent items on different days and resets after error', () => {
    const records = [attempt(), attempt({ id: 'b', at: now + DAY, questionId: 'new' })]
    expect(skillProgress(skill, records, now + DAY).stage).toBe('可增加难度')
    const failure = attempt({ id: 'c', at: now + DAY + 1000, feedback: { status: 'error', issues: [] } })
    expect(skillProgress(skill, [...records, failure], failure.at)).toMatchObject({ independentDays: 0, errors: 1, nextReviewAt: failure.at + 600000 })
    expect(skillProgress(skill, [...records, failure], failure.at).priority).toBeGreaterThan(skillProgress(skill, records, now + DAY).priority)
  })
  it('selects an unseen transfer item before a familiar one', () => {
    const pool = questions.filter(item => item.mode === 'independent')
    const next = nextQuestion(pool, { ...emptyWriting(), attempts: [attempt()] }, q.skillId)
    expect(next?.id).not.toBe(q.id)
  })
  it('merges without overwriting original attempts or newer drafts', () => {
    const old = { ...emptyWriting(), attempts: [attempt()], drafts: { a: { text: 'old', updatedAt: 1 } } }
    const newer = { ...emptyWriting(), attempts: [attempt(), attempt({ id: 'b' })], drafts: { a: { text: 'new', updatedAt: 2 } } }
    expect(mergeWriting(newer, old)).toMatchObject({ drafts: { a: { text: 'new' } } })
    expect(mergeWriting(old, newer).attempts).toHaveLength(2)
  })
  it('counts English words rather than Chinese characters or punctuation', () => { expect(wordCount("It's a well-known tool. 中文")).toBe(4) })
})
