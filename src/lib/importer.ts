import type { VocabWord } from '../types'

function normalizeWord(raw: Partial<VocabWord>, index: number): VocabWord {
  const word = String(raw.word ?? '').trim()
  if (!word) throw new Error(`第 ${index + 1} 条缺少 word`)
  return {
    id: String(raw.id ?? word).trim().toLowerCase(),
    word,
    phonetic: String(raw.phonetic ?? '').trim(),
    meaning: String(raw.meaning ?? '').trim(),
    collocation: String(raw.collocation ?? '').trim(),
    example: String(raw.example ?? '').trim(),
    difficulty: Number(raw.difficulty || 3) as VocabWord['difficulty'],
    level: raw.level === 'C1' ? 'C1' : 'B2',
  }
}

export function parseVocabulary(text: string, fileName = 'vocabulary.json'): VocabWord[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  if (fileName.endsWith('.json') || trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as Partial<VocabWord>[]
    return parsed.map(normalizeWord)
  }

  const [headerLine, ...lines] = trimmed.split(/\r?\n/)
  const headers = headerLine.split(',').map((item) => item.trim())
  return lines
    .filter(Boolean)
    .map((line, index) => {
      const values = line.split(',').map((item) => item.trim())
      const raw = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? '']))
      return normalizeWord(raw, index)
    })
}
