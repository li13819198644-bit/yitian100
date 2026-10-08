import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VocabWord } from '../types'
import { WordRecallCard } from './WordRecallCard'

const word: VocabWord = { id: 'postpone', word: 'postpone', meaning: '推迟', phonetic: '/pəʊstˈpəʊn/', collocation: 'postpone the meeting', example: 'We postponed the meeting.', difficulty: 2, level: 'B2' }
let host: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })
async function click(label: string) {
  const button = [...host.querySelectorAll('button')].find((item) => item.textContent === label)
  expect(button).toBeDefined()
  await act(async () => button!.click())
}
function render(onRate = vi.fn()) {
  act(() => root.render(<WordRecallCard word={word} title="单词回忆" position={1} total={2} onRate={onRate} />))
  return onRate
}
describe('word → reveal → known or unknown', () => {
  it('does not render the answer, phonetic, context, or rating buttons before tapping the word', () => {
    render()
    expect(host.textContent).toContain('postpone')
    for (const secret of [word.meaning, word.phonetic, word.collocation, word.example]) expect(host.textContent).not.toContain(secret)
    expect([...host.querySelectorAll('button')].map((button) => button.textContent)).toEqual(['postpone'])
    expect(host.querySelector('input, textarea, [role=tablist]')).toBeNull()
  })
  it('reveals the meaning without saving, then saves known on the next tap', async () => {
    const onRate = render()
    await click('postpone')
    expect(host.textContent).toContain(word.meaning)
    expect(onRate).not.toHaveBeenCalled()
    expect([...host.querySelectorAll('button')].map((button) => button.textContent)).toEqual(['postpone', '会', '不会'])
    await click('会')
    expect(onRate).toHaveBeenCalledExactlyOnceWith('known')
  })
  it('records unknown immediately after the rating tap', async () => {
    const onRate = render()
    await click('postpone'); await click('不会')
    expect(onRate).toHaveBeenCalledExactlyOnceWith('unknown')
  })
  it('blocks duplicate taps while saving', async () => {
    const onRate = vi.fn(() => new Promise<boolean>(() => {}))
    render(onRate)
    await click('postpone'); await click('会'); await click('不会')
    expect(onRate).toHaveBeenCalledOnce()
    expect([...host.querySelectorAll('button')].every((button) => button.disabled)).toBe(true)
  })
  it('keeps the answer visible and allows retry after a failed save', async () => {
    const onRate = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    render(onRate)
    await click('postpone'); await click('会')
    expect(host.querySelector('[role=alert]')).not.toBeNull()
    expect(host.textContent).toContain(word.meaning)
    await click('会')
    expect(onRate).toHaveBeenCalledTimes(2)
  })
  it('also allows retry after a thrown save error', async () => {
    const onRate = vi.fn().mockRejectedValueOnce(new Error('save failed')).mockResolvedValueOnce(true)
    render(onRate)
    await click('postpone'); await click('不会')
    expect(host.querySelector('[role=alert]')).not.toBeNull()
    await click('不会')
    expect(onRate).toHaveBeenCalledTimes(2)
  })
})
