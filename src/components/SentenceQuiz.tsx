import { useState } from 'react'
import { useQuickAnswer } from '../lib/useQuickAnswer'
import { RotateCcw, Undo2 } from 'lucide-react'
import { matchesSentence, sentenceTokens, shuffleSentence } from '../lib/sentence'

export function SentenceQuiz({ sentence, onChecked, onAnswer }: {
  sentence: string
  onChecked: () => void
  onAnswer: (correct: boolean) => void | boolean | Promise<void | boolean>
}) {
  const [reference] = useState(() => sentenceTokens(sentence))
  const [pool] = useState(() => shuffleSentence(reference))
  const [selected, setSelected] = useState<number[]>([])
  const { result, error, submit } = useQuickAnswer(onAnswer, onChecked)
  const tokens = selected.map((id) => reference[id])
  const tile = 'min-h-11 max-w-full break-words rounded-lg px-3 py-2 text-base ring-1 ring-stone-300 disabled:opacity-30'

  if (reference.length < 2) return <p className="mt-4 text-stone-600">此词暂无可用例句，请选择其他题型。</p>

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-stone-500">还原例句 · {selected.length}/{reference.length}</p>
        <div className="flex gap-2">
          <button type="button" title="撤回最后一个词" aria-label="撤回最后一个词" className="flex h-11 w-11 items-center justify-center disabled:opacity-30" disabled={!selected.length || result !== null} onClick={() => setSelected((ids) => ids.slice(0, -1))}><Undo2 size={20} /></button>
          <button type="button" title="重新组句" aria-label="重新组句" className="flex h-11 w-11 items-center justify-center disabled:opacity-30" disabled={!selected.length || result !== null} onClick={() => setSelected([])}><RotateCcw size={20} /></button>
        </div>
      </div>
      <div aria-label="已选词序" className="flex min-h-28 flex-wrap content-start gap-2 border-b-2 border-emerald-500 py-3">
        {tokens.map((token) => <button key={token.id} type="button" aria-label={`移回 ${token.text}`} disabled={result !== null} className={`${tile} bg-emerald-50 text-emerald-950`} onClick={() => setSelected((ids) => ids.filter((id) => id !== token.id))}>{token.text}</button>)}
      </div>
      <div aria-label="待选词块" className="flex flex-wrap gap-2">
        {pool.map((token) => <button key={token.id} type="button" aria-label={`选择 ${token.text}`} disabled={selected.includes(token.id) || result !== null} className={`${tile} bg-stone-50`} onClick={() => {
          if (selected.includes(token.id) || result !== null) return
          const next = [...selected, token.id]
          setSelected(next)
          if (next.length === reference.length) submit(matchesSentence(next.map((id) => reference[id]), reference), 'sentence')
        }}>{token.text}</button>)}
      </div>
      {result !== null && <div role="status" className={`rounded-lg p-3 ${result ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
        <p className="font-semibold">{result ? '已还原例句' : '与参考例句顺序不同'}</p>
        <p className="mt-2 break-words leading-7">{sentence}</p>
        {!result && <p className="mt-2 text-sm">本题按参考语序计分，不代表其他表达一定有语法错误。</p>}
      </div>}
      {error && <p role="alert" className="text-rose-800">{error}撤回一个词后可重新提交。</p>}
    </div>
  )
}
