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
  it('uses only English choices and records recognition rather than independent production', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<RecallExercise question="推迟" answer="postpone" choices={['postpone', 'prepare']} english onAnswer={onAnswer} />))
    expect(host.querySelector('input, textarea, form')).toBeNull()
    expect(host.textContent).not.toContain('postpone')
    click('展开英文选项')
    expect(host.querySelector('input, textarea, form')).toBeNull()
    click('postpone')
    expect(onAnswer).not.toHaveBeenCalled()
    click('保存并继续')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true, 'choice')
  })
  it('preserves the assisted marker when choosing English after requesting a hint', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<RecallExercise question="推迟" answer="postpone" choices={['postpone', 'prepare']} english onAnswer={onAnswer} />))
    click('想不起来，展开选项'); click('postpone'); click('保存并继续')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true, 'assisted')
  })
  it('shows the correct English answer for a wrong choice without requiring typing', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<RecallExercise question="推迟" answer="postpone" choices={['postpone', 'prepare']} english onAnswer={onAnswer} />))
    click('展开英文选项'); click('prepare')
    expect(host.textContent).toContain('参考答案：postpone')
    expect(host.querySelector('input, textarea')).toBeNull()
    click('保存并继续')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false, 'choice')
  })
  it('supports mental expression self-assessment without a text field', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<UsageExercise word="postpone" meaning="推迟" collocation="postpone the meeting" example="We postponed the meeting." onAnswer={onAnswer} />))
    expect(host.querySelector('input, textarea')).toBeNull()
    expect(host.textContent).not.toContain('We postponed')
    click('查看搭配和参考例句')
    expect(host.textContent).toContain('不是自动语法评分')
    click('我已在心里表达，并核对了用法')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true)
  })
  it('allows uncertainty in mental expression to be recorded as needing practice', () => {
    const onAnswer = vi.fn()
    act(() => root.render(<UsageExercise word="postpone" meaning="推迟" collocation="postpone the meeting" example="We postponed the meeting." onAnswer={onAnswer} />))
    click('查看搭配和参考例句'); click('需要再练 / 不确定')
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false)
  })
})
