import type { VocabWord } from '../types'
import { imagePilotCards, semanticCards } from '../data/semanticCards'
import { DAY, newId, type LearningEvent, type LearningState, type VocabularyExperiment } from './learningProtocol'

export const checkpoints = [{ id: '24h', delay: DAY }, { id: '7d', delay: 7 * DAY }, { id: '14d', delay: 14 * DAY }] as const

export function createImagePilot(continueReport: boolean, now = Date.now()): VocabularyExperiment {
  return { id: newId(), kind: 'image-pilot', createdAt: now, updatedAt: now, items: imagePilotCards.map(card => ({ card, arm: 'pilot', oldHook: '', difficulty: 1, level: 'pilot' })), armOrder: ['pilot'], budgetMs: 0, activeMs: {}, completedAt: {}, ...(continueReport ? { priorReport: { correct: 3, total: 3, source: 'conversation', learnedAt: null, verified: false } as const } : {}) }
}

// Randomize within roughly matched POS/difficulty pairs, and randomize arm order.
// These small groups remain exploratory; this does not establish equivalence or causality.
export function createABExperiment(words: VocabWord[], unfamiliarIds: string[], random: () => number = Math.random, now = Date.now()): VocabularyExperiment {
  const pool = words.filter(word => unfamiliarIds.includes(word.id) && semanticCards.some(card => card.id === word.id && !card.partOfSpeech.includes('／')))
  const shuffled = [...pool].sort((a, b) => a.id.localeCompare(b.id))
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] }
  const items: VocabularyExperiment['items'] = []
  while (shuffled.length > 1 && items.length < 8) {
    const word = shuffled.shift()!, card = semanticCards.find(card => card.id === word.id)!
    const match = shuffled.map((candidate, index) => ({ candidate, index, card: semanticCards.find(card => card.id === candidate.id)! }))
      .filter(item => item.card.partOfSpeech === card.partOfSpeech && Math.abs(item.candidate.difficulty - word.difficulty) <= 1)
      .sort((a, b) => Number(b.candidate.level === word.level) - Number(a.candidate.level === word.level) || Math.abs(a.candidate.word.length - word.word.length) - Math.abs(b.candidate.word.length - word.word.length))[0]
    if (!match) continue
    shuffled.splice(match.index, 1)
    const firstArm = random() < 0.5 ? 'A' : 'B'
    items.push({ card, arm: firstArm, oldHook: word.evilHook ?? '', difficulty: word.difficulty, level: word.level }, { card: match.card, arm: firstArm === 'A' ? 'B' : 'A', oldHook: match.candidate.evilHook ?? '', difficulty: match.candidate.difficulty, level: match.candidate.level })
  }
  if (items.length !== 8) throw new Error('请至少选择8个确认尚未掌握、词性和难度可配对的词；可以多选几个。')
  return { id: newId(), kind: 'ab14', createdAt: now, updatedAt: now, items, armOrder: random() < 0.5 ? ['A', 'B'] : ['B', 'A'], budgetMs: 180000, activeMs: {}, completedAt: {} }
}

export function experimentCheckpoint(experiment: VocabularyExperiment, events: LearningEvent[], now = Date.now()) {
  if (experiment.closedAt) return null
  const completed = experiment.armOrder.map(arm => experiment.completedAt[arm])
  if (completed.some(value => value == null)) return null
  const anchor = Math.max(...completed as number[])
  const due = checkpoints.filter(point => anchor + point.delay <= now).at(-1)
  if (!due) return null
  const existing = events.filter(event => event.experimentId === experiment.id && event.checkpoint === due.id && event.kind === 'recall' && event.direction === 'en-zh')
  if (existing.length) return null
  return { ...due, anchor, actualDelayMs: now - anchor }
}

export function reservedExperimentWords(state: LearningState) {
  return new Set(state.experiments.filter(experiment => {
    if (experiment.kind !== 'ab14' || experiment.closedAt) return false
    const anchors = experiment.armOrder.map(arm => experiment.completedAt[arm])
    const anchor = anchors.some(value => value == null) ? null : Math.max(...anchors as number[])
    const tested = new Set(state.events.filter(event => event.experimentId === experiment.id && event.kind === 'recall' && event.checkpoint === '14d' && event.cue === 'none' && event.direction === 'en-zh' && anchor != null && event.at - anchor >= 14 * DAY).map(event => event.wordId))
    return experiment.items.some(item => !tested.has(item.card.id))
  }).flatMap(experiment => experiment.items.map(item => item.card.id)))
}

export function experimentResults(experiment: VocabularyExperiment, state: LearningState) {
  return checkpoints.map(point => ({
    ...point,
    groups: experiment.armOrder.map(arm => {
      const items = experiment.items.filter(item => item.arm === arm)
      const first = new Map<string, LearningEvent>()
      for (const event of [...state.events].sort((a, b) => a.at - b.at)) {
        if (event.experimentId !== experiment.id || event.checkpoint !== point.id || event.kind !== 'recall' || event.cue !== 'none' || event.direction !== 'en-zh' || !items.some(item => item.card.id === event.wordId)) continue
        const anchor = experiment.completedAt[arm]
        if (anchor == null || event.at - anchor < point.delay) continue
        if (!first.has(event.wordId)) first.set(event.wordId, event)
      }
      const tested = [...first.values()]
      const correct = tested.filter(event => event.outcome === 'correct').length
      const usages = new Map<string, LearningEvent>()
      for (const event of [...state.events].sort((a, b) => a.at - b.at)) if (event.experimentId === experiment.id && event.checkpoint === point.id && event.kind === 'usage' && items.some(item => item.card.id === event.wordId) && experiment.completedAt[arm] != null && event.at - experiment.completedAt[arm]! >= point.delay && !usages.has(event.wordId)) usages.set(event.wordId, event)
      const confusedWith: Record<string, string[]> = { compensate: ['竞争', 'compete'], oversight: ['远见', 'foresight'] }
      const confusions = tested.filter(event => event.outcome === 'incorrect' && confusedWith[event.wordId]?.includes(event.answer?.trim().toLowerCase() ?? '')).length
      const minutes = (experiment.activeMs[arm] ?? 0) / 60000
      const intervening = tested.flatMap(attempt => state.events.filter(event => event.wordId === attempt.wordId && event.at > experiment.completedAt[arm]! && event.at < attempt.at))
      const latestGaps = tested.map(attempt => {
        const previous = state.events.filter(event => event.wordId === attempt.wordId && event.at < attempt.at).sort((a, b) => b.at - a.at)[0]
        return (attempt.at - Math.max(experiment.completedAt[arm]!, previous?.at ?? 0)) / DAY
      })
      return { arm, allocated: items.length, tested: tested.length, correct, pending: tested.filter(event => event.outcome === 'needs-review').length, learningMinutes: minutes, confusions, transfer: { tested: usages.size, correct: [...usages.values()].filter(event => event.outcome === 'correct').length, selfRated: usages.size },
        selfRated: tested.filter(event => event.assessment === 'self').length,
        retainedPerMinute: tested.length === items.length && !tested.some(event => event.outcome === 'needs-review') && minutes > 0 ? correct / minutes : null,
        actualDelayDays: tested.length ? Math.min(...tested.map(event => (event.at - experiment.completedAt[arm]!) / DAY)) : null,
        interveningExposures: new Set(intervening.map(event => `${event.wordId}/${event.sessionId}`)).size,
        latestExposureGapDays: latestGaps.length ? Math.min(...latestGaps) : null,
      }
    }),
  }))
}
