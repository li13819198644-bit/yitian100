import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { imagePilotCards } from '../data/semanticCards'
import { RecallExperimentRound } from './RecallExperimentRound'

let host: HTMLDivElement, root: Root
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove() })
async function render(direction: 'en-zh' | 'zh-en', submit = vi.fn().mockResolvedValue(undefined)) {
  await act(async () => root.render(<RecallExperimentRound cards={imagePilotCards} direction={direction} experimentId="pilot" checkpoint={direction === 'en-zh' ? '24h' : 'reverse'} onSubmit={submit} onCancel={() => {}} />))
  return submit
}
async function fill(index: number, value: string) {
  const input = host.querySelectorAll<HTMLInputElement>('input:not([type=radio])')[index]
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })) })
}
async function submit() { await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === '提交本轮结果')!.click()) }

it('renders reverse prompts without target English, images, letter hints or answer choices', async () => {
  await render('zh-en')
  for (const card of imagePilotCards) expect(host.innerHTML.toLowerCase()).not.toContain(card.word)
  expect(host.querySelector('img, svg, select')).toBeNull()
  expect(host.querySelectorAll('input:not([type=radio])')).toHaveLength(3)
  expect(host.querySelectorAll('input[type=radio]')).toHaveLength(3)
})
it('records typed target words, permits blanks, and separates the direction and effort', async () => {
  const save = await render('zh-en')
  await fill(0, 'HINGE'); await fill(1, 'latch')
  await act(async () => host.querySelectorAll<HTMLInputElement>('input[type=radio]')[1].click())
  await submit()
  expect(save).toHaveBeenCalledOnce()
  const events = save.mock.calls[0][0]
  expect(events.map((event: { outcome: string }) => event.outcome)).toEqual(['correct', 'correct', 'incorrect'])
  expect(events[0]).toMatchObject({ direction: 'zh-en', cue: 'none', assessment: 'typed-match', effort: 'thinking', checkpoint: 'reverse' })
  expect(events[2].answer).toBe('')
})
it('does not show Chinese answers in the independent forward test', async () => {
  const save = await render('en-zh')
  expect(host.textContent).not.toContain('合页')
  await fill(0, '合页'); await fill(1, '插销'); await fill(2, '碎片'); await submit()
  expect(save.mock.calls[0][0].every((event: { outcome: string }) => event.outcome === 'correct')).toBe(true)
})
it('blocks duplicate submissions and retains answers after a failed save', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
  await render('zh-en', save); await fill(0, 'hinge'); await submit()
  expect(host.querySelector('[role=alert]')).not.toBeNull()
  await submit()
  expect(save).toHaveBeenCalledTimes(2)
  expect(save.mock.calls[0][0][0].id).toBe(save.mock.calls[1][0][0].id)
  expect(save.mock.calls[1][0][0].answer).toBe('hinge')
})
