import { useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import type { TodayWord } from '../lib/todayWords'

export function TodayWordsPanel({ items, onOpen, onBack }: { items: TodayWord[]; onOpen: (id: string) => void; onBack: () => void }) {
  const [missedOnly, setMissedOnly] = useState(false)
  const filtered = items.filter(item => !missedOnly || item.missed)
  return <section className="space-y-4" aria-label="今日单词回顾">
    <div className="flex items-center gap-3">
      <button className="icon-button shrink-0" onClick={onBack} aria-label="返回首页" title="返回首页"><ArrowLeft size={20} /></button>
      <h2 className="text-xl font-semibold">今日单词回顾 · {items.length}</h2>
    </div>
    <div className="flex border-b border-stone-200" role="group" aria-label="筛选当天单词">
      <button className={`min-h-12 flex-1 border-b-2 px-2 ${!missedOnly ? 'border-stone-950 font-semibold' : 'border-transparent text-stone-500'}`} aria-pressed={!missedOnly} onClick={() => setMissedOnly(false)}>全部 · {items.length}</button>
      <button className={`min-h-12 flex-1 border-b-2 px-2 ${missedOnly ? 'border-stone-950 font-semibold' : 'border-transparent text-stone-500'}`} aria-pressed={missedOnly} onClick={() => setMissedOnly(true)}>今天答错过 · {items.filter(item => item.missed).length}</button>
    </div>
    {!filtered.length && <p className="py-8 text-center text-stone-500">{missedOnly ? '今天还没有记录到错词。' : '今天还没有学习记录。'}</p>}
    <ul className="divide-y divide-stone-200">{filtered.map(({ word, missed }) => <li key={word.id}>
      <button className="flex min-h-16 w-full items-center gap-3 py-4 text-left" onClick={() => onOpen(word.id)} aria-label={`查看 ${word.word} 词卡`}>
        <span className="min-w-0 flex-1 break-words text-xl font-semibold" lang="en">{word.word}</span>
        {missed && <span className="shrink-0 text-xs text-rose-700">答错过</span>}
        <ChevronRight size={20} className="shrink-0 text-stone-500" aria-hidden="true" />
      </button>
    </li>)}</ul>
  </section>
}
