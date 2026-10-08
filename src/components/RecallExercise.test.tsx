import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RecallExercise } from './RecallExercise'
import { UsageExercise } from './UsageExercise'
import { SentenceQuiz } from './SentenceQuiz'

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  vi.useFakeTimers()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers() })
function click(text: string) {
  const button = [...host.querySelectorAll('button')].find((item) => item.textContent === text)
  expect(button, text).toBeDefined()
  act(() => button!.click())
}
async function advance(ms = 1200) { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }
function renderRecall(onAnswer = vi.fn(), english = true) {
  act(() => root.render(<RecallExercise question={english ? '推迟' : 'postpone'} answer={english ? 'postpone' : '推迟'} choices={english ? ['prepare', 'postpone'] : ['提前', '推迟']} english={english} onAnswer={onAnswer} />))
  return onAnswer
}
describe('one-click vocabulary practice', () => {
  it('shows English options immediately and saves the answer without any second click', async () => {
    const onAnswer = renderRecall()
    expect(host.querySelector('input, textarea, form')).toBeNull()
    expect(host.textContent).not.toMatch(/展开|核对|保存并继续/)
    click('postpone')
    expect([...host.querySelectorAll('button')].every((button) => button.disabled)).toBe(true)
    await advance(450)
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true, 'choice')
  })
  it('does the same for Chinese choices', async () => {
    const onAnswer = renderRecall(vi.fn(), false)
    click('推迟'); await advance()
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true, 'choice')
  })
  it('records known self-assessment in one tap without a confirmation screen', async () => {
    const onAnswer = renderRecall()
    click('会'); click('会'); await advance()
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true, 'self')
  })
  it('shows the answer for a wrong choice and automatically records failure', async () => {
    const onAnswer = renderRecall()
    click('prepare')
    expect(host.textContent).toContain('正确答案：postpone')
    await advance(1199)
    expect(onAnswer).not.toHaveBeenCalled()
    await advance(1)
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false, 'choice')
  })
  it('records an unknown word with one tap', async () => {
    const onAnswer = renderRecall()
    click('不会'); await advance()
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false, 'self')
  })
  it('allows retry if saving fails, instead of leaving the card permanently disabled', async () => {
    const onAnswer = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    renderRecall(onAnswer)
    click('postpone'); await advance()
    expect(host.querySelector('[role=alert]')?.textContent).toContain('未能保存')
    expect([...host.querySelectorAll('button')].every((button) => !button.disabled)).toBe(true)
    click('postpone'); await advance()
    expect(onAnswer).toHaveBeenCalledTimes(2)
  })
  it('also recovers after a rejected save', async () => {
    const onAnswer = vi.fn().mockRejectedValueOnce(new Error('offline store failed')).mockResolvedValueOnce(true)
    renderRecall(onAnswer)
    click('不会'); await advance()
    expect(host.querySelector('[role=alert]')).not.toBeNull()
    click('会'); await advance()
    expect(onAnswer).toHaveBeenCalledTimes(2)
  })
  it('does not submit a stale word after leaving the card during feedback', async () => {
    const onAnswer = renderRecall()
    click('会')
    act(() => root.render(<p>其他页面</p>))
    await advance()
    expect(onAnswer).not.toHaveBeenCalled()
  })
  it('shows expression references directly and needs only a single self-rating', async () => {
    const onAnswer = vi.fn()
    act(() => root.render(<UsageExercise word="postpone" meaning="推迟" collocation="postpone the meeting" example="We postponed the meeting." onAnswer={onAnswer} />))
    expect(host.textContent).toContain('We postponed the meeting.')
    expect(host.querySelector('input, textarea')).toBeNull()
    click('会用'); await advance()
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true, 'usage')
  })
  it('finishes sentence assembly on the last tile without check or next buttons', async () => {
    const onAnswer = vi.fn()
    const onChecked = vi.fn()
    act(() => root.render(<SentenceQuiz sentence="We postpone meetings." onAnswer={onAnswer} onChecked={onChecked} />))
    for (const word of ['We', 'postpone', 'meetings.']) {
      const button = host.querySelector(`button[aria-label="选择 ${word}"]`) as HTMLButtonElement
      act(() => button.click())
    }
    expect(onChecked).toHaveBeenCalledOnce()
    expect(host.textContent).not.toMatch(/检查句子|下一题/)
    await advance()
    expect(onAnswer).toHaveBeenCalledOnce()
    expect(onAnswer.mock.calls[0][0]).toBe(true)
  })
})
