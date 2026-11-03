import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { semanticCards } from '../data/semanticCards'
import { learningEvidenceSummary, type LearningEvent } from '../lib/learningProtocol'
import { UsagePractice } from './UsagePractice'

it('hides the reference until requested and labels use as self-rating rather than objective recall', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host)
  const save = vi.fn().mockResolvedValue(undefined)
  try {
    await act(async () => root.render(<UsagePractice cards={[semanticCards[0]]} events={[]} onSave={save} onBack={() => {}} />))
    expect(host.textContent).not.toContain('discern')
    expect(host.querySelector('input,textarea')).toBeNull()
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === '查看参考表达')!.click())
    expect(host.textContent).toContain('She could discern a pattern in the data.')
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === '表达含义正确')!.click())
    const events = save.mock.calls.flatMap(([events]) => events as LearningEvent[])
    expect(events.find(event => event.kind === 'usage')).toMatchObject({ cue: 'sentence', direction: 'zh-en', assessment: 'self', outcome: 'correct' })
    expect(learningEvidenceSummary(events).delayed24h.tested).toBe(0)
    expect(learningEvidenceSummary(events).usage.correct).toBe(1)
  } finally { act(() => root.unmount()); host.remove() }
})

it('uses a held-out final-transfer sentence and attributes the self-rating to its experiment checkpoint', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host)
  const save = vi.fn().mockResolvedValue(undefined)
  try {
    await act(async () => root.render(<UsagePractice cards={[semanticCards[0]]} events={[]} experimentId="ab" checkpoint="14d" onSave={save} onBack={() => {}} />))
    expect(host.textContent).toContain('暮色中，我几乎辨不清小路。')
    expect(host.textContent).not.toContain('discern')
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === '查看参考表达')!.click())
    expect(host.textContent).toContain('At dusk, I could barely discern the path.')
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === '目标词使用正确')!.click())
    expect(save.mock.calls.flatMap(([events]) => events as LearningEvent[]).find(event => event.kind === 'usage')).toMatchObject({ experimentId: 'ab', checkpoint: '14d', assessment: 'self' })
    expect(host.textContent).toContain('本轮表达自评已完成')
  } finally { act(() => root.unmount()); host.remove() }
})
