import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { seedWords } from '../data/seedWords'
import { createProgress, scheduleReview } from './srs'
import { makeObservation } from './memoryEvidence'
import { localDateKey, recordStudyResult } from './studyStats'

const mocks = vi.hoisted(() => ({
  getProgress: vi.fn(), getSettings: vi.fn(), getStats: vi.fn(), getGrammarProgress: vi.fn(),
  saveProgress: vi.fn(), saveSettings: vi.fn(), saveStats: vi.fn(), saveGrammarProgress: vi.fn(),
  maybeSingle: vi.fn(), upsert: vi.fn(),
}))
vi.mock('./db', () => mocks)
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'test-user' } }, error: null }) },
    from: () => ({
      upsert: mocks.upsert,
      select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
    }),
  }),
}))

describe('grammar cloud snapshot compatibility', () => {
  const grammar = [{ questionId: 'tense-1', attempts: 1, correct: 0, firstCorrect: false, lastCorrect: false, reviewStage: 0, nextReviewAt: 200, updatedAt: 100 }]
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
    mocks.getProgress.mockResolvedValue([])
    mocks.getSettings.mockResolvedValue({ dailyTarget: 100 })
    mocks.getStats.mockResolvedValue({ todaySeen: [] })
    mocks.getGrammarProgress.mockResolvedValue(grammar)
    mocks.upsert.mockResolvedValue({ error: null })
  })
  afterEach(() => vi.unstubAllEnvs())
  it('uploads grammar alongside vocabulary in the same user snapshot', async () => {
    const { uploadLocalSnapshot } = await import('./cloudSync')
    await uploadLocalSnapshot()
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'test-user', payload: expect.objectContaining({ schemaVersion: 1, grammar }) }))
  })
  it('restores grammar when present', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { payload: { progress: [], settings: {}, stats: {}, grammar } }, error: null })
    const { restoreCloudSnapshot } = await import('./cloudSync')
    await restoreCloudSnapshot()
    expect(mocks.saveGrammarProgress).toHaveBeenCalledWith(grammar)
  })
  it('does not erase local grammar when restoring an older snapshot', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { payload: { progress: [], settings: {}, stats: {} } }, error: null })
    const { restoreCloudSnapshot } = await import('./cloudSync')
    await restoreCloudSnapshot()
    expect(mocks.saveGrammarProgress).not.toHaveBeenCalled()
  })
  it('JSON-round-trips additive recall evidence, all IDs, exclusions, settings and historical modes', async () => {
    const now = new Date(2026, 9, 7, 12).getTime()
    const observation = makeObservation(undefined, now, true, 500)
    const progress = seedWords.map((word, index) => index === 0
      ? { ...scheduleReview(createProgress(word.id, now), 'unknown', now, observation), excluded: true }
      : { ...createProgress(word.id, now), seen: 1 })
    let stats = { todayDate: localDateKey(new Date(now)), todaySeen: [] as string[], combo: 0, bestCombo: 0, streak: 0 }
    stats = recordStudyResult(stats, progress[0].wordId, false, 'self', now, { rating: 'unknown', session: 'learn', isNew: true, observation })
    for (const mode of ['choice', 'spelling', 'sentence', 'assisted'] as const) stats = recordStudyResult(stats, progress[1].wordId, true, mode, now)
    const settings = { dailyTarget: 200, dailyCapacity: 200 }
    mocks.getProgress.mockResolvedValue(progress); mocks.getStats.mockResolvedValue(stats); mocks.getSettings.mockResolvedValue(settings)
    const { uploadLocalSnapshot, restoreCloudSnapshot } = await import('./cloudSync')
    const snapshot = JSON.parse(JSON.stringify(await uploadLocalSnapshot()))
    mocks.maybeSingle.mockResolvedValue({ data: { payload: snapshot }, error: null })
    await restoreCloudSnapshot()
    expect(mocks.saveProgress).toHaveBeenCalledTimes(605)
    expect(mocks.saveProgress).toHaveBeenCalledWith(progress[0])
    expect(snapshot.progress.map((item: { wordId: string }) => item.wordId)).toEqual(seedWords.map((word) => word.id))
    expect(mocks.saveStats).toHaveBeenCalledWith(stats)
    expect(mocks.saveSettings).toHaveBeenCalledWith(settings)
    expect(mocks.saveGrammarProgress).toHaveBeenCalledWith(grammar)
  })
})
