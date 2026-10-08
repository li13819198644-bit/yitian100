import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fakeIndexedDB from 'fake-indexeddb'
import { seedWords } from '../data/seedWords'
import { createProgress, scheduleReview } from './srs'
import { evidenceSummary, makeObservation } from './memoryEvidence'
import { localDateKey, recordStudyResult } from './studyStats'

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  for (const [key, value] of Object.entries(fakeIndexedDB)) if (key.startsWith('IDB')) vi.stubGlobal(key, value)
  vi.stubGlobal('indexedDB', new fakeIndexedDB.IDBFactory())
})
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })
describe('additive offline storage compatibility', () => {
  it('restores old settings and history backups before seeding defaults', async () => {
    const now = Date.now()
    const stats = recordStudyResult({ todayDate: localDateKey(new Date(now)), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }, 'a', false, 'choice', now)
    localStorage.setItem('yitian100:settings', JSON.stringify({ dailyTarget: 200, autoPronounce: false }))
    localStorage.setItem('yitian100:stats', JSON.stringify(stats))
    const db = await import('./db')
    expect(await db.getSettings()).toMatchObject({ dailyTarget: 200, dailyCapacity: 200, autoPronounce: false })
    expect(await db.getStats()).toEqual(stats)
  })
  it('round-trips all 605 IDs, excluded progress, old events, grammar and personal target without inventing evidence', async () => {
    const db = await import('./db')
    const now = Date.now()
    const progress = seedWords.map((word, index) => ({ ...createProgress(word.id, now - 86_400_000), seen: 1, excluded: index === 0 }))
    for (const item of progress) await db.saveProgress(item)
    await db.saveSettings({ ...db.defaultSettings, dailyTarget: 200, dailyCapacity: 200 })
    let stats = db.defaultStats()
    for (const mode of ['choice', 'spelling', 'sentence', 'assisted'] as const) stats = recordStudyResult(stats, seedWords[0].id, true, mode, now)
    await db.saveStats(stats)
    const grammar = [{ questionId: 'tense-1', attempts: 1, correct: 0, firstCorrect: false, lastCorrect: false, reviewStage: 0, nextReviewAt: now + 1000, updatedAt: now }]
    await db.saveGrammarProgress(grammar)
    expect((await db.getWords()).map((word) => word.id).sort()).toEqual(seedWords.map((word) => word.id).sort())
    expect(await db.getProgress()).toEqual(expect.arrayContaining(progress))
    expect(await db.getProgress()).toHaveLength(605)
    expect(evidenceSummary((await db.getProgress())[0]).verifiedRecall).toBeNull()
    expect(await db.getSettings()).toMatchObject({ dailyTarget: 200, dailyCapacity: 200 })
    expect(await db.getStats()).toEqual(stats)
    expect(await db.getGrammarProgress()).toEqual(grammar)
    expect(db.defaultSettings.dailyTarget).toBe(100)
  })
  it('preserves new evidence and events through IndexedDB and JSON backup reload', async () => {
    const db = await import('./db')
    const now = Date.now()
    const observation = makeObservation(undefined, now, true, null)
    const progress = scheduleReview(createProgress(seedWords[0].id, now), 'unknown', now, observation)
    const stats = recordStudyResult(db.defaultStats(), progress.wordId, false, 'self', now, { rating: 'unknown', session: 'learn', isNew: true, observation, leechCount: 0 })
    await db.saveProgress(progress); await db.saveStats(stats)
    expect(await db.getProgress()).toEqual([progress])
    expect(await db.getStats()).toEqual(stats)
    const backup = JSON.parse(localStorage.getItem('yitian100:progress')!)
    expect(backup[0]).toEqual(progress)
    expect(progress.practiceDay).toBe(localDateKey(new Date(now)))
    vi.resetModules()
    vi.stubGlobal('indexedDB', new fakeIndexedDB.IDBFactory())
    const reloaded = await import('./db')
    expect(await reloaded.getProgress()).toEqual([progress])
  })
})
