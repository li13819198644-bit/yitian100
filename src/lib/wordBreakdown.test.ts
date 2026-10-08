import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import { curatedBreakdownWords, wordBreakdowns } from '../data/wordBreakdowns'
import { buildWordBreakdown } from './wordBreakdown'

describe('reviewed word breakdowns', () => {
  it('publishes only existing words, with exact spelling, Chinese meanings and one compact cue', () => {
    const words = new Map(seedWords.map((word) => [word.word, word]))
    expect(seedWords).toHaveLength(605)
    expect(curatedBreakdownWords).toHaveLength(176)
    expect(new Set(curatedBreakdownWords).size).toBe(curatedBreakdownWords.length)
    for (const word of curatedBreakdownWords) {
      expect(words.has(word), word).toBe(true)
      const breakdown = words.get(word)!.wordBreakdown!
      expect(breakdown.parts.map((part) => part.text).join(''), word).toBe(word)
      expect(breakdown.parts.length, word).toBeLessThanOrEqual(3)
      expect(breakdown.bridge.length, word).toBeLessThanOrEqual(55)
      expect(breakdown.cue.length, word).toBeLessThanOrEqual(60)
      expect(breakdown.cue.toLowerCase(), word).toContain(word)
      if (breakdown.kind === 'spelling') {
        expect(breakdown.parts.every((part) => part.meaning === undefined), word).toBe(true)
        expect(breakdown.note, word).toBeTruthy()
      } else {
        expect(breakdown.parts.every((part) => /[\u4e00-\u9fff]/.test(part.meaning ?? '')), word).toBe(true)
      }
    }
  })
  it('does not fabricate morphemes for unknown, short or imported words', () => {
    for (const word of ['table', 'reply', 'project', 'customterm', 'x']) {
      const breakdown = buildWordBreakdown({ word, meaning: '当前含义；其他含义', collocation: '' })
      expect(breakdown).toMatchObject({ kind: 'whole', parts: [{ text: word, meaning: '当前含义' }], cue: word })
    }
    expect(buildWordBreakdown({ word: 'viable', meaning: '可行', collocation: '' }).kind).toBe('historical')
    expect(buildWordBreakdown({ word: 'VIABLE', meaning: '可行', collocation: '' }).kind).toBe('historical')
  })
  it('keeps all unreviewed words whole instead of inventing prefix meanings', () => {
    for (const word of seedWords.filter((word) => !wordBreakdowns[word.word])) {
      expect(word.wordBreakdown?.kind, word.word).toBe('whole')
      expect(word.wordBreakdown?.parts.map((part) => part.text), word.word).toEqual([word.word])
      expect(word.wordBreakdown?.cue, word.word).toBe(word.collocation)
    }
  })
  it('fixes the high-risk life/path, here/glue and main/hand confusions', () => {
    expect(wordBreakdowns.viable.parts[0].meaning).toContain('生命')
    expect(wordBreakdowns.viable.note).toContain('不是 via')
    expect(wordBreakdowns.inherent.parts[1].meaning).toContain('黏附')
    expect(wordBreakdowns.inherent.note).toContain('不是 here')
    expect(wordBreakdowns.maintain.parts[0].meaning).toContain('手')
    expect(wordBreakdowns.maintain.note).toContain('不来自英语')
    expect(wordBreakdowns.refund.parts[1].meaning).toContain('倾倒')
    expect(wordBreakdowns.refund.note).toContain('不能按英语资金当词源')
  })
  it('labels spelling associations honestly and preserves learner-approved hooks', () => {
    for (const word of ['repudiate', 'refute', 'exert', 'incentive']) expect(wordBreakdowns[word].kind).toBe('spelling')
    expect(wordBreakdowns.repudiate.cue).toContain('repudiate responsibility')
    expect(wordBreakdowns.refute.bridge).toContain('拿证据')
    expect(wordBreakdowns.refute.note).toContain('refuse')
    expect(seedWords.find((word) => word.word === 'refute')?.evilHook).toContain('s换t')
    expect(seedWords.find((word) => word.word === 'incentive')?.evilHook).toContain('硬塞你')
  })
  it('shows spelling changes explicitly without treating every able as the same meaning', () => {
    expect(wordBreakdowns.unforgettable.parts[1]).toMatchObject({ text: 'forgett', meaning: expect.stringContaining('双写') })
    expect(wordBreakdowns.reliable.parts[0].meaning).toContain('y 变 i')
    expect(wordBreakdowns.reasonable.parts[1].meaning).toContain('合于')
    expect(wordBreakdowns.accountable.parts[1].meaning).toContain('义务')
  })
})
