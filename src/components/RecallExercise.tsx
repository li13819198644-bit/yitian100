import { useState } from 'react'
import { useQuickAnswer, type AnswerHandler } from '../lib/useQuickAnswer'

export function RecallExercise({ question, answer, choices, english, onAnswer, onAnswered }: {
  question: string; answer: string; choices: string[]; english: boolean
  onAnswered?: () => void
  onAnswer: AnswerHandler
}) {
  const [options] = useState(() => [...new Set([answer, ...choices])].sort((a, b) => choices.indexOf(a) - choices.indexOf(b)))
  const { result, error, submit } = useQuickAnswer(onAnswer, onAnswered)
  const disabled = result !== null
  return <div className="space-y-4">
    <p className="text-sm text-stone-500">{english ? '选择英文' : '选择正确意思'} · 点一次自动继续</p>
    <p className="break-words whitespace-pre-line text-2xl font-semibold">{question}</p>
    <div className="grid grid-cols-2 gap-3">
      <button disabled={disabled} className="tap-button bg-emerald-600 text-white" onClick={() => submit(true, 'self')}>会</button>
      <button disabled={disabled} className="tap-button bg-stone-100" onClick={() => submit(false, 'self')}>不会</button>
    </div>
    <div className="grid gap-3">
      {options.map((choice) => <button key={choice} disabled={disabled} className={`tap-button text-left ${disabled && choice === answer ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100'}`} onClick={() => submit(choice === answer, 'choice')}>{choice}</button>)}
    </div>
    {result !== null && <p role="status" className={result ? 'text-emerald-800' : 'text-rose-800'}>{result ? '已记下，正在继续…' : `正确答案：${answer}，已安排再练。`}</p>}
    {error && <p role="alert" className="text-rose-800">{error}</p>}
  </div>
}
