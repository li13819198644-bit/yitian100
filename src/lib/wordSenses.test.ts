import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import { primaryPartsOfSpeech, reviewedWordSenses } from '../data/studyWordSenses'
import { buildWordSenses, formatWordMeanings, normalizeWordSenses } from './wordSenses'
import { parseVocabulary } from './importer'
import { buildDailyReport } from './dailyReport'
import { localDateKey, recordStudyResult } from './studyStats'

describe('part of speech belongs to its meaning', () => {
  it('covers all 605 current study meanings without changing IDs or inventing a label for an unknown word', () => {
    expect(Object.keys(primaryPartsOfSpeech).sort()).toEqual(seedWords.map((word) => word.word).sort())
    expect(new Set(seedWords.map((word) => word.id)).size).toBe(605)
    for (const word of seedWords) expect(word.senses?.every((sense) => sense.partOfSpeech && sense.meaning.trim()), word.word).toBe(true)
    for (const word of Object.keys(reviewedWordSenses)) expect(seedWords.some((item) => item.word === word), word).toBe(true)
    expect(buildWordSenses({ word: 'custom-term', meaning: '自定义含义' })).toBeUndefined()
  })
  it('separates concrete adjective and material noun, including the uncountable usage', () => {
    const word = seedWords.find((word) => word.word === 'concrete')!
    expect(word.senses).toMatchObject([
      { partOfSpeech: expect.stringContaining('形容词'), meaning: expect.stringContaining('具体的、明确的'), collocation: 'concrete evidence：明确的证据' },
      { partOfSpeech: expect.stringContaining('名词'), meaning: '混凝土', collocation: 'pour concrete：浇筑混凝土', note: expect.stringContaining('不可数') },
      { partOfSpeech: expect.stringContaining('动词'), lessCommon: true, meaning: '用混凝土覆盖或铺设' },
    ])
    expect(word.meaning).not.toContain('混凝土的')
    expect(word.usageNote).toContain('较少用的动词')
    expect(formatWordMeanings(word)).toBe('形容词：具体的、明确的；实在的；不可数名词：混凝土')
  })
  it('keeps abstracts, variable nouns and adjective meanings in separate rows', () => {
    expect(reviewedWordSenses.abstract).toMatchObject([{ partOfSpeech: 'adjective', meaning: '抽象的' }, { partOfSpeech: 'noun', meaning: '摘要' }])
    expect(reviewedWordSenses.variable).toMatchObject([{ partOfSpeech: 'noun', meaning: '变量' }, { partOfSpeech: 'adjective', meaning: '可变的、多变的' }])
    expect(reviewedWordSenses.function).toMatchObject([{ partOfSpeech: 'noun', meaning: '功能；作用' }, { partOfSpeech: 'verb', meaning: '运作、起作用' }])
  })
  it('associates stress and pronunciation differences with the correct usage', () => {
    expect(reviewedWordSenses.permit).toMatchObject([{ partOfSpeech: 'verb', phonetic: '/pərˈmɪt/' }, { partOfSpeech: 'noun', phonetic: '/ˈpɜːrmɪt/' }])
    expect(reviewedWordSenses.refund).toMatchObject([{ partOfSpeech: 'noun', phonetic: '/ˈriːfʌnd/' }, { partOfSpeech: 'verb', phonetic: '/rɪˈfʌnd/' }])
    expect(reviewedWordSenses.moderate[0].phonetic).not.toBe(reviewedWordSenses.moderate[1].phonetic)
  })
  it('imports structured meanings and preserves old JSON and CSV data without requiring new fields', () => {
    const senses = [{ partOfSpeech: 'noun', meaning: ' 名词含义 ', collocation: ' an example ' }]
    const imported = parseVocabulary(JSON.stringify([{ word: 'custom-term', senses }]))[0]
    expect(imported.meaning).toBe('名词含义')
    expect(imported.senses).toEqual([{ partOfSpeech: 'noun', meaning: '名词含义', collocation: 'an example' }])
    expect(parseVocabulary('[{"word":"old-term","meaning":"旧释义"}]')[0]).toMatchObject({ id: 'old-term', meaning: '旧释义' })
    expect(parseVocabulary('word,meaning\nold-term,旧释义', 'old.csv')[0].meaning).toBe('旧释义')
    expect(() => normalizeWordSenses([{ partOfSpeech: 'guess', meaning: '猜测' }])).toThrow('有效的 partOfSpeech')
    expect(() => normalizeWordSenses([{ partOfSpeech: 'noun', meaning: '' }])).toThrow('非空 meaning')
    const legacy = { partOfSpeech: '可数名词 n. [C]', meaning: '条目', example: 'An entry.', translation: '一个条目。' }
    expect(parseVocabulary(JSON.stringify([{ word: 'custom-term', senses: [legacy] }]))[0].senses).toEqual([legacy])
  })
  it('exports the paired meanings in the daily report rather than flattening them into an adjective', () => {
    const now = Date.now()
    const word = seedWords.find((word) => word.word === 'concrete')!
    const stats = recordStudyResult({ todayDate: localDateKey(new Date(now)), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }, word.id, true, 'self', now)
    const report = buildDailyReport([word], [], stats, [], now)
    expect(report.vocabulary.results[0]).toMatchObject({ meaning: '形容词：具体的、明确的；实在的；不可数名词：混凝土', senses: word.senses })
  })
})
