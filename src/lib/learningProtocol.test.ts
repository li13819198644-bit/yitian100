import { describe, expect, it, vi } from 'vitest'
import { imagePilotCards, semanticCards, variedContext } from '../data/semanticCards'
import { DAY, emptyLearningState, gradeRecall, independentReady, learningEvent, learningEvidenceSummary, mergeLearningStates, newId, nextIndependentReview, type LearningEvent } from './learningProtocol'
import { createImagePilot } from './vocabularyExperiment'
import { createProgress } from './srs'
import { scheduleSemanticRecall } from './semanticScheduling'

const start = new Date(2026, 10, 3, 12).getTime()
function event(at: number, patch: Partial<LearningEvent> = {}) {
  return learningEvent({ wordId: 'discern', kind: 'recall', cue: 'none', direction: 'en-zh', outcome: 'correct', assessment: 'self', activeMs: 1000, sessionId: 'session', ...patch }, at)
}
describe('separate retrieval evidence', () => {
  it('checks the additional adjective sense of concrete and keeps noun/adjective context results separate', () => {
    const card = semanticCards.find(card => card.id === 'concrete')!
    expect(variedContext(card, 0)).toMatchObject({ senseId: 'adjective', text: 'They gave a concrete example.' })
    expect(variedContext(card, 1)).toMatchObject({ senseId: 'noun' })
    const records = [event(start, { wordId: 'concrete', senseId: 'noun', kind: 'context', cue: 'sentence' }), event(start + 1000, { wordId: 'concrete', senseId: 'adjective', kind: 'context', cue: 'sentence', outcome: 'incorrect' })]
    expect(learningEvidenceSummary(records, start).context).toBe(2)
    expect(learningEvidenceSummary(records, start).delayed24h.tested).toBe(0)
  })
  it('does not fabricate learning evidence from a reported pilot score', () => {
    const pilot = createImagePilot(true, start)
    expect(pilot.priorReport).toMatchObject({ correct: 3, total: 3, verified: false, learnedAt: null })
    expect(learningEvidenceSummary([], start).delayed24h.tested).toBe(0)
  })
  it('keeps a failed delayed first answer when corrected again the same day', () => {
    const records = [event(start, { kind: 'encoding', outcome: null, cue: 'sentence' }), event(start + DAY + 1000, { outcome: 'incorrect' }), event(start + DAY + 60_000)]
    expect(learningEvidenceSummary(records, start + 2 * DAY).delayed24h).toEqual({ tested: 1, correct: 0, selfRated: 1 })
  })
  it('does not turn sentence understanding, reverse recall, or immediate practice into delayed forward recall', () => {
    const records = [event(start, { kind: 'encoding', outcome: null }), event(start + 1000), event(start + 8 * DAY, { kind: 'context', cue: 'sentence' }), event(start + 8 * DAY + 1000, { direction: 'zh-en', assessment: 'typed-match' })]
    const summary = learningEvidenceSummary(records, start + 9 * DAY)
    expect(summary.delayed24h.tested).toBe(0)
    expect(summary.context).toBe(1)
    expect(summary.reverse).toBe(1)
  })
  it('measures from the latest explanation or attempt rather than the original study date', () => {
    const records = [event(start, { kind: 'encoding', outcome: null }), event(start + 13 * DAY, { kind: 'feedback', cue: 'sentence', outcome: null }), event(start + 14 * DAY + 1000)]
    const summary = learningEvidenceSummary(records, start + 15 * DAY)
    expect(summary.delayed24h.tested).toBe(1)
    expect(summary.delayed7d.tested).toBe(0)
    expect(summary.delayed14d.tested).toBe(0)
  })
  it('keeps self-rated use separate from verified word forms', () => {
    const summary = learningEvidenceSummary([event(start, { kind: 'usage', direction: 'zh-en', cue: 'sentence' })], start)
    expect(summary.usage).toEqual({ tested: 1, correct: 1, selfRated: 1 })
    expect(summary.reverse).toBe(0)
    expect(summary.delayed24h.tested).toBe(0)
  })
  it('accepts ordinary gloss variants, blanks, and pilot noun plurals without fuzzy spelling matches', () => {
    expect(gradeRecall(imagePilotCards[0], '铰链', 'en-zh')).toBe('correct')
    expect(gradeRecall(imagePilotCards[1], '门闩、插销', 'en-zh')).toBe('correct')
    expect(gradeRecall(imagePilotCards[2], '碎片', 'en-zh')).toBe('correct')
    expect(gradeRecall(imagePilotCards[0], '', 'zh-en')).toBe('incorrect')
    expect(gradeRecall(imagePilotCards[0], ' HINGE ', 'zh-en')).toBe('correct')
    expect(gradeRecall(imagePilotCards[1], 'the latches', 'zh-en')).toBe('correct')
    expect(gradeRecall(imagePilotCards[0], 'hing', 'zh-en')).toBe('incorrect')
    expect(gradeRecall(imagePilotCards[0], '连接门与门框的转轴装置', 'en-zh')).toBe('needs-review')
  })
})
describe('adaptive initial scheduling', () => {
  it('requires spacing and other words after study; context success alone cannot grow independent spacing', () => {
    const records = [event(start, { kind: 'encoding', cue: 'sentence', outcome: null })]
    expect(independentReady(records, 'discern', start + 1000)).toBe(false)
    expect(independentReady(records, 'discern', start + 65_000)).toBe(false)
    const mixed = [...records, ...['a', 'b', 'c'].map((wordId, i) => event(start + 1000 + i, { wordId, kind: 'encoding', outcome: null }))]
    expect(independentReady(mixed, 'discern', start + 65_000)).toBe(true)
    const context = [...records, event(start + 5000, { kind: 'context', cue: 'sentence' })]
    expect(nextIndependentReview(context, 'discern', start + DAY).at).toBe(start + 65_000)
  })
  it('does not increase spacing for same-day repeated successes', () => {
    const records = [event(start), event(start + 10000)]
    expect(nextIndependentReview(records, 'discern', start).at).toBe(start + 10000 + DAY)
    const later = [...records, event(start + 2 * DAY)]
    expect(nextIndependentReview(later, 'discern', start).at).toBe(start + 4 * DAY)
    expect(nextIndependentReview([event(start, { effort: 'thinking' })], 'discern', start).at).toBe(start + DAY)
  })
  it('applies the two-failure cooldown even after corrective feedback', () => {
    const records = [event(start, { outcome: 'incorrect' }), event(start + 10000, { outcome: 'incorrect' }), event(start + 20000, { kind: 'feedback', outcome: null })]
    const due = new Date(nextIndependentReview(records, 'discern', start + 30000).at)
    expect(due.getDate()).toBe(new Date(start).getDate() + 1)
    expect(due.getHours()).toBe(9)
  })
  it('does not treat the feedback paired with a correct self-rating as a new failure', () => {
    const recall = event(start)
    const records = [recall, event(start + 1, { kind: 'feedback', outcome: null, cue: 'sentence', attemptId: recall.id })]
    expect(nextIndependentReview(records, 'discern', start).at).toBe(start + DAY)
  })
  it('preserves ordinary memory strength after a just-studied success', () => {
    const progress = { ...createProgress('discern', start - 2 * DAY), seen: 3, stability: 2, repetitions: 2 }
    const result = scheduleSemanticRecall(progress, true, [event(start - 1000, { kind: 'encoding', outcome: null })], start)
    expect(result.stability).toBe(progress.stability)
    expect(result.repetitions).toBe(progress.repetitions)
    expect(result.seen).toBe(progress.seen + 1)
  })
})
describe('backup merging', () => {
  it('can create event IDs on the supported HTTP LAN setup without randomUUID', () => {
    const getRandomValues = crypto.getRandomValues.bind(crypto)
    vi.stubGlobal('crypto', { getRandomValues })
    try { expect(newId()).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/) }
    finally { vi.unstubAllGlobals() }
  })
  it('keeps event identity and original attempt time when a free answer is reviewed', () => {
    const original = event(start, { outcome: 'needs-review', assessment: 'typed-match' })
    const revised = { ...original, outcome: 'correct' as const, assessment: 'self' as const, updatedAt: start + 1000 }
    const result = mergeLearningStates({ ...emptyLearningState(), events: [original] }, { ...emptyLearningState(), events: [revised] })
    expect(result.events).toEqual([revised])
    expect(result.events[0].at).toBe(start)
  })
  it('retains completed arms and elapsed time when merging a stale clock checkpoint', () => {
    const pilot = createImagePilot(false, start)
    const completed = { ...pilot, updatedAt: start + 100, activeMs: { pilot: 90000 }, completedAt: { pilot: start + 100 } }
    const stale = { ...pilot, updatedAt: start + 200, activeMs: { pilot: 50000 } }
    const result = mergeLearningStates({ ...emptyLearningState(), experiments: [completed] }, { ...emptyLearningState(), experiments: [stale] }).experiments[0]
    expect(result.activeMs.pilot).toBe(90000)
    expect(result.completedAt.pilot).toBe(start + 100)
    expect(mergeLearningStates(undefined)).toEqual(emptyLearningState())
  })
})
