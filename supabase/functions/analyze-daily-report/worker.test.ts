import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDraftWriter, createHandler, runAnalysis, type AnalysisStore, type ClaimedJob } from './worker'
import { report } from '../../../src/test/dailyAnalysisFixtures'

const job: ClaimedJob = { id: '00000000-0000-0000-0000-000000000001', user_id: 'owner', report_date: '2026-10-28', revision: 1, lease_token: 'lease' }
let store: AnalysisStore
beforeEach(() => {
  store = { claim: vi.fn().mockResolvedValue(job), reports: vi.fn().mockResolvedValue([{ report_date: job.report_date, revision: 1, payload: report(undefined, false) }]), finish: vi.fn().mockResolvedValue(true), fail: vi.fn().mockResolvedValue(undefined) }
})
describe('durable report worker', () => {
  it('requires its server secret before any database access', async () => {
    const response = await createHandler('server-secret', store)(new Request('https://example.test', { method: 'POST', body: '{}' }))
    expect(response.status).toBe(401)
    expect(store.claim).not.toHaveBeenCalled()
  })
  it('handles a webhook and saves analysis for the claimed report', async () => {
    const response = await createHandler('server-secret', store)(new Request('https://example.test', { method: 'POST', headers: { 'x-analysis-secret': 'server-secret' }, body: JSON.stringify({ job_id: job.id }) }))
    expect(response.status).toBe(200)
    expect(store.claim).toHaveBeenCalledWith(job.id)
    expect(store.reports).toHaveBeenCalledWith('owner', '2026-10-15', '2026-10-28')
    expect(store.finish).toHaveBeenCalledWith(job, expect.objectContaining({ reviewWords: 15, planDate: '2026-10-29' }))
  })
  it('does not analyze a superseded payload, and a duplicate delivery is a no-op', async () => {
    vi.mocked(store.reports).mockResolvedValue([{ report_date: job.report_date, revision: 2, payload: report() }])
    expect(await runAnalysis(store, job.id)).toBe('superseded')
    expect(store.finish).not.toHaveBeenCalled()
    vi.mocked(store.claim).mockResolvedValue(null)
    expect(await runAnalysis(store, job.id)).toBe('idle')
  })
  it('retains the deterministic plan when the AI provider fails', async () => {
    expect(await runAnalysis(store, job.id, vi.fn().mockRejectedValue(new Error('provider unavailable')))).toBe('completed')
    expect(store.finish).toHaveBeenCalledWith(job, expect.objectContaining({ draftStatus: 'unavailable', cardDrafts: [] }))
    expect(store.fail).not.toHaveBeenCalled()
  })
  it('marks invalid payloads failed for retry', async () => {
    vi.mocked(store.reports).mockResolvedValue([{ report_date: job.report_date, revision: 1, payload: {} }])
    expect(await runAnalysis(store, job.id)).toBe('failed')
    expect(store.fail).toHaveBeenCalledWith(job)
    expect(store.finish).not.toHaveBeenCalled()
  })
  it('does not publish results after a concurrent upload invalidates the lease', async () => {
    vi.mocked(store.finish).mockResolvedValue(false)
    expect(await runAnalysis(store, job.id)).toBe('superseded')
  })
  it('bounds AI context and validates model output', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify({ drafts: [{ wordId: 'not-in-input', hook: '虚构内容', example: 'wrong', translation: '错误' }] }) } }] }))
    await expect(createDraftWriter('private-key', 'configured-model', request)(report().vocabulary.results.slice(0, 3))).rejects.toThrow('invalid_card_drafts')
    const body = JSON.parse(request.mock.calls[0][1].body)
    expect(body.max_completion_tokens).toBe(1500)
    expect(JSON.parse(body.messages[1].content)).toHaveLength(3)
  })
})
