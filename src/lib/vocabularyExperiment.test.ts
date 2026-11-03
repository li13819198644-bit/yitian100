import { describe, expect, it } from 'vitest'
import { semanticCards } from '../data/semanticCards'
import { seedWords } from '../data/seedWords'
import { createABExperiment, createImagePilot, experimentCheckpoint, experimentResults, reservedExperimentWords } from './vocabularyExperiment'
import { DAY, emptyLearningState, learningEvent } from './learningProtocol'

const start = new Date(2026, 10, 3, 12).getTime()
describe('prospective experiment protocol', () => {
  it('randomizes eight baseline-unfamiliar words into balanced, paired arms without modifying seed IDs', () => {
    const ids = semanticCards.filter(card => card.id !== 'sustain' && !card.partOfSpeech.includes('／')).map(card => card.id)
    const before = JSON.stringify(seedWords)
    const experiment = createABExperiment(seedWords, ids, () => 0.25, start)
    expect(experiment.items).toHaveLength(8)
    expect(experiment.items.filter(item => item.arm === 'A')).toHaveLength(4)
    expect(new Set(experiment.items.map(item => item.card.id)).size).toBe(8)
    expect(experiment.items.some(item => item.card.id === 'sustain')).toBe(false)
    for (let i = 0; i < 8; i += 2) {
      expect(experiment.items[i].card.partOfSpeech).toBe(experiment.items[i + 1].card.partOfSpeech)
      expect(Math.abs(experiment.items[i].difficulty - experiment.items[i + 1].difficulty)).toBeLessThanOrEqual(1)
    }
    expect(experiment.budgetMs).toBe(180000)
    expect(JSON.stringify(seedWords)).toBe(before)
    expect(seedWords).toHaveLength(605)
  })
  it('requires enough unfamiliar, matchable items', () => {
    expect(() => createABExperiment(seedWords, ['discern'], () => 0.1, start)).toThrow('至少选择8个')
  })
  it('schedules by elapsed hours, never by midnight or an unverifiable reported study time', () => {
    const report = createImagePilot(true, start)
    expect(experimentCheckpoint(report, [], start + 10 * DAY)).toBeNull()
    const pilot = { ...report, completedAt: { pilot: start } }
    expect(experimentCheckpoint(pilot, [], start + 23 * 3600000)).toBeNull()
    expect(experimentCheckpoint(pilot, [], start + 25 * 3600000)?.id).toBe('24h')
  })
  it('does not backfill missed checkpoints or present several contaminated tests in one visit', () => {
    const pilot = { ...createImagePilot(false, start), completedAt: { pilot: start }, activeMs: { pilot: 60000 } }
    const point = experimentCheckpoint(pilot, [], start + 8 * DAY)
    expect(point?.id).toBe('7d')
    const attempt = learningEvent({ wordId: pilot.items[0].card.id, kind: 'recall', cue: 'none', direction: 'en-zh', outcome: 'correct', assessment: 'typed-match', activeMs: 500, sessionId: 'delayed', experimentId: pilot.id, checkpoint: '7d' }, start + 8 * DAY)
    const state = { ...emptyLearningState(), events: [attempt] }
    expect(experimentCheckpoint(pilot, [attempt], start + 8 * DAY)).toBeNull()
    const results = experimentResults(pilot, state)
    expect(results[0].groups[0].tested).toBe(0)
    expect(results[1].groups[0]).toMatchObject({ tested: 1, correct: 1, allocated: 3, retainedPerMinute: null, actualDelayDays: 8 })
  })
  it('rejects early and hinted attempts as delayed independent evidence', () => {
    const pilot = { ...createImagePilot(false, start), completedAt: { pilot: start }, activeMs: { pilot: 60000 } }
    const event = learningEvent({ wordId: pilot.items[0].card.id, kind: 'recall', cue: 'none', direction: 'en-zh', outcome: 'correct', assessment: 'typed-match', activeMs: 500, sessionId: 'early', experimentId: pilot.id, checkpoint: '7d' }, start + DAY)
    expect(experimentResults(pilot, { ...emptyLearningState(), events: [event] })[1].groups[0].tested).toBe(0)
    expect(experimentResults(pilot, { ...emptyLearningState(), events: [{ ...event, at: start + 8 * DAY, cue: 'image' }] })[1].groups[0].tested).toBe(0)
  })
  it('keeps study words out of the ordinary queue until the final test or explicit withdrawal', () => {
    const experiment = createABExperiment(seedWords, semanticCards.map(card => card.id), () => 0.25, start)
    experiment.completedAt = { A: start, B: start }
    const state = { ...emptyLearningState(), experiments: [experiment] }
    expect(reservedExperimentWords(state).size).toBe(8)
    const events = experiment.items.map(item => learningEvent({ wordId: item.card.id, kind: 'recall', cue: 'none', direction: 'en-zh', outcome: 'correct', assessment: 'typed-match', activeMs: 1000, sessionId: 'final', experimentId: experiment.id, checkpoint: '14d' }, start + 14 * DAY + 1000))
    expect(reservedExperimentWords({ ...state, events }).size).toBe(0)
    expect(reservedExperimentWords({ ...state, events: events.slice(1) }).size).toBe(8)
    expect(reservedExperimentWords({ ...state, experiments: [{ ...experiment, closedAt: start + DAY }] }).size).toBe(0)
    expect(experimentCheckpoint({ ...experiment, closedAt: start + DAY }, [], start + 7 * DAY)).toBeNull()
  })
  it('separates transfer self-ratings and confirmed confusion from the first independent-recall score', () => {
    const pilot = createImagePilot(false, start)
    const card = semanticCards.find(card => card.id === 'compensate')!
    const experiment = { ...pilot, kind: 'ab14' as const, items: [{ card, arm: 'A' as const, oldHook: '', difficulty: 3, level: 'B2' }], armOrder: ['A' as const], activeMs: { A: 60000 }, completedAt: { A: start } }
    const failed = learningEvent({ wordId: card.id, kind: 'recall', cue: 'none', direction: 'en-zh', answer: '竞争', outcome: 'incorrect', assessment: 'self', activeMs: 1000, sessionId: 'test', experimentId: experiment.id, checkpoint: '14d' }, start + 14 * DAY)
    const transfer = learningEvent({ wordId: card.id, kind: 'usage', cue: 'sentence', direction: 'zh-en', outcome: 'correct', assessment: 'self', activeMs: 1000, sessionId: 'transfer', experimentId: experiment.id, checkpoint: '14d' }, start + 14 * DAY + 10000)
    const result = experimentResults(experiment, { ...emptyLearningState(), events: [failed, transfer] })[2].groups[0]
    expect(result).toMatchObject({ tested: 1, correct: 0, learningMinutes: 1, confusions: 1, retainedPerMinute: 0, transfer: { tested: 1, correct: 1, selfRated: 1 } })
    expect(experimentResults(experiment, { ...emptyLearningState(), events: [failed, { ...transfer, at: start + DAY }] })[2].groups[0].transfer.tested).toBe(0)
  })
})
