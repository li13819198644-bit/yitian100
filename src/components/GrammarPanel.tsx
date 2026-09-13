import { useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import { grammarQuestions, grammarTopics } from '../data/grammar'
import type { GrammarProgress } from '../types'
import { chooseGrammarQuestions } from '../lib/grammar'

interface Props {
  progress: GrammarProgress[]
  ready: boolean
  onAnswer: (id: string, correct: boolean) => Promise<void>
}

export function GrammarPanel({ progress, ready, onAnswer }: Props) {
  const [topicId, setTopicId] = useState<string | null>(null)
  const [queue, setQueue] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState(0)
  const [review, setReview] = useState(false)
  const saving = useRef(false)
  const top = useRef<HTMLElement>(null)
  const byId = new Map(progress.map((item) => [item.questionId, item]))
  const topic = grammarTopics.find((item) => item.id === topicId)
  const question = grammarQuestions.find((item) => item.id === queue[index])
  const activeProgress = progress.filter((item) => grammarQuestions.some((q) => q.id === item.questionId))
  const due = activeProgress.filter((item) => item.nextReviewAt <= Date.now()).length
  const firstCorrect = activeProgress.filter((item) => item.firstCorrect).length

  function scrollTop() { top.current?.scrollIntoView({ block: 'start' }) }
  function start(reviewOnly: boolean) {
    const ids = reviewOnly ? grammarQuestions.map((item) => item.id) : topic?.questions.map((item) => item.id) ?? []
    setQueue(chooseGrammarQuestions(ids, progress, reviewOnly))
    setIndex(0); setSelected(null); setScore(0); setSaved(false); setError(''); setReview(reviewOnly)
    scrollTop()
  }
  function leave() {
    setQueue([]); setTopicId(null); setSelected(null); setError(''); scrollTop()
  }
  async function answer(choice: number) {
    if (!question || saving.current || saved) return
    saving.current = true; setBusy(true); setSelected(choice); setError('')
    try {
      await onAnswer(question.id, choice === question.answer)
      setSaved(true)
      if (choice === question.answer) setScore((value) => value + 1)
    } catch {
      setError('进度未保存，请重试。不要关闭页面。')
    } finally { saving.current = false; setBusy(false) }
  }
  function next() {
    if (!saved) return
    setIndex((value) => value + 1); setSelected(null); setSaved(false); scrollTop()
  }
  const command = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-3 font-semibold text-white disabled:opacity-50'

  return <section ref={top} aria-label="语法学习" className="mt-3 space-y-4 scroll-mt-4">
    <div className="flex items-center gap-3">
      {(topic || queue.length > 0) && <button className="icon-button shrink-0" aria-label="返回语法专题" title="返回语法专题" disabled={busy || Boolean(error)} onClick={leave}><ArrowLeft size={20} /></button>}
      <div className="min-w-0"><h2 className="text-xl font-bold">{queue.length ? (review ? '语法复习' : topic?.title) : topic?.title ?? '语法'}</h2><p className="mt-1 text-sm text-stone-500">{queue.length ? `本轮 ${Math.min(index + 1, queue.length)} / ${queue.length} 题` : topic?.subtitle ?? '一次 5 题，慢慢积累'}</p></div>
    </div>

    {queue.length > 0 ? question ? <>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-label="本轮进度" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={index}>
        <div className="h-full bg-emerald-600" style={{ width: `${index / queue.length * 100}%` }} />
      </div>
      {review && <p className="text-sm font-medium text-stone-500">{grammarTopics.find((item) => item.id === question.topicId)?.title}</p>}
      <p className="break-words text-xl font-semibold leading-relaxed" lang="en">{question.sentence}</p>
      <div className="grid gap-2" aria-label="答案选项">
        {question.options.map((option, choice) => {
          const isAnswer = selected !== null && choice === question.answer
          const isWrong = selected === choice && choice !== question.answer
          return <button key={`${question.id}-${choice}`} disabled={selected !== null} aria-pressed={selected === choice} onClick={() => void answer(choice)} className={`flex min-h-[52px] w-full items-center gap-3 rounded-lg border px-4 py-3 text-left ${isAnswer ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : isWrong ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-stone-200 bg-white text-stone-900'}`}>
            <span className="w-5 shrink-0 text-sm font-semibold">{String.fromCharCode(65 + choice)}</span><span className="min-w-0 flex-1 break-words" lang="en">{option}</span>{isAnswer ? <Check size={20} className="shrink-0" /> : isWrong ? <X size={20} className="shrink-0" /> : null}
          </button>
        })}
      </div>
      {selected !== null && <div role="status" className="space-y-3 border-t border-stone-200 pt-4">
        <h3 className={`font-bold ${selected === question.answer ? 'text-emerald-700' : 'text-rose-700'}`}>{selected === question.answer ? '答对了' : `正确答案：${question.options[question.answer]}`}</h3>
        <p className="text-base leading-relaxed">{question.explanation}</p>
        <p className="text-sm leading-relaxed text-stone-500">{question.translation}</p>
        {error ? <><p role="alert" className="text-sm text-rose-700">{error}</p><button className={command} disabled={busy} onClick={() => void answer(selected)}><RotateCcw size={18} />重试保存</button></> : <button className={command} disabled={!saved || busy} onClick={next}>{busy ? '保存中…' : index === queue.length - 1 ? '完成本轮' : selected === question.answer ? '下一题' : '看完解析，继续'}<ChevronRight size={18} /></button>}
      </div>}
    </> : <div className="space-y-5 border-t border-stone-200 py-5">
      <h3 className="text-xl font-bold">本轮完成</h3><p className="text-lg">答对 <strong>{score} / {queue.length}</strong> 题</p><p className="text-sm text-stone-600">{score === queue.length ? '今天先到这里。' : '错题已保存，之后到期再复习。'}</p><button className={command} onClick={leave}><Check size={18} />回到语法专题</button>
    </div> : topic ? <>
      <div className="space-y-4 border-y border-stone-200 py-5"><h3 className="font-bold">核心规则</h3>{topic.rules.map((rule) => <p key={rule} className="text-base leading-relaxed">{rule}</p>)}<p className="border-l-2 border-emerald-600 pl-3 text-sm leading-relaxed text-stone-600">{topic.example}</p></div>
      <button className={command} disabled={!ready} onClick={() => start(false)}>练习 5 题<ChevronRight size={18} /></button>
    </> : <>
      <div className="grid grid-cols-3 border-y border-stone-200 py-4 text-center">
        <div><p className="text-2xl font-bold">{activeProgress.length}<span className="text-sm font-normal text-stone-500"> / 40</span></p><p className="mt-1 text-xs text-stone-500">已练题目</p></div>
        <div><p className="text-2xl font-bold">{activeProgress.length ? `${Math.round(firstCorrect / activeProgress.length * 100)}%` : '—'}</p><p className="mt-1 text-xs text-stone-500">首次作答正确率</p></div>
        <div><p className="text-2xl font-bold">{due}</p><p className="mt-1 text-xs text-stone-500">到期复习</p></div>
      </div>
      {due > 0 && <button className={command} disabled={!ready} onClick={() => start(true)}><RotateCcw size={18} />复习到期题目 · {Math.min(5, due)} 题</button>}
      {!ready && <p role="status" className="text-sm text-stone-500">正在读取学习进度…</p>}
      <div className="divide-y divide-stone-200">
        {grammarTopics.map((item, i) => {
          const practiced = item.questions.filter((q) => byId.has(q.id)).length
          return <button key={item.id} disabled={!ready} onClick={() => { setTopicId(item.id); scrollTop() }} className="flex min-h-20 w-full items-center gap-3 py-4 text-left disabled:opacity-50">
            <span className="w-7 shrink-0 font-semibold text-emerald-700">{String(i + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className="block font-semibold">{item.title}</span><span className="mt-1 block text-sm text-stone-500">{item.subtitle}</span></span><span className="shrink-0 text-xs text-stone-500">{practiced}/5</span><ChevronRight size={18} className="shrink-0 text-stone-400" />
          </button>
        })}
      </div>
    </>}
  </section>
}
