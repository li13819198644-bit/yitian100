import type { PartOfSpeech, VocabWord, WordSense } from '../types'
import { primaryPartsOfSpeech, reviewedWordSenses } from '../data/studyWordSenses'

export const partOfSpeechLabels: Record<PartOfSpeech, string> = {
  adjective: '形容词', noun: '名词', verb: '动词', adverb: '副词', preposition: '介词', conjunction: '连词',
}
export function buildWordSenses(word: Pick<VocabWord, 'word' | 'meaning'>): WordSense[] | undefined {
  const key = word.word.toLowerCase()
  if (reviewedWordSenses[key]) return reviewedWordSenses[key]
  const partOfSpeech = primaryPartsOfSpeech[key]
  return partOfSpeech ? [{ partOfSpeech, meaning: word.meaning }] : undefined
}
export function hasSensePronunciations(word: VocabWord): boolean {
  return (word.senses ?? buildWordSenses(word))?.some((sense) => sense.phonetic !== undefined) ?? false
}

export function formatWordMeanings(word: VocabWord): string {
  const senses = word.senses?.length ? word.senses : buildWordSenses(word)
  return senses?.length ? senses.map((sense) => `${partOfSpeechLabels[sense.partOfSpeech]}：${sense.meaning}`).join('；') : word.meaning
}

export function normalizeWordSenses(value: unknown): WordSense[] | undefined {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value)) throw new Error('senses 必须是词性与释义数组')
  if (!value.length) return undefined
  return value.map((item) => {
    if (!item || typeof item !== 'object' || !Object.hasOwn(partOfSpeechLabels, item.partOfSpeech)
      || typeof item.meaning !== 'string' || !item.meaning.trim()) throw new Error('每个义项需要有效的 partOfSpeech 和非空 meaning')
    return { partOfSpeech: item.partOfSpeech as PartOfSpeech, meaning: item.meaning.trim(),
      ...(typeof item.collocation === 'string' && item.collocation.trim() ? { collocation: item.collocation.trim() } : {}),
      ...(typeof item.phonetic === 'string' && item.phonetic.trim() ? { phonetic: item.phonetic.trim() } : {}),
      ...(typeof item.note === 'string' && item.note.trim() ? { note: item.note.trim() } : {}) }
  })
}
