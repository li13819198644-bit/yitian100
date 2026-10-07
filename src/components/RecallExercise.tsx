import { useState } from 'react'
import type { StudyMode } from '../types'

/** Options are a fallback; they never count as independent retrieval. */
export function RecallExercise({ question, answer, choices, english, onAnswer, onRevealed }: {
  question: string; answer: string; choices: string[]; english: boolean
  onRevealed?: () => void
  onAnswer: (correct: boolean, mode: StudyMode) => void
}) {
  const [stage, setStage] = useState<'recall' | 'choices' | 'feedback'>('recall')
  const [result, setResult] = useState<{ correct: boolean; mode: StudyMode }>()
  const [saved, setSaved] = useState(false)
  function check(correct: boolean, mode: StudyMode) {
    onRevealed?.(); setResult({ correct, mode }); setStage('feedback')
  }
  const mode = english ? 'choice' : 'recall'
  const [needsHint, setNeedsHint] = useState(false)
  return <div className="space-y-4">
    <p className="text-sm text-stone-500">{english ? '先在心里回忆英文。会就核对答案，不确定可展开选项，无需打字。' : '先在心里说出词义，再查看答案核对。'}</p>
    <p className="break-words whitespace-pre-line text-2xl font-semibold">{question}</p>
    {stage === 'recall' && <div className="grid gap-3">
      {english && <button className="tap-button bg-emerald-600 text-white" onClick={() => { onRevealed?.(); setStage('feedback') }}>会</button>}
      {english && choices.length > 0 && <button className="tap-button bg-stone-950 text-white" onClick={() => { onRevealed?.(); setStage('choices') }}>展开英文选项</button>}
      {!english && <button className="tap-button bg-stone-950 text-white" onClick={() => { onRevealed?.(); setStage('feedback') }}>查看答案，核对我的回忆</button>}
      {choices.length > 0 && <button className="tap-button bg-amber-50 text-amber-900" onClick={() => { onRevealed?.(); setNeedsHint(true); setStage('choices') }}>{english ? '不会，展开选项' : '想不起来，展开选项'}</button>}
      <button className="tap-button bg-stone-100" onClick={() => check(false, mode)}>没想起来，看答案</button>
    </div>}
    {stage === 'choices' && <div className="grid gap-3">
      <p className="text-sm text-amber-800">{needsHint ? '本题已使用提示，选对也不计为独立记住。' : '请选择正确英文。选择题记录为辨认练习，不等于独立拼写或表达。'}</p>
      {choices.map((choice) => <button key={choice} className="tap-button bg-stone-100 text-left" onClick={() => check(choice === answer, english && !needsHint ? 'choice' : 'assisted')}>{choice}</button>)}
    </div>}
    {stage === 'feedback' && <div className="grid gap-3" aria-live="polite">
      <p className="rounded-lg bg-stone-100 p-4 font-semibold">参考答案：{answer}</p>
      {!result ? <>
        <p className="text-sm text-stone-500">按查看答案前的回忆判断；现在觉得熟悉不算想起来。</p>
        <button className="tap-button bg-emerald-600 text-white" disabled={saved} onClick={() => { setSaved(true); onAnswer(true, english ? 'self' : 'recall') }}>{english ? '确实会，继续' : '查看前已想起词义'}</button>
        <button className="tap-button bg-rose-600 text-white" disabled={saved} onClick={() => { setSaved(true); onAnswer(false, english ? 'self' : 'recall') }}>{english ? '想错了，需要复习' : '没想起 / 想错了'}</button>
      </> : <>
        <p>{result.mode === 'assisted' ? result.correct ? '提示后答对，仍需无提示复习。' : '提示后仍未答对，稍后再练。' : result.correct ? result.mode === 'choice' ? '选择正确，还需继续巩固。' : '独立回忆正确。' : '本次未能独立回忆；理解答案后再练。'}</p>
        <button className="tap-button bg-stone-950 text-white" disabled={saved} onClick={() => { setSaved(true); onAnswer(result.correct, result.mode) }}>保存并继续</button>
      </>}
    </div>}
  </div>
}
