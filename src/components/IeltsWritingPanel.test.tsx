import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { emptyWriting, type WritingState } from '../ielts/types'
import { mergeWriting } from '../ielts/engine'
import { questions } from '../ielts/data'
import { IeltsWritingPanel } from './IeltsWritingPanel'

let stored: WritingState, fail: boolean, host: HTMLDivElement, root: Root
vi.mock('../lib/db', () => ({
  getWritingState: async () => stored,
  saveWritingState: async (update: WritingState) => {
    if (fail && update.attempts.length) throw new Error('disk full')
    stored = mergeWriting(stored, update)
    return stored
  },
}))
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  stored = emptyWriting(); fail = false; host = document.createElement('div'); root = createRoot(host)
  await act(async () => root.render(<IeltsWritingPanel onBack={() => {}} />))
})
afterEach(() => act(() => root.unmount()))
async function click(text: string) {
  const button = [...host.querySelectorAll('button')].find(button => button.textContent?.includes(text))
  expect(button, text).toBeDefined(); await act(async () => button!.click())
}
async function input(text: string) {
  const textarea = host.querySelector('textarea')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(textarea, text)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const q = questions.find(item => item.id === 'passive-write-1')!

it('hides reference until submission, preserves original and separates corrected imitation from independent work', async () => {
  await click('独立造句'); await click('情态动词与被动语态')
  expect(host.textContent).not.toContain(q.answer)
  const original = 'As technology advances, some jobs may replaced by machines.'
  await input(original); await click('提交并核对')
  expect(host.textContent).toContain('发现明确问题')
  expect(stored.attempts[0]).toMatchObject({ original, mode: 'independent', skillId: 'passive' })
  await input(q.answer); await click('保存修改并重新核对')
  expect(stored.attempts).toHaveLength(2)
  expect(stored.attempts[1]).toMatchObject({ mode: 'imitation', feedback: { status: 'pass' } })
  await click('下一道同知识点造句')
  expect(host.textContent).toContain('这些工具已经被工程师使用多年')
  expect(host.textContent).not.toContain('These tools have been used by engineers for years.')
})
it('does not reveal answers when saving fails and supports retry without duplicate attempts', async () => {
  await click('独立造句'); await click('情态动词与被动语态'); await input(q.answer)
  fail = true; await click('提交并核对')
  expect(host.textContent).toContain('提交未保存')
  expect(host.textContent).not.toContain('参考表达')
  expect(stored.attempts).toHaveLength(0)
  fail = false; await click('提交并核对'); expect(stored.attempts).toHaveLength(1)
})
it('restores a draft after leaving and reopening the writing workspace', async () => {
  await click('段落写作'); await input('Automation removes workers from hazardous tasks.')
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="返回写作上一级"]')!.click())
  await click('段落写作')
  expect(host.querySelector('textarea')!.value).toBe('Automation removes workers from hazardous tasks.')
  expect(stored.attempts).toHaveLength(0)
})
