import { expect, it } from 'vitest'
import { seedWords } from './seedWords'
import { withWordSenses, wordSenses } from './wordSenses'

it('covers the complete seed vocabulary with nonempty labelled senses and sources', () => {
  expect(seedWords).toHaveLength(605)
  for (const word of seedWords) {
    expect(word.senses?.length, word.word).toBeGreaterThan(0)
    expect(word.definitionSource, word.word).toMatch(/^https:\/\//)
    expect(word.definitionSourceLabel, word.word).toBeTruthy()
    for (const sense of word.senses ?? []) {
      expect(sense.partOfSpeech, word.word).toMatch(/词/)
      expect(sense.meaning.trim().length, word.word).toBeGreaterThan(0)
    }
    const { senses: _s, definitionSource: _d, definitionSourceLabel: _l, ...original } = word
    expect(withWordSenses(original)).toEqual(word)
  }
})

it('corrects misleading tags and preserves common secondary meanings', () => {
  expect(wordSenses.regardless[0].partOfSpeech).toContain('副词')
  for (const word of ['leverage', 'blunt', 'foreground']) {
    expect(wordSenses[word].some(s => s.partOfSpeech.includes('动词')), word).toBe(true)
  }
  expect(wordSenses.worldwide.map(s => s.partOfSpeech)).toEqual(['形容词 adj.', '副词 adv.'])
})

it('publishes verified senses on existing words without changing IDs', () => {
  for (const [word, senses] of Object.entries(wordSenses)) {
    const entry = seedWords.find(w => w.word === word)
    expect(entry, word).toBeDefined()
    expect(entry?.senses).toEqual(senses)
    expect(entry?.definitionSource).toContain('dictionary.cambridge.org')
  }
  expect(seedWords.find(w => w.word === 'concrete')?.senses?.some(s => s.meaning === '混凝土')).toBe(true)
})
