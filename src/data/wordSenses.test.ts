import { expect, it } from 'vitest'
import { seedWords } from './seedWords'
import { wordSenses } from './wordSenses'

it('publishes verified senses on existing words without changing IDs', () => {
  for (const [word, senses] of Object.entries(wordSenses)) {
    const entry = seedWords.find(w => w.word === word)
    expect(entry, word).toBeDefined()
    expect(entry?.senses).toEqual(senses)
    expect(entry?.definitionSource).toContain('dictionary.cambridge.org')
  }
  expect(seedWords.find(w => w.word === 'concrete')?.senses?.some(s => s.meaning === '混凝土')).toBe(true)
})
