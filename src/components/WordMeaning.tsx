import type { VocabWord } from '../types'
import { WordMeanings } from './WordMeanings'

export function WordMeaning({ word, detailed = false }: { word: VocabWord; detailed?: boolean }) {
  return <WordMeanings word={word} detailed={detailed} />
}
