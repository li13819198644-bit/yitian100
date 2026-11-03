import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { VocabWord, WordProgress } from '../types'
import { semanticCardFor, variedContext } from '../data/semanticCards'
import { independentReady, learningEvent, nextIndependentReview, newId, type LearningEvent, type LearningState } from '../lib/learningProtocol'
import { useActiveClock } from '../lib/useActiveClock'
import { SemanticEncoding } from './SemanticEncoding'
import { localDateKey } from '../lib/studyStats'

export function SemanticLearningPanel({ words, progress, state, minutes, onSave, onBack }: {
  words: VocabWord[]; progress: WordProgress[]; state: LearningState; minutes: number
  onSave: (events: LearningEvent[]) => Promise<void>; onBack: () => void
}) {
  const [started, setStarted] = useState(false), [paused, setPaused] = useState(false)
  const [current, setCurrent] = useState<VocabWord | null>(null)
  const [phase, setPhase] = useState<'encode' | 'recall' | 'answer' | 'feedback' | 'context' | 'context-answer'>('recall')
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const clock = useActiveClock(started && !paused)
  const lastTime = useRef(0), session = useRef(newId()), lock = useRef(false), displayed = useRef<string[]>([])
  const pending = useRef<LearningEvent | null>(null)
  const attempt = useRef<LearningEvent | null>(null)
  const [effort, setEffort] = useState<'easy' | 'thinking' | 'difficult' | undefined>()
  const card = current ? semanticCardFor(current) : null
  const context = card ? variedContext(card, state.events.filter(event => event.wordId === card.id && event.kind === 'context' && event.outcome !== null && !event.experimentId).length) : null
  const exhausted = clock.elapsedMs >= minutes * 60000
  function choose(events = state.events) {
    const byId = new Map(progress.map(item => [item.wordId, item]))
    const eligible = words.filter(word => {
      const p = byId.get(word.id)
      if (p?.excluded || p?.practiceDay === localDateKey(new Date()) && (p.mistakesToday ?? 0) >= 2) return false
      return independentReady(events, word.id) && (!p || p.nextReviewAt <= Date.now() || events.some(event => event.wordId === word.id))
    }).sort((a, b) => Number(!!semanticCardFor(b).problem) - Number(!!semanticCardFor(a).problem) || nextIndependentReview(events, a.id).at - nextIndependentReview(events, b.id).at)
    // Eligibility already enforces elapsed time and intervening-word spacing.
    const next = eligible.find(word => !displayed.current.slice(-3).includes(word.id)) ?? eligible[0]
    setCurrent(next ?? null); setEffort(undefined); pending.current = null; attempt.current = null
    if (next) { displayed.current.push(next.id); setPhase(nextIndependentReview(events, next.id).stage) }
  }
  async function save(kind: LearningEvent['kind'], outcome: LearningEvent['outcome'], cue: LearningEvent['cue'], after: (events: LearningEvent[]) => void) {
    if (!current || lock.current) return
    lock.current = true; setBusy(true); setError('')
    const now = clock.read()
    pending.current ??= kind === 'recall' && attempt.current ? { ...attempt.current, outcome, effort, activeMs: now - lastTime.current, updatedAt: Date.now() } : learningEvent({ wordId: current.id, senseId: kind === 'context' ? context?.senseId : undefined, kind, outcome, cue, direction: 'en-zh', assessment: 'self', effort, activeMs: now - lastTime.current, sessionId: session.current })
    const batch = [pending.current]
    try { await onSave(batch); lastTime.current = now; pending.current = null; after([...state.events, ...batch]) }
    catch { setError('保存未完成，请重试；当前词仍保留。') }
    finally { lock.current = false; setBusy(false) }
  }
  const noteVisibleMeaning = useEffectEvent(() => {
    if (!current || !['encode', 'feedback', 'context-answer'].includes(phase)) return
    const event = learningEvent({ wordId: current.id, kind: phase === 'encode' ? 'encoding' : 'feedback', cue: card?.contrast ? 'contrast' : 'sentence', direction: 'en-zh', outcome: null, assessment: 'self', activeMs: 0, sessionId: session.current })
    void onSave([event]).catch(() => setError('词义查看记录未保存，请重试后继续。'))
  })
  useEffect(() => { noteVisibleMeaning() }, [current?.id, phase])
  async function reveal() {
    if (!current || lock.current) return
    lock.current = true; setBusy(true)
    attempt.current ??= learningEvent({ wordId: current.id, kind: 'recall', cue: 'none', direction: 'en-zh', outcome: null, assessment: 'self', activeMs: 0, sessionId: session.current })
    try {
      await onSave([learningEvent({ wordId: current.id, kind: 'feedback', cue: 'sentence', direction: 'en-zh', outcome: null, assessment: 'self', activeMs: 0, sessionId: session.current, attemptId: attempt.current.id }, Math.max(Date.now(), attempt.current.at + 1))])
      setPhase('answer')
    } catch { setError('保存未完成，请重新揭晓。') }
    finally { lock.current = false; setBusy(false) }
  }
  if (!started) return <section className="space-y-4"><h2 className="text-xl font-semibold">精准学习</h2><p className="leading-7">先学准词义和搭配，再移除提示回忆。不会时直接纠正，隔开其他词再测。今天按 {minutes} 分钟练习，随时可以休息。</p><p className="text-sm text-stone-600">普通学习只需在心中说出中文，不要求英文输入。会指揭晓前已想准；句中理解单独记录。</p><button className="tap-button w-full bg-stone-950 text-white" onClick={() => { setStarted(true); choose() }}>开始练习</button><button className="tap-button w-full bg-white" onClick={onBack}>返回首页</button></section>
  return <section className="space-y-4" aria-label="精准学习">
    <div className="flex items-center justify-between text-sm"><span>已练习 {Math.floor(clock.elapsedMs / 60000)}分{Math.floor(clock.elapsedMs / 1000) % 60}秒</span><button className="min-h-11 underline" onClick={() => setPaused(value => !value)}>{paused ? '继续计时' : '暂停'}</button></div>
    {paused ? <p>已暂停，计时停止。</p> : exhausted ? <p className="rounded-lg bg-emerald-50 p-4">本次练习时间已到。当前记录已保留，之后按实际提取情况继续安排。</p> : !card ? <><p>当前没有适合立即提取的词。刚学过的词需要留出间隔，可以休息后再来。</p><button className="tap-button w-full bg-white" onClick={() => choose()}>检查待复习词</button></> : <>
      {phase === 'recall' && <><p className="text-sm text-stone-600">先在心里说出中文，再揭晓。</p><button disabled={busy} className="min-h-40 w-full rounded-lg bg-white text-4xl font-semibold" onClick={() => void reveal()}>{card.word}</button></>}
      {phase === 'answer' && <><SemanticEncoding card={{ ...card, correction: undefined, contrast: undefined, contexts: [], example: '', translation: '', collocation: '', collocationMeaning: '' }} /><div className="grid grid-cols-2 gap-3"><button disabled={busy} className="tap-button bg-emerald-700 text-white" onClick={() => void save('recall', 'correct', 'none', choose)}>会</button><button disabled={busy} className="tap-button bg-rose-700 text-white" onClick={() => void save('recall', 'incorrect', 'none', () => setPhase('feedback'))}>不会</button></div><details><summary className="min-h-11 py-3 text-sm">回忆感受（可选）</summary>{(['easy', 'thinking', 'difficult'] as const).map((value, i) => <label className="flex min-h-11 items-center gap-2" key={value}><input type="radio" name="recall-effort" checked={effort === value} onChange={() => setEffort(value)} />{['很轻松，几乎立即想到', '需要想几秒钟', '很吃力，靠猜测或联想'][i]}</label>)}</details></>}
      {(phase === 'encode' || phase === 'feedback') && <><p className="text-sm text-stone-600">先把含义学准，辅助记法放在后面。</p><SemanticEncoding card={card} mnemonic={current?.evilHook} /><button disabled={busy} className="tap-button w-full bg-stone-950 text-white" onClick={() => void save(phase === 'encode' ? 'encoding' : 'feedback', null, card.contrast ? 'contrast' : 'sentence', events => card.contexts.length ? setPhase('context') : choose(events))}>已理解，继续</button></>}
      {phase === 'context' && <><p className="text-sm text-stone-600">换一个句子，想一想这个词在句中的含义。</p><p className="rounded-lg bg-white p-5 text-lg leading-8" lang="en">{context!.text}</p><button className="tap-button w-full bg-stone-950 text-white" onClick={() => setPhase('context-answer')}>查看解释</button></>}
      {phase === 'context-answer' && <><p lang="en">{context!.text}</p><p className="text-lg">{context!.translation}</p><div className="grid grid-cols-2 gap-3"><button disabled={busy} className="tap-button bg-emerald-700 text-white" onClick={() => void save('context', 'correct', 'sentence', choose)}>理解正确</button><button disabled={busy} className="tap-button bg-rose-700 text-white" onClick={() => void save('context', 'incorrect', 'sentence', () => setPhase('feedback'))}>需要重学</button></div><p className="text-xs text-stone-500">句中理解不计作无提示独立回忆。</p></>}
    </>}
    {error && <p role="alert">{error}</p>}
    <button disabled={busy} className="tap-button w-full bg-white" onClick={onBack}>结束本次练习</button>
  </section>
}
