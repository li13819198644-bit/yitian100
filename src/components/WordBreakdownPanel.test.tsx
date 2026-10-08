import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { seedWords } from '../data/seedWords'
import { WordRecallCard } from './WordRecallCard'
import { WordBreakdownPanel } from './WordBreakdownPanel'

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })
describe('one-glance breakdown', () => {
  it('shows the Chinese meaning of each chunk and one bilingual collocation without extra taps', () => {
    const word = seedWords.find((word) => word.word === 'viable')!
    act(() => root.render(<WordBreakdownPanel word={word} />))
    expect(host.textContent).toContain('历史词根线索')
    expect(host.textContent).toContain('生命')
    expect(host.textContent).toContain('能够')
    expect(host.textContent).toContain('viable plan：能实行的计划')
    expect(host.querySelector('button, input, textarea, details')).toBeNull()
  })
  it('does not invent separate meanings for the spelling chunks in repudiate', () => {
    const word = seedWords.find((word) => word.word === 'repudiate')!
    act(() => root.render(<WordBreakdownPanel word={word} />))
    expect(host.textContent).toContain('拼写助记 · 不是词根')
    expect(host.textContent).toContain('repudiate responsibility：拒绝承认责任')
    expect(host.querySelectorAll('[aria-label="repudiate 的记忆块"] p')).toHaveLength(3)
  })
  it('keeps chunks, semantic bridges and collocations off the unrevealed recall card', async () => {
    const word = seedWords.find((word) => word.word === 'viable')!
    const onRate = vi.fn()
    act(() => root.render(<WordRecallCard word={word} title="单词回忆" position={1} total={1} onRate={onRate} />))
    expect(host.querySelectorAll('button')).toHaveLength(1)
    expect(host.querySelector('[aria-label="拆开记"]')).toBeNull()
    for (const text of [word.meaning, word.wordBreakdown!.bridge, word.wordBreakdown!.cue, '生命']) expect(host.textContent).not.toContain(text)
    await act(async () => (host.querySelector('button') as HTMLButtonElement).click())
    const button = [...host.querySelectorAll('button')].find((item) => item.textContent === '会')!
    await act(async () => button.click())
    expect(onRate).toHaveBeenCalledOnce()
  })
})
