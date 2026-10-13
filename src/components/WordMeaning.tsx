import type { VocabWord } from '../types'

export function WordMeaning({ word, detailed = false }: { word: VocabWord; detailed?: boolean }) {
  if (!word.senses?.length) return <p className="mt-4 text-2xl font-medium">{word.meaning}</p>
  return <div className="mt-4 space-y-3 text-left">
    {word.senses.map((sense, index) => <div key={index} className="border-l-2 border-emerald-600 pl-3">
      <p className="text-sm font-medium text-emerald-800">{sense.partOfSpeech}</p>
      {sense.phonetic && <p className="text-sm text-stone-500">{sense.phonetic}</p>}
      <p className="mt-1 text-lg font-semibold">{sense.meaning}</p>
      {detailed && <><p className="mt-1 text-base">{sense.example}</p><p className="text-sm text-stone-500">{sense.translation}</p></>}
    </div>)}
    {detailed && word.definitionSource && <a className="inline-flex min-h-11 items-center text-sm text-emerald-800 underline" href={word.definitionSource} target="_blank" rel="noopener noreferrer">词义出处 · Cambridge · 常用义选录</a>}
  </div>
}
