import type { SemanticCard } from '../data/semanticCards'

export function SemanticEncoding({ card, mnemonic }: { card: SemanticCard; mnemonic?: string }) {
  return <div className="space-y-3 rounded-lg bg-white p-5 ring-1 ring-stone-200" aria-label="准确词义与用法">
    <p className="text-3xl font-semibold">{card.word}</p>
    <p className="text-sm text-stone-500">{card.partOfSpeech}</p>
    <p className="text-xs text-stone-500">本次核心用法</p>
    <p className="text-xl font-semibold">{card.meaning}</p>
    <p lang="en" className="font-semibold">{card.collocation}</p>
    {card.collocationMeaning && <p>{card.collocationMeaning}</p>}
    <p lang="en" className="leading-7">{card.example}</p>
    {card.translation && <p className="text-sm text-stone-600">{card.translation}</p>}
    {card.otherSenses && card.otherSenses.length > 1 && <details><summary className="min-h-11 cursor-pointer py-3 text-sm">其他词性与常用义</summary>{card.otherSenses.map((sense, index) => <p className="mb-2 text-sm" key={index}><strong>{sense.partOfSpeech}</strong>：{sense.meaning}</p>)}</details>}
    {card.correction && <p className="rounded-lg bg-amber-50 p-3 text-sm leading-6">{card.correction}</p>}
    {card.contrast && <div className="space-y-2 border-t border-stone-200 pt-3"><p className="text-sm font-semibold">针对已出现的混淆</p>{card.contrast.map(item => <p key={item.word} className="text-sm"><strong>{item.word}</strong>：{item.meaning}<br /><span lang="en">{item.phrase}</span></p>)}</div>}
    {mnemonic && <details><summary className="min-h-11 cursor-pointer py-3 text-sm">辅助联想（可选）</summary><p className="text-sm leading-6">{mnemonic}</p></details>}
  </div>
}
