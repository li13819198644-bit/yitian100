import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useDailyLearning } from './useDailyLearning'
import { report } from '../test/dailyAnalysisFixtures'

const mocks = vi.hoisted(() => ({ getDailyLearningState: vi.fn(), uploadDailyLearningReport: vi.fn(), acceptDailyWordCard: vi.fn(), restoreOriginalWordCard: vi.fn() }))
vi.mock('./cloudSync', () => mocks)
let host: HTMLDivElement, root: Root
const pending = { id: 'job-1', report_date: '2026-10-28', revision: 1, status: 'pending', result: null, created_at: '2026-10-28T12:00:00Z', updated_at: '2026-10-28T12:00:00Z' }
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
function Probe({ account }: { account: string }) {
  const learning = useDailyLearning(account)
  return <div><output>{JSON.stringify(learning.jobs)}</output><p>{learning.message}</p><button onClick={() => void learning.upload(report())}>upload</button></div>
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  localStorage.clear(); vi.resetAllMocks()
  mocks.getDailyLearningState.mockResolvedValue({ jobs: [], cards: [] })
  mocks.uploadDailyLearningReport.mockResolvedValue(pending)
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })
it('ignores an old load that finishes after a successful upload', async () => {
  const old = deferred<{ jobs: []; cards: [] }>()
  mocks.getDailyLearningState.mockReturnValueOnce(old.promise)
  await act(async () => root.render(<Probe account="one@example.com" />))
  await act(async () => host.querySelector('button')!.click())
  expect(host.querySelector('output')?.textContent).toContain('job-1')
  await act(async () => old.resolve({ jobs: [], cards: [] }))
  expect(host.querySelector('output')?.textContent).toContain('job-1')
})
it('does not publish an upload result into another account after switching', async () => {
  const upload = deferred<typeof pending>()
  mocks.uploadDailyLearningReport.mockReturnValueOnce(upload.promise)
  await act(async () => root.render(<Probe account="one@example.com" />))
  await act(async () => host.querySelector('button')!.click())
  await act(async () => root.render(<Probe account="two@example.com" />))
  await act(async () => upload.resolve(pending))
  expect(host.querySelector('output')?.textContent).toBe('[]')
  expect(localStorage.getItem('yitian100:daily-learning:two@example.com') ?? '').not.toContain('job-1')
})
it('deduplicates rapid upload clicks and preserves the cached plan when offline', async () => {
  localStorage.setItem('yitian100:daily-learning:one@example.com', JSON.stringify({ jobs: [pending], cards: [] }))
  mocks.getDailyLearningState.mockRejectedValue(new Error('offline'))
  const upload = deferred<typeof pending>()
  mocks.uploadDailyLearningReport.mockReturnValueOnce(upload.promise)
  await act(async () => root.render(<Probe account="one@example.com" />))
  expect(host.querySelector('output')?.textContent).toContain('job-1')
  await act(async () => { host.querySelector('button')!.click(); host.querySelector('button')!.click() })
  expect(mocks.uploadDailyLearningReport).toHaveBeenCalledOnce()
  await act(async () => upload.resolve(pending))
})
