import type { VocabWord } from '../types'
import { buildWordSenses, partOfSpeechLabels } from '../lib/wordSenses'

export function WordMeanings({ word, centered = false, detailed = false, compact = false }: {
  word: VocabWord; centered?: boolean; detailed?: boolean; compact?: boolean
}) {
  const senses = word.senses?.length ? word.senses : buildWordSenses(word)
  if (!senses?.length) return compact ? <span className="block text-sm text-stone-500">{word.meaning}</span> : <p className={`text-2xl font-medium ${centered ? 'text-center' : ''}`}>{word.meaning}</p>
  if (compact) return <span className="block text-sm text-stone-500">{senses.map((sense, index) => <span key={index} className="block">{partOfSpeechLabels[sense.partOfSpeech]} · {sense.meaning}</span>)}</span>
  const perSensePronunciation = senses.some((sense) => sense.phonetic)
  return <section aria-label="词性与释义" className={`space-y-4 ${centered ? 'text-center' : ''}`}>
    <p className="text-xs text-stone-500">常用词义</p>
    {senses.map((sense, index) => <div key={index}>
      <p className="text-sm font-semibold text-emerald-800">{partOfSpeechLabels[sense.partOfSpeech]}</p>
      {perSensePronunciation && <p className="mt-1 text-sm text-stone-500">{sense.phonetic ?? word.phonetic}</p>}
      <p className="mt-1 text-2xl font-medium leading-9">{sense.meaning}</p>
      {detailed && sense.collocation && <p className="mt-2 text-sm leading-6 text-stone-600">{sense.collocation}</p>}
      {detailed && sense.note && <p className="mt-1 text-sm leading-6 text-stone-500">{sense.note}</p>}
    </div>)}
  </section>
}
