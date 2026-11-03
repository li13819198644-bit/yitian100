import type { SemanticCard } from '../data/semanticCards'

export type LearningCue = 'none' | 'sentence' | 'image' | 'contrast'
export type RecallDirection = 'en-zh' | 'zh-en'
export type RecallEffort = 'easy' | 'thinking' | 'difficult'
export type LearningOutcome = 'correct' | 'incorrect' | 'needs-review'
export interface LearningEvent {
  id: string
  wordId: string
  senseId?: string
  at: number
  updatedAt: number
  kind: 'encoding' | 'recall' | 'context' | 'feedback' | 'contrast' | 'usage'
  cue: LearningCue
  direction: RecallDirection
  outcome: LearningOutcome | null
  assessment: 'self' | 'typed-match'
  answer?: string
  attemptId?: string
  effort?: RecallEffort
  activeMs: number
  sessionId: string
  experimentId?: string
  checkpoint?: 'initial' | 'reverse' | '24h' | '7d' | '14d'
}
export interface ExperimentItem {
  card: SemanticCard
  arm: 'A' | 'B' | 'pilot'
  oldHook: string
  difficulty: number
  level: string
}
export interface VocabularyExperiment {
  id: string
  kind: 'image-pilot' | 'ab14'
  createdAt: number
  updatedAt: number
  items: ExperimentItem[]
  armOrder: Array<'A' | 'B' | 'pilot'>
  budgetMs: number
  activeMs: Partial<Record<'A' | 'B' | 'pilot', number>>
  completedAt: Partial<Record<'A' | 'B' | 'pilot', number>>
  studyStep?: Partial<Record<'A' | 'B' | 'pilot', number>>
  closedAt?: number
  priorReport?: { correct: 3; total: 3; source: 'conversation'; learnedAt: null; verified: false }
}
export interface LearningState {
  schemaVersion: 1
  events: LearningEvent[]
  experiments: VocabularyExperiment[]
}
export const DAY = 86_400_000
export const emptyLearningState = (): LearningState => ({ schemaVersion: 1, events: [], experiments: [] })
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // getRandomValues is also available on the existing HTTP LAN development setup.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = bytes[6] & 15 | 64; bytes[8] = bytes[8] & 63 | 128
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function learningEvent(input: Omit<LearningEvent, 'id' | 'at' | 'updatedAt'>, now = Date.now()): LearningEvent {
  return { ...input, id: newId(), at: now, updatedAt: now, activeMs: Math.max(0, input.activeMs) }
}

// Old backups have no protocol field. Missing evidence stays missing.
export function mergeLearningStates(...values: Array<LearningState | undefined>): LearningState {
  const events = new Map<string, LearningEvent>(), experiments = new Map<string, VocabularyExperiment>()
  for (const value of values) {
    if (value?.schemaVersion !== 1 || !Array.isArray(value.events) || !Array.isArray(value.experiments)) continue
    for (const event of value.events) {
      if (!event || typeof event.id !== 'string' || typeof event.wordId !== 'string' || !Number.isFinite(event.at) || !Number.isFinite(event.updatedAt) || !Number.isFinite(event.activeMs) || event.activeMs < 0) continue
      const previous = events.get(event.id)
      if (!previous || previous.updatedAt < event.updatedAt) events.set(event.id, event)
    }
    for (const experiment of value.experiments) {
      if (!experiment || typeof experiment.id !== 'string' || !Array.isArray(experiment.items) || !Number.isFinite(experiment.updatedAt)) continue
      const previous = experiments.get(experiment.id)
      if (!previous) experiments.set(experiment.id, experiment)
      else {
        const latest = previous.updatedAt > experiment.updatedAt ? previous : experiment
        const activeMs = { ...previous.activeMs }, completedAt = { ...previous.completedAt }, studyStep = { ...previous.studyStep }
        for (const arm of experiment.armOrder) {
          activeMs[arm] = Math.max(previous.activeMs[arm] ?? 0, experiment.activeMs[arm] ?? 0)
          if (experiment.completedAt[arm] != null) completedAt[arm] = Math.max(previous.completedAt[arm] ?? 0, experiment.completedAt[arm]!)
          studyStep[arm] = Math.max(previous.studyStep?.[arm] ?? 0, experiment.studyStep?.[arm] ?? 0)
        }
        experiments.set(experiment.id, { ...latest, activeMs, completedAt, studyStep, closedAt: Math.max(previous.closedAt ?? 0, experiment.closedAt ?? 0) || undefined })
      }
    }
  }
  return { schemaVersion: 1, events: [...events.values()].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)), experiments: [...experiments.values()] }
}

export function gradeRecall(card: SemanticCard, answer: string, direction: RecallDirection): LearningOutcome {
  const normalized = answer.trim().toLowerCase().replace(/[。.!！?？]+$/g, '').replace(/\s+/g, ' ')
  if (!normalized || ['不会', '不知道', '想不起来'].includes(normalized)) return 'incorrect'
  if (direction === 'zh-en') {
    const nounForms: Record<string, string[]> = { hinge: ['hinges'], latch: ['latches'], shard: ['shards'] }
    const answer = card.partOfSpeech === '名词' ? normalized.replace(/^(a|an|the) /, '') : normalized
    return [card.word.toLowerCase(), ...(nounForms[card.word] ?? [])].includes(answer) ? 'correct' : 'incorrect'
  }
  const parts = normalized.split(/[、，,；;]/).map(part => part.trim()).filter(Boolean)
  return parts.length > 0 && parts.every(part => card.aliases.includes(part)) ? 'correct' : 'needs-review'
}

export function nextIndependentReview(events: LearningEvent[], wordId: string, now = Date.now()) {
  const history = events.filter(event => event.wordId === wordId && !event.experimentId).sort((a, b) => a.at - b.at)
  const last = history.at(-1)
  if (!last) return { at: now, stage: 'encode' as const }
  const recalls = history.filter(event => event.kind === 'recall' && event.cue === 'none' && event.direction === 'en-zh')
  const recall = recalls.at(-1)
  const exposure = history.filter(event => ['encoding', 'feedback', 'context', 'contrast'].includes(event.kind)).at(-1)
  if (recall && recall.outcome !== 'correct') {
    const date = new Date(now).toDateString()
    const failures = recalls.filter(event => new Date(event.at).toDateString() === date && event.outcome === 'incorrect').length
    if (failures >= 2) { const morning = new Date(now); morning.setDate(morning.getDate() + 1); morning.setHours(9, 0, 0, 0); return { at: morning.getTime(), stage: 'recall' as const } }
    return { at: recall.at + 60_000, stage: 'encode' as const }
  }
  if (!recall || exposure && exposure.at >= recall.at && !(exposure.kind === 'feedback' && exposure.attemptId === recall.id && recall.outcome === 'correct')) return { at: (exposure?.at ?? last.at) + 60_000, stage: 'recall' as const }
  // Same-day repeats cannot grow the spacing. This is a starting heuristic, not an optimum.
  const failureAt = recalls.filter(event => event.outcome === 'incorrect').at(-1)?.at ?? 0
  const days = new Set(recalls.filter(event => event.outcome === 'correct' && event.at > failureAt).map(event => new Date(event.at).toDateString())).size
  const interval = recall.effort === 'difficult' || recall.effort === 'thinking' ? DAY : Math.min(30, 2 ** Math.min(Math.max(0, days - 1), 5)) * DAY
  return { at: recall.at + interval, stage: 'recall' as const }
}

export function independentReady(events: LearningEvent[], wordId: string, now = Date.now()) {
  const plan = nextIndependentReview(events, wordId, now)
  if (plan.at > now) return false
  const lastExposure = events.filter(event => event.wordId === wordId && !event.experimentId && ['encoding', 'feedback', 'context', 'contrast'].includes(event.kind)).at(-1)
  if (!lastExposure || plan.stage === 'encode') return true
  return new Set(events.filter(event => !event.experimentId && event.wordId !== wordId && event.at > lastExposure.at).map(event => event.wordId)).size >= 3 || now - lastExposure.at >= 10 * 60_000
}

export function learningEvidenceSummary(events: LearningEvent[], now = Date.now()) {
  const first = new Map<string, LearningEvent>()
  for (const event of [...events].sort((a, b) => a.at - b.at)) {
    if (event.kind !== 'recall' && event.kind !== 'context' && event.kind !== 'usage') continue
    if (!['correct', 'incorrect', 'needs-review'].includes(event.outcome ?? '')) continue
    const key = `${new Date(event.at).toDateString()}/${event.wordId}/${event.senseId ?? 'unspecified'}/${event.direction}/${event.cue}/${event.experimentId ?? ''}/${event.checkpoint ?? ''}`
    if (!first.has(key)) first.set(key, event)
  }
  const retained = (delay: number) => {
    const eligible = [...first.values()].filter(event => {
      if (event.kind !== 'recall' || event.cue !== 'none' || event.direction !== 'en-zh' || event.outcome === 'needs-review') return false
      if (event.experimentId && !['24h', '7d', '14d'].includes(event.checkpoint ?? '')) return false
      const exposure = events.filter(previous => previous.wordId === event.wordId && previous.at < event.at).sort((a, b) => b.at - a.at)[0]
      return !!exposure && event.at - exposure.at >= delay
    })
    return { tested: eligible.length, correct: eligible.filter(event => event.outcome === 'correct').length, selfRated: eligible.filter(event => event.assessment === 'self').length }
  }
  return {
    delayed24h: retained(DAY), delayed7d: retained(7 * DAY), delayed14d: retained(14 * DAY),
    context: [...first.values()].filter(event => event.cue === 'sentence').length,
    reverse: [...first.values()].filter(event => event.kind === 'recall' && event.direction === 'zh-en').length,
    usage: { tested: [...first.values()].filter(event => event.kind === 'usage').length, correct: [...first.values()].filter(event => event.kind === 'usage' && event.outcome === 'correct').length, selfRated: [...first.values()].filter(event => event.kind === 'usage').length },
    activeMinutes: events.filter(event => new Date(event.at).toDateString() === new Date(now).toDateString()).reduce((sum, event) => sum + event.activeMs, 0) / 60000,
  }
}
