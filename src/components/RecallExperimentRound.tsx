import { useRef, useState } from 'react'
import type { SemanticCard } from '../data/semanticCards'
import { gradeRecall, learningEvent, newId, type LearningEvent, type RecallDirection, type RecallEffort } from '../lib/learningProtocol'
import { useActiveClock } from '../lib/useActiveClock'

export function RecallExperimentRound({ cards, direction, experimentId, checkpoint, onSubmit, onCancel }: {
  cards: SemanticCard[]; direction: RecallDirection; experimentId: string; checkpoint: LearningEvent['checkpoint']
  onSubmit: (events: LearningEvent[]) => Promise<void>; onCancel: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({}), [effort, setEffort] = useState<RecallEffort>()
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const lock = useRef(false), pending = useRef<LearningEvent[] | null>(null), session = useRef(newId())
  const askedAt = useRef(Date.now())
  const clock = useActiveClock(!busy)
  async function submit() {
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    pending.current ??= cards.flatMap(card => {
      const answer = answers[card.id] ?? ''
      return [{ ...learningEvent({ wordId: card.id, kind: 'recall', cue: 'none', direction, answer, outcome: gradeRecall(card, answer, direction), assessment: 'typed-match', activeMs: clock.read() / cards.length, effort, sessionId: session.current, experimentId, checkpoint }, askedAt.current), updatedAt: Date.now() }]
    })
    try { await onSubmit(pending.current) }
    catch { setError('保存未完成，答案仍保留，请重试。') }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="space-y-4" aria-label="无提示提取测试">
    <h2 className="text-xl font-semibold">{direction === 'zh-en' ? '反向提取 · 无英文提示' : '独立词义提取 · 无图片和选项'}</h2>
    <p className="text-sm leading-6">{direction === 'zh-en' ? '从中文回忆本轮学过的英文目标词，不回看之前的单词。' : '从英文回忆中文，不回看词卡。'}想不起来可以留空，提交后统一纠正。</p>
    {cards.map((card, index) => <label className="block space-y-2 rounded-lg bg-white p-4" key={index}><span className="block font-semibold">{index + 1}. {direction === 'zh-en' ? card.meaning : card.word}</span><input className="min-h-12 w-full rounded-lg border border-stone-300 p-3" aria-label={`第${index + 1}题答案`} value={answers[card.id] ?? ''} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={busy} onChange={event => setAnswers(previous => ({ ...previous, [card.id]: event.target.value }))} /></label>)}
    <fieldset><legend className="text-sm font-semibold">这次回忆的整体感觉（可选）</legend>{(['easy', 'thinking', 'difficult'] as const).map((value, index) => <label className="flex min-h-11 items-center gap-2" key={value}><input type="radio" name="experiment-effort" checked={effort === value} onChange={() => setEffort(value)} disabled={busy} />{['很轻松，几乎立即想到', '需要想几秒钟', '很吃力，靠猜测或联想'][index]}</label>)}</fieldset>
    {error && <p role="alert">{error}</p>}
    <button disabled={busy} className="tap-button w-full bg-stone-950 text-white" onClick={() => void submit()}>{busy ? '正在保存…' : '提交本轮结果'}</button>
    <button disabled={busy} className="tap-button w-full bg-white" onClick={onCancel}>暂不测试</button>
  </section>
}
