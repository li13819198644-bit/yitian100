import { useState } from 'react'
import type { ReviewReason, VocabWord, WordProgress } from '../types'
import { interventionText, needsIntervention } from '../lib/intervention'

export function TargetedReview({ word, progress, onReviewed }: {
  word: VocabWord; progress?: WordProgress
  onReviewed: (reason: ReviewReason) => Promise<boolean>
}) {
  const [reason, setReason] = useState<ReviewReason>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!needsIntervention(progress)) return null
  async function review(value: ReviewReason) {
    if (busy) return
    setBusy(true); setError('')
    try { if (await onReviewed(value)) { setReason(value); return } } catch { /* Preserve the existing detail and allow retry. */ }
    finally { setBusy(false) }
    setError('复盘标记未保存，可重新点一次。')
  }
  return <details className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
    <summary className="min-h-11 cursor-pointer font-semibold">针对性复盘（可选）</summary>
    <p className="mt-2 text-sm text-stone-600">{(progress?.evidence?.failureDays.length ?? 0) >= 2 ? '已记录多个学习日出错。' : '累计多次出错；历史跨日错误资料不足。'}选一个卡点，只看一条说明。</p>
    <div className="mt-3 grid grid-cols-2 gap-2">{([['meaning', '词义记不住'], ['usage', '搭配不会用'], ['confusion', '容易混淆'], ['form', '字形记不住']] as const).map(([key, label]) => <button key={key} disabled={busy} aria-pressed={reason === key} className="tap-button bg-white" onClick={() => void review(key)}>{label}</button>)}</div>
    {reason && <p className="mt-4 leading-7">{interventionText(word, reason)}</p>}
    {reason && <p className="mt-3 text-sm text-stone-500">现在看懂先算练习，隔天再回忆才检查保持。</p>}
    {error && <p role="alert" className="mt-3 text-rose-800">{error}</p>}
  </details>
}
