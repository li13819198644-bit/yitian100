import { useRef, useState } from 'react'
import { transferContexts, variedContext, type SemanticCard } from '../data/semanticCards'
import { learningEvent, newId, type LearningEvent } from '../lib/learningProtocol'
import { useActiveClock } from '../lib/useActiveClock'

export function UsagePractice({ cards, events, onSave, onBack, experimentId, checkpoint }: { cards: SemanticCard[]; events: LearningEvent[]; onSave: (events: LearningEvent[]) => Promise<void>; onBack: () => void; experimentId?: string; checkpoint?: LearningEvent['checkpoint'] }) {
  const [index, setIndex] = useState(0), [revealed, setRevealed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const session = useRef(newId()), last = useRef(0), locked = useRef(false)
  const clock = useActiveClock(!busy)
  const card = experimentId ? cards[index] : cards[index % cards.length]
  if (!card) return <section><p>{experimentId ? '本轮表达自评已完成。' : '当前没有可练习的用法，参与对照的词先留到检查点。'}</p><button className="tap-button w-full bg-white" onClick={onBack}>返回</button></section>
  const context = experimentId ? transferContexts[card.id] : variedContext(card, events.filter(event => event.wordId === card.id && event.kind === 'usage').length)
  async function reveal() {
    if (locked.current) return
    locked.current = true; setBusy(true)
    try { await onSave([learningEvent({ wordId: card.id, kind: 'feedback', cue: 'sentence', direction: 'zh-en', outcome: null, assessment: 'self', activeMs: 0, sessionId: session.current, experimentId, checkpoint })]); setRevealed(true) }
    catch { setError('参考查看记录未保存，请重试。') }
    finally { locked.current = false; setBusy(false) }
  }
  async function answer(correct: boolean) {
    if (locked.current) return
    locked.current = true; setBusy(true); setError('')
    try {
      await onSave([learningEvent({ wordId: card.id, kind: 'usage', cue: 'sentence', direction: 'zh-en', outcome: correct ? 'correct' : 'incorrect', assessment: 'self', activeMs: clock.read() - last.current, sessionId: session.current, experimentId, checkpoint })])
      last.current = clock.read(); setIndex(value => value + 1); setRevealed(false)
    } catch { setError('保存未完成，请重试。') }
    finally { locked.current = false; setBusy(false) }
  }
  return <section className="space-y-4" aria-label="新语境表达练习"><h2 className="text-xl font-semibold">新语境表达 · 口头自评</h2><p className="text-sm">{experimentId ? '先尝试用本轮学过的目标词在心里表达这句话，再核对目标词和用法；不要求输入英文。' : '先在心里用英语表达这句话，再看参考。不要求输入英文，其他正确表达也可以。'}</p><p className="rounded-lg bg-white p-5 text-xl">{context.translation}</p>{!revealed ? <button disabled={busy} className="tap-button w-full bg-stone-950 text-white" onClick={() => void reveal()}>查看参考表达</button> : <><p lang="en" className="text-lg">{context.text}</p><p>{card.word}：{card.meaning}</p><div className="grid grid-cols-2 gap-3"><button disabled={busy} className="tap-button bg-emerald-700 text-white" onClick={() => void answer(true)}>{experimentId ? '目标词使用正确' : '表达含义正确'}</button><button disabled={busy} className="tap-button bg-rose-700 text-white" onClick={() => void answer(false)}>需要重学</button></div><p className="text-xs text-stone-500">此处记录表达自评，程序没有核验你的口头语法，不计入无提示词义保持率。</p></>}{error && <p role="alert">{error}</p>}<button disabled={busy} className="tap-button w-full bg-white" onClick={onBack}>返回实验入口</button></section>
}
