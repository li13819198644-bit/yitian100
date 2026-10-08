import type { VocabWord, WordBreakdown } from '../types'
import { wordBreakdowns } from '../data/wordBreakdowns'

export function buildWordBreakdown(word: Pick<VocabWord, 'word' | 'meaning' | 'collocation'>): WordBreakdown {
  const reviewed = wordBreakdowns[word.word.toLowerCase()]
  if (reviewed) return reviewed
  // No arbitrary re-/pro-/able slicing: an unknown formation stays a whole word.
  const meaning = word.meaning.split(/[；;，,]/)[0].trim() || word.meaning
  return { kind: 'whole', parts: [{ text: word.word, meaning }],
    bridge: '先把整词和一个搭配连起来，不强拆字母。', cue: word.collocation || word.word }
}
