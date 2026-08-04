import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'

const bannedPatterns = [
  /种族/,
  /性暗示/,
  /暴力/,
  /低俗/,
  /政治/,
  /恐吓/,
]

const weakTemplatePatterns = [
  /像/,
  /，指/,
  /带到/,
  /采购门/,
  /方法目录/,
  /框架骨架/,
  /准则尺/,
  /流程礼仪本/,
  /得到好处/,
  /意思/,
  /叫/,
  /就是/,
]

const originLikePatterns = [
  /源于/,
  /来自/,
  /词源/,
  /拉丁/,
  /希腊/,
]

describe('evilMemoryHooks', () => {
  it('covers every published seed word and only published seed words', () => {
    const missing = seedWords.filter((word) => !word.evilHook).map((word) => word.word)
    const duplicateIds = seedWords
      .map((item) => item.word)
      .filter((word, index, words) => words.indexOf(word) !== index)

    expect(seedWords).toHaveLength(305)
    expect(missing).toEqual([])
    expect(duplicateIds).toEqual([])
  })

  it('keeps each hook concise, non-empty, and card-friendly', () => {
    for (const word of seedWords) {
      const hook = word.evilHook ?? ''
      expect(hook.trim(), word.word).toBe(hook)
      expect(hook.length, word.word).toBeGreaterThanOrEqual(18)
      expect(hook.length, word.word).toBeLessThanOrEqual(60)
    }
  })

  it('does not contain banned prompt categories', () => {
    const flagged = seedWords
      .filter((word) => bannedPatterns.some((pattern) => pattern.test(word.evilHook ?? '')))
      .map((word) => word.word)

    expect(flagged).toEqual([])
  })

  it('rejects weak template wording across the whole hook set', () => {
    const weakWords = seedWords
      .filter((word) => weakTemplatePatterns.some((pattern) => pattern.test(word.evilHook ?? '')))
      .map((word) => word.word)

    expect(weakWords).toEqual([])
  })

  it('stays visually distinct from word origins', () => {
    const originLikeWords = seedWords
      .filter((word) => originLikePatterns.some((pattern) => pattern.test(word.evilHook ?? '')))
      .map((word) => word.word)

    expect(originLikeWords).toEqual([])
  })

  it('does not leave blank values', () => {
    const blankWords = seedWords
      .filter((word) => (word.evilHook ?? '').trim().length === 0)
      .map((word) => word.word)

    expect(blankWords).toEqual([])
  })

  it('publishes every hook onto the learning card data', () => {
    const missing = seedWords.filter((word) => !word.evilHook).map((word) => word.word)

    expect(missing).toEqual([])
  })

  it('uses the section confusion as the bridge for sanction', () => {
    const hook = seedWords.find((word) => word.word === 'sanction')?.evilHook
    expect(hook).toContain('section')
    expect(hook).toContain('allow')
    expect(hook).toContain('ban')
  })

  it('uses substance as the bridge for substantiate', () => {
    const hook = seedWords.find((word) => word.word === 'substantiate')?.evilHook
    expect(hook).toContain('substance')
    expect(hook).toContain('证据')
  })

  it('uses the word shape as the bridge for eligible', () => {
    const hook = seedWords.find((word) => word.word === 'eligible')?.evilHook
    expect(hook).toContain('e-lig-ible')
    expect(hook).toContain('有资格')
    expect(hook).not.toContain('绿灯')
    expect(hook).not.toContain('候选池')
  })

  it('uses emo as the bridge for emotional', () => {
    const hook = seedWords.find((word) => word.word === 'emotional')?.evilHook
    expect(hook).toContain('emo')
    expect(hook).toContain('情绪化')
    expect(hook).not.toContain('温度计')
  })

  it('uses user-known bridges for ethical and feasible', () => {
    const ethical = seedWords.find((word) => word.word === 'ethical')?.evilHook
    const feasible = seedWords.find((word) => word.word === 'feasible')?.evilHook
    expect(ethical).toContain('think')
    expect(ethical).toContain('合伦理')
    expect(feasible).toContain('possible')
    expect(feasible).toContain('能落地')
  })
})
