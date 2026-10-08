import type { VocabWord } from '../types'
import { buildWordBreakdown } from '../lib/wordBreakdown'

export function WordBreakdownPanel({ word }: { word: VocabWord }) {
  const breakdown = word.wordBreakdown ?? buildWordBreakdown(word)
  const label = { formation: '构词拆解', historical: '历史词根线索', spelling: '拼写助记 · 不是词根', whole: '整词抓手' }[breakdown.kind]
  return <section aria-label="拆开记" className="mt-4 rounded-lg bg-sky-50 p-4 ring-1 ring-sky-200">
    <h3 className="text-sm font-semibold text-sky-950">{label}</h3>
    <div className="mt-3 flex flex-wrap items-start gap-2" aria-label={`${word.word} 的记忆块`}>
      {breakdown.parts.map((part, index) => <div key={`${index}:${part.text}`} className="rounded-lg bg-white px-3 py-2 text-center ring-1 ring-sky-100">
        <p className="text-lg font-semibold" lang="en">{part.text}</p>
        {part.meaning && <p className="mt-1 max-w-44 text-xs leading-5 text-stone-600">{part.meaning}</p>}
      </div>)}
    </div>
    <p className="mt-3 font-medium leading-7 text-sky-950">{breakdown.bridge}</p>
    <p className="mt-2 leading-6 text-stone-700">只记这组：{breakdown.cue}</p>
    {breakdown.note && <p className="mt-2 text-sm leading-6 text-stone-600">{breakdown.note}</p>}
    <p className="mt-3 text-xs leading-5 text-stone-500">把目光移开，心里回忆一次含义，再连到这组搭配。</p>
  </section>
}
