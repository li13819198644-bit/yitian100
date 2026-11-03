import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { learningEvent, newId, type LearningEvent, type VocabularyExperiment } from '../lib/learningProtocol'
import { useActiveClock } from '../lib/useActiveClock'
import { SemanticEncoding } from './SemanticEncoding'
import { LearningObjectDiagram } from './LearningObjectDiagram'

export function ExperimentStudyRound({ experiment, arm, onSave, onBack }: {
  experiment: VocabularyExperiment; arm: 'A' | 'B' | 'pilot'
  onSave: (experiment: VocabularyExperiment, events: LearningEvent[]) => Promise<void>; onBack: () => void
}) {
  const [step, setStep] = useState(experiment.studyStep?.[arm] ?? 0), [revealed, setRevealed] = useState(false)
  const [paused, setPaused] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const clock = useActiveClock(!paused, experiment.activeMs[arm] ?? 0)
  const locked = useRef(false), lastSaved = useRef(experiment.activeMs[arm] ?? 0), lastAction = useRef(experiment.activeMs[arm] ?? 0), session = useRef(newId())
  const items = experiment.items.filter(item => item.arm === arm), item = items[step % items.length], card = item.card
  const phase = arm !== 'B' || step < items.length || step >= items.length * 3 ? 'encoding' : step < items.length * 2 ? 'context' : 'recall'
  const finished = experiment.kind === 'ab14' && clock.elapsedMs >= experiment.budgetMs
  async function commit(nextStep: number, finish = false, outcome: LearningEvent['outcome'] = null) {
    if (locked.current) return
    locked.current = true; setBusy(true); setError('')
    const active = experiment.kind === 'ab14' ? Math.min(clock.read(), experiment.budgetMs) : clock.read()
    const event = learningEvent({ wordId: card.id, kind: phase === 'encoding' ? 'encoding' : phase === 'context' ? 'context' : 'recall', cue: card.image ? 'image' : phase === 'recall' ? 'none' : phase === 'encoding' && arm === 'A' ? 'contrast' : 'sentence', direction: 'en-zh', outcome, assessment: 'self', activeMs: Math.max(0, active - lastAction.current), sessionId: session.current, experimentId: experiment.id })
    const events = finish && phase !== 'encoding' && !revealed ? [] : [event]
    if (phase !== 'encoding' && revealed) events.push(learningEvent({ ...event, kind: 'feedback', cue: 'sentence', outcome: null, activeMs: 0 }))
    const next = { ...experiment, updatedAt: Date.now(), activeMs: { ...experiment.activeMs, [arm]: active }, studyStep: { ...experiment.studyStep, [arm]: nextStep }, completedAt: finish ? { ...experiment.completedAt, [arm]: Date.now() } : experiment.completedAt }
    try { await onSave(next, events); lastSaved.current = active; lastAction.current = active; setStep(nextStep); setRevealed(false) }
    catch { setError('保存未完成，请重试。'); setPaused(true) }
    finally { locked.current = false; setBusy(false) }
  }
  const finishBudget = useEffectEvent(() => { if (!paused && !locked.current) void commit(step, true) })
  useEffect(() => { if (finished) finishBudget() }, [finished, paused, busy])
  const checkpointClock = useEffectEvent(() => {
    if (clock.elapsedMs - lastSaved.current < 5000 || locked.current || finished) return
    lastSaved.current = clock.elapsedMs
    void onSave({ ...experiment, updatedAt: Date.now(), activeMs: { ...experiment.activeMs, [arm]: clock.read() }, studyStep: { ...experiment.studyStep, [arm]: step } }, []).catch(() => { setError('计时保存未完成，请暂停后重试。'); setPaused(true) })
  })
  useEffect(() => { checkpointClock() }, [clock.elapsedMs])
  return <section className="space-y-4" aria-label="实验学习阶段">
    <h2 className="text-xl font-semibold">{arm === 'pilot' ? '图像与准确词义学习' : `${arm}组 · ${arm === 'A' ? '原联想记法' : '语义、语境与提取'}`}</h2>
    <p className="text-sm">前台学习约 {Math.floor(clock.elapsedMs / 1000)} 秒{experiment.budgetMs ? `／每组${experiment.budgetMs / 1000}秒` : ''}。切到后台会暂停计时。</p>
    <button className="min-h-11 underline" onClick={() => setPaused(value => !value)}>{paused ? '继续学习' : '暂停学习'}</button>
    {!paused && !finished && <>
      {phase === 'encoding' ? <>{card.image && <LearningObjectDiagram kind={card.image} />}<SemanticEncoding card={arm === 'A' ? { ...card, correction: undefined, contrast: undefined } : card} />{arm === 'A' && <p className="rounded-lg bg-fuchsia-50 p-4 text-sm">{item.oldHook}</p>}</> : <><p className="text-sm">{phase === 'context' ? '理解本轮单词在新句子中的含义。' : '先不看语境，独立想起中文意思。'}</p><p className="rounded-lg bg-white p-5 text-xl" lang="en">{phase === 'context' ? card.contexts[0]?.text ?? card.example : card.word}</p>{!revealed ? <button className="tap-button w-full bg-stone-950 text-white" onClick={() => setRevealed(true)}>揭晓并核对</button> : <><p>{phase === 'context' ? card.contexts[0]?.translation ?? card.translation : card.meaning}</p><p className="text-xs text-stone-500">本轮为学习期练习，延迟保持成绩在之后的无提示测试中记录。</p></>}</>}
      {phase === 'encoding' && <button disabled={busy} className="tap-button w-full bg-stone-950 text-white" onClick={() => void commit(step + 1, arm === 'pilot' && step + 1 >= items.length)}>已理解，下一词</button>}
      {phase !== 'encoding' && revealed && <div className="grid grid-cols-2 gap-3"><button disabled={busy} className="tap-button bg-emerald-700 text-white" onClick={() => void commit(step + 1, false, 'correct')}>想对了</button><button disabled={busy} className="tap-button bg-rose-700 text-white" onClick={() => void commit(step + 1, false, 'incorrect')}>需要纠正</button></div>}
    </>}
    {error && <p role="alert">{error}</p>}
    <button disabled={busy} className="tap-button w-full bg-white" onClick={onBack}>暂停并返回</button>
  </section>
}
