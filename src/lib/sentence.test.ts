import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import { matchesSentence, sentenceTokens, shuffleSentence } from './sentence'

describe('sentence assembly', () => {
  it('keeps contractions, hyphenated words and attached punctuation intact', () => {
    expect(sentenceTokens("  Don't use long-term  plans. ").map((t) => t.text)).toEqual(["Don't", 'use', 'long-term', 'plans.'])
    expect(sentenceTokens('')).toEqual([])
  })
  it('never loses tokens or starts with the answer for published examples', () => {
    for (const word of seedWords) {
      const reference = sentenceTokens(word.example)
      expect(reference.length, word.word).toBeGreaterThan(1)
      for (const rng of [() => 0, () => 0.999999, Math.random]) {
        const shuffled = shuffleSentence(reference, rng)
        expect(shuffled.map((t) => t.id).sort((a, b) => a - b)).toEqual(reference.map((t) => t.id))
        expect(matchesSentence(shuffled, reference), word.word).toBe(false)
        expect(matchesSentence(reference, reference)).toBe(true)
      }
    }
  })
  it('allows repeated identical words to trade token identities but not reuse a token', () => {
    const reference = sentenceTokens('We know that that works.')
    const equivalent = [reference[0], reference[1], reference[3], reference[2], reference[4]]
    expect(matchesSentence(equivalent, reference)).toBe(true)
    expect(matchesSentence([reference[0], reference[1], reference[2], reference[2], reference[4]], reference)).toBe(false)
    expect(matchesSentence(reference.slice(0, -1), reference)).toBe(false)
    expect(matchesSentence([...reference].reverse(), reference)).toBe(false)
  })
  it('does not mutate the reference', () => {
    const reference = sentenceTokens('We can do it.')
    const snapshot = JSON.stringify(reference)
    shuffleSentence(reference)
    expect(JSON.stringify(reference)).toBe(snapshot)
  })
})
