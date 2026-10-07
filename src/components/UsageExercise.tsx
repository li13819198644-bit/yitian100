import { useState } from 'react'

export function UsageExercise({ word, meaning, collocation, example, onAnswer, onRevealed }: {
  word: string; meaning: string; collocation: string; example: string; onRevealed?: () => void; onAnswer: (correct: boolean) => void
}) {
  const [revealed, setRevealed] = useState(false)
  const [saved, setSaved] = useState(false)
  return <div className="grid gap-3">
    <p className="text-2xl font-semibold">{word} · {meaning}</p>
    <p className="text-sm text-stone-600">想一个你会遇到的场景，在心里用这个词说一句话。先自己想，再看搭配和例句。</p>

    {!revealed ? <button className="tap-button bg-stone-950 text-white" onClick={() => { onRevealed?.(); setRevealed(true) }}>查看搭配和参考例句</button> : <>
      <p className="rounded-lg bg-stone-100 p-3">常用搭配：{collocation || '暂无'}<br />参考例句：{example || '暂无'}</p>
      <p className="text-sm text-stone-600">这是表达自评，不是自动语法评分。检查词义、搭配与句子结构；不确定时选择“需要再练”。</p>
      <button className="tap-button bg-emerald-600 text-white disabled:opacity-50" disabled={saved} onClick={() => { setSaved(true); onAnswer(true) }}>我已在心里表达，并核对了用法</button>
      <button className="tap-button bg-rose-600 text-white" disabled={saved} onClick={() => { setSaved(true); onAnswer(false) }}>需要再练 / 不确定</button>
    </>}
  </div>
}
