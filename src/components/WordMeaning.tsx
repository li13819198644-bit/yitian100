import type { VocabWord } from '../types'

export function WordMeaning({ word, detailed = false }: { word: VocabWord; detailed?: boolean }) {
  if (!word.senses?.length) return <p className="mt-4 text-2xl font-medium">{word.meaning}</p>
  const renderSense = (sense: NonNullable<VocabWord['senses']>[number], index: number) => <div key={index} className="border-l-2 border-emerald-600 pl-3">
    <p className="text-sm font-medium text-emerald-800">{sense.partOfSpeech}</p>
    {sense.phonetic && <p className="text-sm text-stone-500">{sense.phonetic}</p>}
    <p className="mt-1 text-lg font-semibold">{sense.meaning}</p>
    {detailed && sense.example && <p className="mt-1 text-base">{sense.example}</p>}
    {detailed && sense.translation && <p className="text-sm text-stone-500">{sense.translation}</p>}
  </div>
  return <div className="mt-4 space-y-3 text-left">
    {word.definitionSourceLabel === 'ECDICT 开源英汉词典' && word.senses.length > 1 && <p className="text-base text-stone-600">学习重点：{word.meaning}</p>}
    {word.senses.slice(0, detailed ? undefined : 2).map(renderSense)}
    {!detailed && word.senses.length > 2 && <details><summary className="min-h-11 cursor-pointer py-2 text-sm text-emerald-800">其他词性与义项（{word.senses.length - 2}）</summary><div className="space-y-3">{word.senses.slice(2).map(renderSense)}</div></details>}
    {detailed && word.definitionSource && <a className="inline-flex min-h-11 items-center text-sm text-emerald-800 underline" href={word.definitionSource} target="_blank" rel="noopener noreferrer">词义出处 · {word.definitionSourceLabel ?? 'Cambridge'} · 义项选录</a>}
  </div>
}
