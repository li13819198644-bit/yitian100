import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { semanticCards } from '../data/semanticCards'
import { seedWords } from '../data/seedWords'
import { createABExperiment } from '../lib/vocabularyExperiment'
import type { VocabularyExperiment } from '../lib/learningProtocol'
import { ExperimentStudyRound } from './ExperimentStudyRound'

let host: HTMLDivElement, root: Root, latest: VocabularyExperiment
const saved = vi.fn()
const visibility = Object.getOwnPropertyDescriptor(document, 'visibilityState')
function Harness() {
  const [experiment, setExperiment] = useState(() => createABExperiment(seedWords, semanticCards.map(card => card.id), () => 0.25))
  latest = experiment
  return experiment.completedAt.A ? <p>本组计时完成</p> : <ExperimentStudyRound experiment={experiment} arm="A" onBack={() => {}} onSave={async next => { saved(next); setExperiment(next) }} />
}
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.useFakeTimers(); saved.mockReset(); Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); if (visibility) Object.defineProperty(document, 'visibilityState', visibility); else Reflect.deleteProperty(document, 'visibilityState') })
it('enforces the same three-minute foreground budget rather than completing after a few next taps', async () => {
  await act(async () => root.render(<Harness />))
  await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === '已理解，下一词')!.click())
  expect(latest.completedAt.A).toBeUndefined()
  await act(async () => vi.advanceTimersByTime(180000))
  expect(latest.activeMs.A).toBe(180000)
  expect(latest.completedAt.A).toBeDefined()
  expect(latest.completedAt.B).toBeUndefined()
  expect(host.textContent).toContain('本组计时完成')
})
it('excludes background time from the recorded learning dose', async () => {
  await act(async () => root.render(<Harness />))
  await act(async () => vi.advanceTimersByTime(30000))
  await act(async () => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(180000) })
  expect(latest.completedAt.A).toBeUndefined()
  await act(async () => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(30000) })
  expect(latest.activeMs.A).toBe(60000)
})
