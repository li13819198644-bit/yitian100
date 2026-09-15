import { describe, expect, it } from 'vitest'
import { generatedBatch9 } from '../data/generatedBatch9'
import { seedWords } from '../data/seedWords'
import { createProgress, getNewWords } from './srs'

const newIds = new Set(generatedBatch9.map((word) => word.id))
const oldWords = seedWords.filter((word) => !newIds.has(word.id))
const now = new Date(2026, 8, 15, 12).getTime()

describe('the hundred-word expansion', () => {
  it('adds exactly one hundred new entries without replacing existing ids', () => {
    expect(oldWords).toHaveLength(405)
    expect(newIds.size).toBe(100)
    expect(seedWords).toHaveLength(505)
    for (const word of generatedBatch9) {
      const published = seedWords.filter((item) => item.id === word.id)
      expect(published).toHaveLength(1)
      expect(published[0].evilHook).toBe(word.evilHook)
      expect(word.example).toMatch(new RegExp(`\\b${word.word}\\b`, 'i'))
      expect(word.memoryHook.personalPrompt).toContain('___')
      expect(word.memoryHook.personalPrompt).not.toMatch(new RegExp(`\\b${word.word}\\b`, 'i'))
    }
  })

  it('makes all new words available when the old bank is fully learned', () => {
    const progress = oldWords.map((word) => ({ ...createProgress(word.id, now), seen: 10 }))
    const before = JSON.stringify(progress)
    const available = getNewWords(seedWords, progress, 100, now)
    expect(new Set(available.map((word) => word.id))).toEqual(newIds)
    expect(available.map((word) => word.id)).not.toEqual(available.map((word) => word.id).sort())
    expect(JSON.stringify(progress)).toBe(before)
  })

  it('removes newly studied words from subsequent new-word sessions', () => {
    const progress = oldWords.map((word) => ({ ...createProgress(word.id, now), seen: 1 }))
    const first = getNewWords(seedWords, progress, 10, now)
    const updated = [...progress, ...first.map((word) => ({ ...createProgress(word.id, now), seen: 1 }))]
    const remaining = getNewWords(seedWords, updated, 100, now)
    expect(remaining).toHaveLength(90)
    expect(remaining.some((word) => first.some((item) => item.id === word.id))).toBe(false)
  })
})
