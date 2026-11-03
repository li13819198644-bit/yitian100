import 'fake-indexeddb/auto'
import { openDB } from 'idb'
import { beforeAll, beforeEach, expect, it } from 'vitest'
import { getGrammarProgress, getLearningProtocol, getSettings, getStats, getWords, resetProgress, saveGrammarProgress, saveLearningProtocol } from './db'
import { createProgress } from './srs'
import { emptyLearningState, learningEvent } from './learningProtocol'

beforeAll(async () => { await getWords() })
beforeEach(async () => {
  localStorage.clear()
  const db = await openDB('yitian-100-words', 1)
  await db.clear('meta'); await db.clear('progress'); db.close()
})
const event = (id: string, experimentId?: string) => learningEvent({ wordId: id, kind: 'recall', cue: 'none', direction: 'en-zh', outcome: 'correct', assessment: 'self', activeMs: 1000, sessionId: 'session', experimentId })

it('commits protocol, ordinary progress and daily stats without changing seed IDs', async () => {
  const before = (await getWords()).map(word => word.id).sort()
  const progress = { ...createProgress('discern'), seen: 1, correct: 1 }
  const stats = { todayDate: '2026-11-03', todaySeen: ['discern'], combo: 1, bestCombo: 1, streak: 1 }
  const state = { ...emptyLearningState(), events: [event('discern')] }
  await saveLearningProtocol(state, progress, stats)
  const db = await openDB('yitian-100-words', 1)
  expect(await db.get('progress', 'discern')).toEqual(progress)
  expect(await db.get('meta', 'stats')).toEqual(stats)
  expect((await getLearningProtocol()).events).toHaveLength(1)
  expect((await getWords()).map(word => word.id).sort()).toEqual(before)
  expect(before).toHaveLength(605); db.close()
})
it('merges a backed-up journal with IndexedDB instead of clearing either history', async () => {
  const older = event('discern'), newer = event('reluctant')
  await saveLearningProtocol({ ...emptyLearningState(), events: [older] })
  localStorage.setItem('yitian100:learning-protocol', JSON.stringify({ ...emptyLearningState(), events: [newer] }))
  expect((await getLearningProtocol()).events.map(item => item.id).sort()).toEqual([older.id, newer.id].sort())
})
it('restores original settings and daily records from local backup before seed initialization', async () => {
  localStorage.setItem('yitian100:settings', JSON.stringify({ dailyTarget: 200, reliefMode: false, learningStrategy: 'legacy' }))
  localStorage.setItem('yitian100:stats', JSON.stringify({ todayDate: 'past', todaySeen: [], combo: 0, bestCombo: 10, streak: 4, dailyHistory: [{ date: '2026-10-01', attempts: 1, correct: 0, firstAnswers: {} }] }))
  expect(await getSettings()).toMatchObject({ dailyTarget: 200, reliefMode: false, learningStrategy: 'legacy' })
  expect((await getStats()).dailyHistory).toHaveLength(1)
})
it('ordinary progress reset preserves independent experiments and grammar', async () => {
  await saveLearningProtocol({ ...emptyLearningState(), events: [event('discern'), event('pilot:hinge', 'pilot')] })
  await saveGrammarProgress([{ questionId: 'grammar', attempts: 1, correct: 1, firstCorrect: true, lastCorrect: true, reviewStage: 1, nextReviewAt: Date.now(), updatedAt: Date.now() }])
  await resetProgress()
  expect((await getLearningProtocol()).events.map(item => item.wordId)).toEqual(['pilot:hinge'])
  expect(await getGrammarProgress()).toHaveLength(1)
  expect(await getWords()).toHaveLength(605)
})
