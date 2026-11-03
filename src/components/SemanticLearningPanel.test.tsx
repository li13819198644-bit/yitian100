import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { seedWords } from '../data/seedWords'
import { DAY, emptyLearningState, learningEvent, mergeLearningStates, type LearningEvent, type LearningState } from '../lib/learningProtocol'
import { createProgress } from '../lib/srs'
import { SemanticLearningPanel } from './SemanticLearningPanel'

let host: HTMLDivElement, root: Root, latest: LearningState
const saved = vi.fn()
let failRecall = false
const words = ['discern', 'reluctant', 'viable', 'coherent'].map(id => seedWords.find(word => word.id === id)!)
function Harness({ reviewed, pool = words }: { reviewed: boolean; pool?: typeof words }) {
  const [state, setState] = useState(() => ({ ...emptyLearningState(), events: reviewed ? words.map(word => learningEvent({ wordId: word.id, kind: 'encoding', cue: 'sentence', direction: 'en-zh', outcome: null, assessment: 'self', activeMs: 0, sessionId: 'old' }, Date.now() - 2 * DAY)) : [] }))
  latest = state
  return <SemanticLearningPanel words={pool} progress={words.map(word => ({ ...createProgress(word.id, Date.now() - 2 * DAY), seen: 2 }))} state={state} minutes={30} onBack={() => {}} onSave={async events => {
    saved(events)
    if (failRecall && events.some(event => event.kind === 'recall')) { failRecall = false; throw new Error('storage') }
    setState(previous => mergeLearningStates(previous, { ...emptyLearningState(), events }))
  }} />
}
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); saved.mockReset(); failRecall = false; host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove() })
async function click(text: string) {
  const button = [...host.querySelectorAll('button')].find(button => button.textContent === text)
  expect(button, text).toBeDefined(); await act(async () => button!.click())
}
async function start(reviewed: boolean) { await act(async () => root.render(<Harness reviewed={reviewed} />)); await click('开始练习') }

it('keeps independent recall free of meanings and context until reveal, then advances known', async () => {
  await start(true)
  expect(host.textContent).toContain('discern')
  expect(host.textContent).not.toContain('辨别')
  expect(host.textContent).not.toContain('discern a difference')
  expect(host.querySelector('input:not([type=radio]),textarea')).toBeNull()
  await click('discern'); expect(host.textContent).toContain('辨别')
  await click('会')
  expect(latest.events.find(event => event.kind === 'recall')).toMatchObject({ outcome: 'correct', cue: 'none', assessment: 'self' })
  expect(host.textContent).toContain('reluctant')
  expect(host.textContent).not.toContain('不情愿')
})
it('allows a small queue to return to recall after the ten-minute spacing fallback', async () => {
  vi.useFakeTimers()
  try {
    await act(async () => root.render(<Harness reviewed={false} pool={words.slice(0, 1)} />))
    await click('开始练习')
    await click('已理解，继续'); await click('查看解释'); await click('理解正确')
    expect(host.textContent).toContain('当前没有适合立即提取的词')
    await act(async () => { vi.advanceTimersByTime(601000) })
    await click('检查待复习词')
    expect(host.textContent).toContain('先在心里说出中文，再揭晓')
    expect(host.textContent).not.toContain('辨别、察觉、看出')
  } finally { vi.useRealTimers() }
})
it('studies accurate meaning before association and keeps context understanding separate', async () => {
  await start(false)
  expect(host.textContent).toContain('辨别、察觉、看出')
  expect(host.textContent).toContain('discern a difference')
  expect(latest.events.some(event => event.kind === 'recall')).toBe(false)
  await click('已理解，继续')
  expect(host.textContent).toContain('She could discern a pattern in the data.')
  expect(host.textContent).not.toContain('她能看出数据中的规律')
  await click('查看解释'); await click('理解正确')
  expect(latest.events.find(event => event.kind === 'context')).toMatchObject({ outcome: 'correct', cue: 'sentence' })
  expect(latest.events.filter(event => event.kind === 'recall')).toHaveLength(0)
  expect(host.textContent).toContain('reluctant')
})
it('shows corrective teaching on failure and keeps a failed save retryable with the same first-answer identity', async () => {
  await start(true); await click('discern'); failRecall = true
  await click('不会')
  expect(host.querySelector('[role=alert]')).not.toBeNull()
  await click('不会')
  expect(host.textContent).toContain('先把含义学准')
  const recalls = saved.mock.calls.flatMap(([events]) => (events as LearningEvent[]).filter(event => event.kind === 'recall'))
  expect(recalls).toHaveLength(2)
  expect(recalls[0].id).toBe(recalls[1].id)
  expect(latest.events.filter(event => event.kind === 'recall')).toHaveLength(1)
})
