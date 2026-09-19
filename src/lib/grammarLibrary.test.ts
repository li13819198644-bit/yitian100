import { describe, expect, it } from 'vitest'
import { grammarLibrary, searchGrammarLibrary } from '../data/grammarLibrary'

describe('advanced grammar reading library', () => {
  it('publishes ten complete standalone readings, not questions', () => {
    expect(grammarLibrary).toHaveLength(10)
    expect(new Set(grammarLibrary.map((item) => item.id)).size).toBe(10)
    for (const article of grammarLibrary) {
      expect(article.sections).toHaveLength(3)
      expect(article.pitfall.length).toBeGreaterThan(20)
      expect(article.takeaway.length).toBeGreaterThan(10)
      expect(article.contrast.first).not.toBe(article.contrast.second)
      expect(article.contrast.explanation.length).toBeGreaterThan(20)
      expect(new URL(article.source.url).protocol).toBe('https:')
      expect(article).not.toHaveProperty('questions')
      for (const part of article.sections) {
        expect(part.title.trim().length).toBeGreaterThan(1)
        for (const value of [part.explanation, part.pattern, part.english, part.chinese, part.note]) expect(value.trim().length).toBeGreaterThan(3)
        expect(part.english).not.toContain('___')
      }
    }
  })
  it('searches titles and body in Chinese and English without case sensitivity', () => {
    expect(searchGrammarLibrary('倒装').some((a) => a.id === 'negative-inversion')).toBe(true)
    expect(searchGrammarLibrary('  HAVING  ').map((a) => a.id)).toContain('participle-clauses')
    expect(searchGrammarLibrary('cannot have').map((a) => a.id)).toContain('past-modals')
    expect(searchGrammarLibrary('xyz不存在')).toEqual([])
    expect(searchGrammarLibrary('   ')).toHaveLength(10)
  })
  it('combines category and search and never mutates the library', () => {
    const snapshot = JSON.stringify(grammarLibrary)
    expect(searchGrammarLibrary('', '时间与假设')).toHaveLength(3)
    expect(searchGrammarLibrary('never', '长句与结构').map((a) => a.id)).toEqual(['negative-inversion'])
    expect(searchGrammarLibrary('never', '时间与假设')).toEqual([])
    expect(JSON.stringify(grammarLibrary)).toBe(snapshot)
  })
})
