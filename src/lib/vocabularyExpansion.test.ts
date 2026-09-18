import { describe, expect, it } from 'vitest'
import { generatedBatch10 } from '../data/generatedBatch10'
import { seedWords } from '../data/seedWords'
import { reviewedRecallHooks } from '../data/reviewedRecallHooks'
import { createProgress, getNewWords } from './srs'

const newIds = new Set(generatedBatch10.map((word) => word.id))
const oldWords = seedWords.filter((word) => !newIds.has(word.id))
const now = new Date(2026, 8, 15, 12).getTime()

describe('the hundred-word expansion', () => {
  it('adds exactly one hundred new entries without replacing existing ids', () => {
    expect(oldWords).toHaveLength(505)
    expect(newIds.size).toBe(100)
    expect(seedWords).toHaveLength(605)
    for (const word of generatedBatch10) {
      const published = seedWords.filter((item) => item.id === word.id)
      expect(published).toHaveLength(1)
      expect(published[0].evilHook).toBe(reviewedRecallHooks[word.word] ?? word.evilHook)
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

  it('keeps authored usage explanations separate from invented associations', () => {
    for (const word of generatedBatch10) {
      expect(word.difficulty, word.word).toBeGreaterThanOrEqual(3)
      expect(['B2', 'C1']).toContain(word.level)
      expect(word.wordOrigin, word.word).toMatch(/^构词与用法：/)
      expect(word.wordOrigin.length, word.word).toBeGreaterThan(40)
      expect(word.evilHook, word.word).toMatch(/看|借|接/)
      expect(seedWords.find((item) => item.id === word.id)?.memoryHook?.breakdown).toBe(word.wordOrigin)
    }
    const entry = (id: string) => generatedBatch10.find((word) => word.id === id)!
    expect(entry('resign').wordOrigin).toContain('re-sign')
    expect(entry('sensible').wordOrigin).toContain('sensitive')
    expect(entry('reimburse').wordOrigin).toContain('refund')
    expect(entry('correlation').wordOrigin).toContain('相关不等于因果')
    expect(entry('waive').evilHook).toContain('wave')
    expect(entry('subtle').wordOrigin).toContain('b 不发音')
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
