import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { seedWords } from '../data/seedWords'
import { WordMeanings } from './WordMeanings'
import { WordRecallCard } from './WordRecallCard'

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })
describe('meaning rows on recall cards', () => {
  it('keeps concrete senses hidden before reveal, then shows both without an extra selection', async () => {
    const word = seedWords.find((word) => word.word === 'concrete')!
    const onRate = vi.fn()
    act(() => root.render(<WordRecallCard word={word} title="单词回忆" position={1} total={1} onRate={onRate} />))
    expect(host.textContent).not.toContain('形容词')
    expect(host.textContent).not.toContain('混凝土')
    expect(host.querySelectorAll('button')).toHaveLength(1)
    await act(async () => (host.querySelector('button') as HTMLButtonElement).click())
    const section = host.querySelector('[aria-label="词性与释义"]')!
    expect(section.textContent).toContain('形容词具体的、明确的')
    expect(section.textContent).toContain('名词混凝土')
    expect(section.querySelector('button, input, select')).toBeNull()
    const button = [...host.querySelectorAll('button')].find((item) => item.textContent === '会')!
    await act(async () => button.click())
    expect(onRate).toHaveBeenCalledOnce()
  })
  it('shows examples and usage notes alongside the correct sense in details', () => {
    const word = seedWords.find((word) => word.word === 'concrete')!
    act(() => root.render(<WordMeanings word={word} detailed />))
    const rows = [...host.querySelectorAll('section > div')]
    expect(rows[0].textContent).toContain('concrete evidence：明确的证据')
    expect(rows[0].textContent).not.toContain('浇筑')
    expect(rows[1].textContent).toContain('pour concrete：浇筑混凝土')
    expect(rows[1].textContent).toContain('不可数')
  })
  it('associates permit pronunciations with their respective parts of speech', () => {
    const word = seedWords.find((word) => word.word === 'permit')!
    act(() => root.render(<WordMeanings word={word} />))
    const rows = [...host.querySelectorAll('section > div')]
    expect(rows[0].textContent).toContain('动词/pərˈmɪt/允许')
    expect(rows[1].textContent).toContain('名词/ˈpɜːrmɪt/许可证')
  })
  it('supports old stored words and leaves unknown custom vocabulary unclassified', () => {
    const concrete = { ...seedWords.find((word) => word.word === 'concrete')!, senses: undefined }
    act(() => root.render(<WordMeanings word={concrete} />))
    expect(host.textContent).toContain('名词混凝土')
    const custom = { ...concrete, id: 'custom-term', word: 'custom-term', meaning: '自定义内容' }
    act(() => root.render(<WordMeanings word={custom} />))
    expect(host.textContent).toBe('自定义内容')
  })
})
