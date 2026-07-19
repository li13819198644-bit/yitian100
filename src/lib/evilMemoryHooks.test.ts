import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import { evilMemoryHooks } from './evilMemoryHooks'

const bannedPatterns = [
  /种族/,
  /性暗示/,
  /暴力/,
  /低俗/,
  /政治/,
  /恐吓/,
]

const weakTemplatePatterns = [
  /像“.*法条”/,
  /像“.*规则”/,
  /像“.*标准”/,
  /像“.*流程”/,
  /叫/,
  /就是/,
]

describe('evilMemoryHooks', () => {
  it('covers every published seed word and only published seed words', () => {
    const seedWordSet = new Set(seedWords.map((item) => item.word))
    const hookWords = Object.keys(evilMemoryHooks)

    const missing = seedWords.map((item) => item.word).filter((word) => !(word in evilMemoryHooks))
    const extra = hookWords.filter((word) => !seedWordSet.has(word))

    expect(seedWords).toHaveLength(205)
    expect(hookWords).toHaveLength(seedWords.length)
    expect(missing).toEqual([])
    expect(extra).toEqual([])
  })

  it('keeps each hook concise, non-empty, and card-friendly', () => {
    for (const [word, hook] of Object.entries(evilMemoryHooks)) {
      expect(hook.trim(), word).toBe(hook)
      expect(hook.length, word).toBeGreaterThanOrEqual(18)
      expect(hook.length, word).toBeLessThanOrEqual(45)
    }
  })

  it('does not contain banned prompt categories', () => {
    const flagged = Object.entries(evilMemoryHooks)
      .filter(([, hook]) => bannedPatterns.some((pattern) => pattern.test(hook)))
      .map(([word]) => word)

    expect(flagged).toEqual([])
  })

  it('rejects weak template wording across the whole hook set', () => {
    const weakWords = Object.entries(evilMemoryHooks)
      .filter(([, hook]) => weakTemplatePatterns.some((pattern) => pattern.test(hook)))
      .map(([word]) => word)

    expect(weakWords).toEqual([])
  })

  it('does not leave blank values', () => {
    const blankWords = Object.entries(evilMemoryHooks)
      .filter(([, hook]) => hook.trim().length === 0)
      .map(([word]) => word)

    expect(blankWords).toEqual([])
  })

  it('publishes every hook onto the learning card data', () => {
    const missing = seedWords.filter((word) => !word.evilHook).map((word) => word.word)

    expect(missing).toEqual([])
  })
})
