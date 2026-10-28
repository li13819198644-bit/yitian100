import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getProgress: vi.fn(), getSettings: vi.fn(), getStats: vi.fn(), getGrammarProgress: vi.fn(),
  saveProgress: vi.fn(), saveSettings: vi.fn(), saveStats: vi.fn(), saveGrammarProgress: vi.fn(),
  maybeSingle: vi.fn(), upsert: vi.fn(),
  rpc: vi.fn(),
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
    mocks.upsert.mockResolvedValue({ error: null })
    mocks.rpc.mockReturnValue({ single: mocks.maybeSingle })
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
