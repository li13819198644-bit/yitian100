import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { seedWords } from '../data/seedWords'
import { TodayWordsPanel } from './TodayWordsPanel'

it('hides meanings, filters mistakes and opens the selected card without grading', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const host = document.createElement('div'), root = createRoot(host), onOpen = vi.fn()
  const items = seedWords.slice(0, 2).map((word, index) => ({ word, at: 0, missed: index === 1 }))
  try {
    await act(async () => root.render(<TodayWordsPanel items={items} onOpen={onOpen} onBack={() => {}} />))
    expect(host.querySelectorAll('li')).toHaveLength(2)
    expect(host.textContent).not.toContain(items[0].word.meaning)
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent?.includes('今天答错过'))!.click())
    expect(host.querySelectorAll('li')).toHaveLength(1)
    await act(async () => host.querySelector<HTMLButtonElement>('li button')!.click())
    expect(onOpen).toHaveBeenCalledExactlyOnceWith(items[1].word.id)
  } finally { act(() => root.unmount()) }
})
