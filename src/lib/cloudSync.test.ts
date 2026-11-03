import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getProgress: vi.fn(), getSettings: vi.fn(), getStats: vi.fn(), getGrammarProgress: vi.fn(),
  saveProgress: vi.fn(), saveSettings: vi.fn(), saveStats: vi.fn(), saveGrammarProgress: vi.fn(),
  maybeSingle: vi.fn(), upsert: vi.fn(),
  rpc: vi.fn(),
  getLearningProtocol: vi.fn(), saveLearningProtocol: vi.fn(),
}))
vi.mock('./db', () => mocks)
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mocks.rpc,
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
    mocks.getLearningProtocol.mockResolvedValue({ schemaVersion: 1, events: [], experiments: [] })
    mocks.upsert.mockResolvedValue({ error: null })
    mocks.rpc.mockReturnValue({ single: mocks.maybeSingle })
  })
  afterEach(() => vi.unstubAllEnvs())
  it('uploads grammar alongside vocabulary in the same user snapshot', async () => {
    const { uploadLocalSnapshot } = await import('./cloudSync')
    await uploadLocalSnapshot()
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'test-user', payload: expect.objectContaining({ schemaVersion: 1, grammar }) }))
  })
  it('serializes overlapping snapshots and reads the newest local state after the in-flight write', async () => {
    let release!: (value: { error: null }) => void, entered!: () => void
    const started = new Promise<void>(resolve => { entered = resolve })
    const pending = new Promise<{ error: null }>(resolve => { release = resolve })
    mocks.getProgress.mockResolvedValue([{ wordId: 'discern', seen: 1 }])
    mocks.upsert.mockImplementationOnce(() => { entered(); return pending }).mockResolvedValue({ error: null })
    const { uploadLocalSnapshot } = await import('./cloudSync')
    const first = uploadLocalSnapshot(); await started
    mocks.getProgress.mockResolvedValue([{ wordId: 'discern', seen: 2 }])
    const second = uploadLocalSnapshot()
    expect(mocks.upsert).toHaveBeenCalledOnce()
    release({ error: null })
    await Promise.all([first, second])
    expect(mocks.upsert).toHaveBeenCalledTimes(2)
    expect(mocks.upsert.mock.calls[1][0].payload.progress).toEqual([{ wordId: 'discern', seen: 2 }])
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
    expect(mocks.saveLearningProtocol).not.toHaveBeenCalled()
  })
  it('preserves and restores protocol evidence without changing the snapshot version', async () => {
    const learningProtocol = { schemaVersion: 1, events: [], experiments: [{ id: 'pilot' }] }
    mocks.getLearningProtocol.mockResolvedValue(learningProtocol)
    const { buildLocalSnapshot, restoreCloudSnapshot } = await import('./cloudSync')
    expect(await buildLocalSnapshot()).toMatchObject({ schemaVersion: 1, learningProtocol })
    mocks.maybeSingle.mockResolvedValue({ data: { payload: { progress: [], settings: {}, stats: {}, learningProtocol } }, error: null })
    await restoreCloudSnapshot()
    expect(mocks.saveLearningProtocol).toHaveBeenCalledWith(learningProtocol)
  })
  it('uploads a daily report through the authenticated RPC without client-supplied user identity', async () => {
    const payload = (await import('../test/dailyAnalysisFixtures')).report()
    mocks.maybeSingle.mockResolvedValue({ data: { id: 'daily-job', status: 'pending' }, error: null })
    const { uploadDailyLearningReport } = await import('./cloudSync')
    expect(await uploadDailyLearningReport(payload)).toMatchObject({ id: 'daily-job', status: 'pending' })
    expect(mocks.rpc).toHaveBeenCalledWith('upload_daily_learning_report', { p_payload: payload })
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
  it('propagates backend errors instead of returning an upload success', async () => {
    const payload = (await import('../test/dailyAnalysisFixtures')).report()
    const error = { code: 'PGRST202' }
    mocks.maybeSingle.mockResolvedValue({ data: null, error })
    const { uploadDailyLearningReport } = await import('./cloudSync')
    await expect(uploadDailyLearningReport(payload)).rejects.toBe(error)
  })
})
