import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RecallExercise } from './RecallExercise'
import { UsageExercise } from './UsageExercise'

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })
function click(text: string) {
  const button = [...host.querySelectorAll('button')].find((item) => item.textContent === text)
  expect(button, text).toBeDefined()
  act(() => button!.click())
}
function type(selector: string, value: string) {
  const element = host.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  act(() => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
describe('retrieval practice flow', () => {
  it('hides options initially and records a hinted success only on continuation', () => {
    const onAnswer = vi.fn()
    const onRevealed = vi.fn()
    act(() => root.render(<RecallExercise question="postpone" answer="推迟" choices={['推迟', '提前']} english={false} onRevealed={onRevealed} onAnswer={onAnswer} />))
    expect([...host.querySelectorAll('button')].some((button) => button.textContent === '推迟')).toBe(false)
    click('想不起来，展开选项')
    expect(onRevealed).toHaveBeenCalledOnce()
    click('推迟')
    expect(onAnswer).not.toHaveBeenCalled()
    click('保存并继续'); click('保存并继续')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true, 'assisted')
  })
  it('reveals meaning for self-assessment rather than automatically marking it correct', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<RecallExercise question="postpone" answer="推迟" choices={[]} english={false} onAnswer={onAnswer} />))
    expect(host.textContent).not.toContain('推迟')
    click('查看答案，核对我的回忆')
    expect(onAnswer).not.toHaveBeenCalled()
    click('没想起 / 想错了')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false, 'recall')
  })
  it('checks independent English input with normalization and waits for continuation', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<RecallExercise question="推迟" answer="postpone" choices={[]} english onAnswer={onAnswer} />))
    expect(host.textContent).not.toContain('postpone')
    type('input', ' Postpone ')
    act(() => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    expect(host.textContent).toContain('独立回忆正确')
    expect(onAnswer).not.toHaveBeenCalled()
    click('保存并继续')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true, 'production')
  })
  it('shows the correct answer for an independent miss', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<RecallExercise question="推迟" answer="postpone" choices={[]} english onAnswer={onAnswer} />))
    type('input', 'prepare'); click('检查答案')
    expect(host.textContent).toContain('参考答案：postpone')
    click('保存并继续')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false, 'production')
  })
  it('allows a personal sentence that differs from the reference, explicitly as self-assessment', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<UsageExercise word="postpone" meaning="推迟" collocation="postpone the meeting" example="We postponed the meeting." onAnswer={onAnswer} />))
    type('textarea', 'Can we postpone our trip until Friday?')
    click('查看搭配和参考例句')
    expect(host.textContent).toContain('不是自动语法评分')
    click('我已独立写出，并核对了用法')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true)
  })
  it('does not award successful expression to an empty draft', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<UsageExercise word="postpone" meaning="推迟" collocation="postpone the meeting" example="We postponed the meeting." onAnswer={onAnswer} />))
    expect(host.textContent).not.toContain('We postponed')
    click('查看搭配和参考例句')
    click('我已独立写出，并核对了用法')
    expect(onAnswer).not.toHaveBeenCalled()
    click('需要再练 / 不确定')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false)
  })
})
