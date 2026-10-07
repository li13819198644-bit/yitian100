import { useState } from 'react'
import type { StudyMode } from '../types'

/** Options are a fallback; they never count as independent retrieval. */
export function RecallExercise({ question, answer, choices, english, onAnswer, onRevealed }: {
  question: string; answer: string; choices: string[]; english: boolean
  onRevealed?: () => void
  onAnswer: (correct: boolean, mode: StudyMode) => void
}) {
  const [input, setInput] = useState('')
  const [stage, setStage] = useState<'recall' | 'choices' | 'feedback'>('recall')
  const [result, setResult] = useState<{ correct: boolean; mode: StudyMode }>()
  const [saved, setSaved] = useState(false)
  function check(correct: boolean, mode: StudyMode) {
    onRevealed?.(); setResult({ correct, mode }); setStage('feedback')
  }
  const mode = english ? 'production' : 'recall'
  return <div className="space-y-4">
    <p className="text-sm text-stone-500">{english ? '先根据提示回忆英文，不显示选项。' : '先在心里说出词义，再查看答案核对。'}</p>
    <p className="break-words whitespace-pre-line text-2xl font-semibold">{question}</p>
    {stage === 'recall' && <div className="grid gap-3">
      {english && <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); if (input.trim()) check(input.trim().toLowerCase() === answer.trim().toLowerCase(), mode) }}>
        <input aria-label="回忆英文" className="min-h-14 rounded-lg border border-stone-300 px-4 text-xl" value={input} onChange={(event) => setInput(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="输入英文单词" />
        <button className="tap-button bg-stone-950 text-white disabled:opacity-50" disabled={!input.trim()}>检查答案</button>
      </form>}
      {!english && <button className="tap-button bg-stone-950 text-white" onClick={() => { onRevealed?.(); setStage('feedback') }}>查看答案，核对我的回忆</button>}
      {choices.length > 0 && <button className="tap-button bg-amber-50 text-amber-900" onClick={() => { onRevealed?.(); setStage('choices') }}>想不起来，展开选项</button>}
      <button className="tap-button bg-stone-100" onClick={() => check(false, mode)}>没想起来，看答案</button>
    </div>}
    {stage === 'choices' && <div className="grid gap-3">
      <p className="text-sm text-amber-800">本题已使用提示，选对也不计为独立记住。</p>
      {choices.map((choice) => <button key={choice} className="tap-button bg-stone-100 text-left" onClick={() => check(choice === answer, 'assisted')}>{choice}</button>)}
    </div>}
    {stage === 'feedback' && <div className="grid gap-3" aria-live="polite">
      {input && <p className="text-sm text-stone-500">你的回答：{input}</p>}
      <p className="rounded-lg bg-stone-100 p-4 font-semibold">参考答案：{answer}</p>
      {!result ? <>
        <p className="text-sm text-stone-500">按查看答案前的回忆判断；现在觉得熟悉不算想起来。</p>
        <button className="tap-button bg-emerald-600 text-white" disabled={saved} onClick={() => { setSaved(true); onAnswer(true, 'recall') }}>查看前已想起词义</button>
        <button className="tap-button bg-rose-600 text-white" disabled={saved} onClick={() => { setSaved(true); onAnswer(false, 'recall') }}>没想起 / 想错了</button>
      </> : <>
        <p>{result.mode === 'assisted' ? result.correct ? '提示后答对，仍需无提示复习。' : '提示后仍未答对，稍后再练。' : result.correct ? '独立回忆正确。' : '本次未能独立回忆；理解答案后再练。'}</p>
        {english && <p className="text-xs text-stone-500">此题按目标词拼写核对，不评价完整句子的语法。</p>}
        <button className="tap-button bg-stone-950 text-white" disabled={saved} onClick={() => { setSaved(true); onAnswer(result.correct, result.mode) }}>保存并继续</button>
      </>}
    </div>}
  </div>
}
