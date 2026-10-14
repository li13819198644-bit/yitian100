import type { VocabWord } from '../types'
import { buildWordSenses, sensePartOfSpeechLabel } from '../lib/wordSenses'

export function WordMeanings({ word, centered = false, detailed = false, compact = false }: {
  word: VocabWord; centered?: boolean; detailed?: boolean; compact?: boolean
}) {
  const senses = word.senses?.length ? word.senses : buildWordSenses(word)
  if (!senses?.length) return compact ? <span className="block text-sm text-stone-500">{word.meaning}</span> : <p className={`text-2xl font-medium ${centered ? 'text-center' : ''}`}>{word.meaning}</p>
  if (compact) return <span className="block text-sm text-stone-500">{senses.filter((sense) => !sense.lessCommon).map((sense, index) => <span key={index} className="block">{sensePartOfSpeechLabel(sense.partOfSpeech)} · {sense.meaning}</span>)}</span>
  const perSensePronunciation = senses.some((sense) => sense.phonetic)
  return <section aria-label="词性与释义" className={`space-y-4 ${centered ? 'text-center' : ''}`}>
    <p className="text-xs text-stone-500">常用词义</p>
    {senses.filter((sense) => !sense.lessCommon).map((sense, index) => <div key={index}>
      <p className="text-sm font-semibold text-emerald-800">{sensePartOfSpeechLabel(sense.partOfSpeech)}</p>
      {perSensePronunciation && <p className="mt-1 text-sm text-stone-500">{sense.phonetic ?? word.phonetic}</p>}
      <p className="mt-1 text-2xl font-medium leading-9">{sense.meaning}</p>
      {detailed && sense.collocation && <p className="mt-2 text-sm leading-6 text-stone-600">{sense.collocation}</p>}
      {detailed && sense.note && <p className="mt-1 text-sm leading-6 text-stone-500">{sense.note}</p>}
      {detailed && sense.example && <p className="mt-2 text-sm leading-6">{sense.example}</p>}
      {detailed && sense.translation && <p className="mt-1 text-sm leading-6 text-stone-600">{sense.translation}</p>}
    </div>)}
    {detailed && senses.some((sense) => sense.lessCommon) && <details className="text-sm text-stone-600">
      <summary className="min-h-11 cursor-pointer py-3">其他用法（较少见）</summary>
      {senses.filter((sense) => sense.lessCommon).map((sense, index) => <div key={index} className="mb-3">
        <p className="font-semibold text-emerald-800">{sensePartOfSpeechLabel(sense.partOfSpeech)}</p><p>{sense.meaning}</p>
        {sense.example && <p className="mt-2">{sense.example}</p>}{sense.translation && <p>{sense.translation}</p>}
      </div>)}
    </details>}
    {detailed && word.definitionSource && <a className="inline-flex min-h-11 items-center text-sm text-emerald-800 underline" href={word.definitionSource} target="_blank" rel="noopener noreferrer">词义出处 · Cambridge · 常用义选录</a>}
  </section>
}
