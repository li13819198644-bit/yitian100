import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { seedWords } from '../data/seedWords'
import { DAY, emptyLearningState, learningEvidenceSummary, mergeLearningStates, type LearningState } from '../lib/learningProtocol'
import { VocabularyLab } from './VocabularyLab'

let host: HTMLDivElement, root: Root, latest: LearningState
function Harness() {
  const [state, setState] = useState(emptyLearningState)
  latest = state
  return <VocabularyLab words={seedWords} progress={[]} state={state} onSave={async next => setState(previous => mergeLearningStates(previous, next))} onBack={() => {}} />
}
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers() })
async function click(text: string) { const button = [...host.querySelectorAll('button')].find(button => button.textContent === text); expect(button, text).toBeDefined(); await act(async () => button!.click()) }
async function fill(index: number, value: string) { const input = host.querySelectorAll<HTMLInputElement>('input:not([type=radio])')[index]; await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })) }) }

it('continues the reported 3/3 without manufacturing verified first-round results or leaking reverse answers', async () => {
  await act(async () => root.render(<Harness />))
  await click('接着自述首轮3/3，做反向测试')
  expect(latest.experiments[0].priorReport).toMatchObject({ verified: false, learnedAt: null })
  expect(latest.events).toHaveLength(0)
  expect(host.textContent).not.toMatch(/hinge|latch|shard/)
  expect(host.querySelector('svg,img')).toBeNull()
  await fill(0, 'hinge'); await fill(1, 'latch'); await fill(2, 'shard'); await click('提交本轮结果')
  expect(host.textContent).toContain('本轮 3/3 正确')
  expect(host.textContent).toContain('来自你的聊天自述')
  expect(host.textContent).not.toContain('开始到期无提示复测')
  expect(learningEvidenceSummary(latest.events).delayed24h.tested).toBe(0)
  expect(latest.events.filter(event => event.kind === 'recall').every(event => event.direction === 'zh-en')).toBe(true)
})
it('opens only an actually due delayed test and removes images, translations, and choices', async () => {
  vi.useFakeTimers(); const now = Date.now(); vi.setSystemTime(now)
  await act(async () => root.render(<Harness />)); await click('接着自述首轮3/3，做反向测试')
  await fill(0, 'hinge'); await fill(1, 'latch'); await fill(2, 'shard'); await click('提交本轮结果')
  vi.setSystemTime(now + DAY + 60_000)
  await act(async () => root.render(<Harness />))
  await click('开始到期无提示复测')
  expect(host.textContent).toContain('hinge')
  expect(host.textContent).not.toContain('合页')
  expect(host.querySelector('svg,img,select')).toBeNull()
  await fill(0, '合页'); await fill(1, '插销'); await fill(2, '碎片'); await click('提交本轮结果')
  expect(latest.events.filter(event => event.checkpoint === '24h' && event.kind === 'recall')).toHaveLength(3)
  expect(host.textContent).toContain('本轮 3/3 正确')
  expect(host.textContent).not.toContain('开始到期无提示复测')
})
