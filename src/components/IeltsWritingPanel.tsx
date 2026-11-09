import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, ChevronRight, Download, FilePenLine, GraduationCap, ListChecks, RotateCcw, ChartColumn, PenLine } from 'lucide-react'
import { categories, issueLabels, questions, rubric, skills, writingPrompts } from '../ielts/data'
import { DAY, gradeWriting, mergeWriting, nextQuestion, skillProgress, wordCount } from '../ielts/engine'
import { emptyWriting, type Attempt, type Question, type WritingState } from '../ielts/types'
import { getWritingState, saveWritingState } from '../lib/db'
import { newId } from '../lib/learningProtocol'
import { localDateKey } from '../lib/studyStats'

type View = 'home' | 'today' | 'grammar' | 'vocabulary' | 'independent' | 'paragraph' | 'task2' | 'review' | 'stats'
const sections = [
  ['today', '今日训练', GraduationCap], ['grammar', '语法专项', BookOpen], ['vocabulary', '词汇搭配', ListChecks],
  ['independent', '独立造句', PenLine], ['paragraph', '段落写作', FilePenLine], ['task2', 'Task 2 写作', FilePenLine],
  ['review', '错题复习', RotateCcw], ['stats', '学习统计', ChartColumn],
] as const
const statusLabel = { pass: '通过本题核对', error: '发现明确问题', unverified: '待人工核对' }
const modeLabel = { recognition: '识别', independent: '独立运用', imitation: '模仿重做' }
function selectQuestion(pool: Question[], state: WritingState, skillId: string) {
  const skill = skills.find(item => item.id === skillId)!
  const level = skillProgress(skill, state.attempts).independentDays >= 2 ? 2 : 1
  return nextQuestion(pool, state, skillId, level)
}

export function IeltsWritingPanel({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<WritingState>(emptyWriting)
  const [ready, setReady] = useState(false), [error, setError] = useState('')
  const [view, setView] = useState<View>('home')
  const [question, setQuestion] = useState<Question>()
  const [round, setRound] = useState(0)
  useEffect(() => { let active = true; void getWritingState().then(value => { if (active) { setState(value); setReady(true) } }).catch(() => { if (active) setError('读取写作记录失败，请退出后重试。原数据未修改。') }); return () => { active = false } }, [])
  async function save(update: WritingState) {
    const saved = await saveWritingState(update)
    setState(previous => mergeWriting(previous, saved))
    return saved
  }
  async function draft(key: string, text: string) {
    try { await save({ ...emptyWriting(), drafts: { [key]: { text, updatedAt: Date.now() } } }); setError('') }
    catch { setError('草稿未保存，请保留页面并重试。'); throw new Error('Draft save failed') }
  }
  function openQuestion(next?: Question) { setQuestion(next); setRound(value => value + 1) }
  const now = Date.now()
  const ranked = skills.filter(skill => skill.id !== 'writing').map(skill => ({ ...skill, ...skillProgress(skill, state.attempts, now) })).sort((a, b) => Number(b.due) - Number(a.due) || b.priority - a.priority)
  const pool = questions.filter(item => view === 'independent' ? item.mode === 'independent' : view === 'grammar' || view === 'vocabulary' ? skills.find(skill => skill.id === item.skillId)?.category === view : true)
  const today = localDateKey()
  function exportRecords() {
    const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString(), initialProfile: skills }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = url; link.download = `yitian100-ielts-writing-${today}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const title = question ? '训练与反馈' : sections.find(([id]) => id === view)?.[1] ?? 'IELTS Writing 7.0'
  return <section className="space-y-5" aria-label="IELTS Writing 7.0">
    <header className="flex items-center gap-3"><button className="icon-button shrink-0" title="返回" aria-label="返回写作上一级" onClick={() => question ? setQuestion(undefined) : view !== 'home' ? setView('home') : onBack()}><ArrowLeft size={20} /></button><div className="min-w-0"><h2 className="break-words text-xl font-semibold">{title}</h2>{view !== 'home' && <p className="text-xs text-stone-500">IELTS Writing 7.0</p>}</div></header>
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    {!ready ? <p>正在读取写作记录…</p> : question ? <WritingExercise key={`${question.id}-${round}`} question={question} state={state} save={save} saveDraft={draft} onNext={saved => {
      const next = selectQuestion(questions.filter(item => item.mode === 'independent' && item.id !== question.id), saved, question.skillId)
      openQuestion(next)
    }} /> : <>
      {view === 'home' && <>
        <div className="border-y border-stone-200 py-4"><p className="text-sm text-stone-500">Academic Writing · 目标 Band 7</p><p className="mt-2 text-lg">今日提交 {state.attempts.filter(item => localDateKey(new Date(item.at)) === today).length} 次 · 到期重点 {ranked.filter(item => item.due && item.errors > 0).length} 项</p></div>
        <div className="grid grid-cols-2 gap-3">{sections.map(([id, label, Icon]) => <button key={id} className="flex min-h-20 items-center gap-3 rounded-lg bg-white p-3 text-left ring-1 ring-stone-200" onClick={() => setView(id)}><Icon size={22} className="shrink-0 text-emerald-700" /><span className="min-w-0 break-words font-medium">{label}</span></button>)}</div>
        <details><summary className="min-h-12 py-3 font-semibold">初始弱点档案</summary><p className="mb-3 text-sm text-stone-500">来自你提供的训练经历，尚未计入本模块成绩。</p><ul className="divide-y divide-stone-200">{skills.map(skill => <li key={skill.id} className="py-3"><p className="font-medium">{skill.title} · {skill.priority === 3 ? '高优先级' : skill.priority === 2 ? '中优先级' : '巩固'}</p><p className="text-sm text-stone-600">{skill.initial}</p></li>)}</ul></details>
        <p className="text-sm text-stone-500">写作记录保存在此设备，暂未加入云同步。</p>
        <button className="tap-button flex w-full items-center justify-center gap-2 bg-white" onClick={exportRecords}><Download size={18} />导出写作记录</button>
      </>}
      {(['today', 'grammar', 'vocabulary', 'independent'] as View[]).includes(view) && <ul className="divide-y divide-stone-200">{ranked.filter(skill => view !== 'grammar' && view !== 'vocabulary' || skill.category === view).map(skill => <li key={skill.id} className="py-4">
        <button className="flex min-h-14 w-full items-center justify-between gap-3 text-left" onClick={() => openQuestion(selectQuestion(pool, state, skill.id))}><span><strong>{skill.title}</strong><span className="mt-1 block text-sm text-stone-500">{skill.errors ? `记录到 ${skill.errors} 次问题 · ` : ''}{skill.due ? '可训练' : `下次 ${new Date(skill.nextReviewAt).toLocaleDateString('zh-CN')}`} · {skill.stage}</span></span><ChevronRight size={20} className="shrink-0" /></button>
        <details><summary className="min-h-11 py-2 text-sm text-emerald-800">知识点</summary><p className="text-sm leading-7">{skill.explanation}</p></details>
      </li>)}</ul>}
      {view === 'review' && <>
        {!state.attempts.some(item => item.feedback.status !== 'pass') && <p className="py-8 text-center text-stone-500">还没有错题或待核对的答案。</p>}
        {ranked.filter(skill => state.attempts.some(item => item.skillId === skill.id && item.feedback.status !== 'pass')).map(skill => <section key={skill.id} className="border-b border-stone-200 pb-4">
          <h3 className="font-semibold">{skill.title}</h3><p className="my-2 text-sm text-stone-500">{skill.due ? '已到复习时间' : `下次复习：${new Date(skill.nextReviewAt).toLocaleString('zh-CN')}`} · {skill.independentDays} 个跨天新题通过</p>
          <button className="tap-button w-full bg-stone-950 text-white" onClick={() => openQuestion(selectQuestion(questions.filter(item => item.mode === 'independent'), state, skill.id))}>换题复测</button>
          <details className="mt-2"><summary className="min-h-11 py-2">历史原句与反馈</summary>{state.attempts.filter(item => item.skillId === skill.id && item.feedback.status !== 'pass').slice().reverse().map(item => <div key={item.id} className="space-y-2 border-t border-stone-200 py-3"><p className="text-xs text-stone-500">{new Date(item.at).toLocaleString('zh-CN')} · {modeLabel[item.mode]} · {statusLabel[item.feedback.status]}</p><p className="break-words" lang="en">{item.original}</p>{item.feedback.issues.map((issue, index) => <p key={index} className="text-sm text-rose-700">{issueLabels[issue.type]}：{issue.message}</p>)}<p className="break-words text-sm" lang="en">参考：{item.reference}</p><p className="text-sm">{item.suggestion}</p></div>)}</details>
        </section>)}
      </>}
      {(view === 'paragraph' || view === 'task2') && <WritingDraft key={view} mode={view} value={state.drafts[view]?.text ?? ''} onChange={text => draft(view, text)} />}
      {view === 'stats' && <WritingStats state={state} now={now} onExport={exportRecords} />}
    </>}
  </section>
}

function WritingExercise({ question, state, save, saveDraft, onNext }: { question: Question; state: WritingState; save: (update: WritingState) => Promise<WritingState>; saveDraft: (key: string, text: string) => Promise<void>; onNext: (state: WritingState) => void }) {
  const [answer, setAnswer] = useState(state.drafts[question.id]?.text ?? '')
  const [result, setResult] = useState<Attempt>(), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const lock = useRef(false), pending = useRef<Attempt | null>(null)
  const repeated = state.attempts.some(item => item.questionId === question.id)
  async function submit() {
    if (lock.current || !answer.trim()) return
    lock.current = true; setBusy(true); setError('')
    try {
      pending.current ??= { id: newId(), questionId: question.id, skillId: question.skillId, at: Date.now(), original: answer, mode: question.mode === 'recognition' ? 'recognition' : repeated || result ? 'imitation' : 'independent', feedback: gradeWriting(question, answer), reference: question.answer, suggestion: question.explanation }
      await save({ ...emptyWriting(), attempts: [pending.current] })
      setResult(pending.current); pending.current = null
    } catch { setError('提交未保存，请重试。') }
    finally { lock.current = false; setBusy(false) }
  }
  function edit(text: string) { setAnswer(text); pending.current = null; void saveDraft(question.id, text).catch(() => {}) }
  return <div className="space-y-4">
    <p className="text-sm text-stone-500">{skills.find(item => item.id === question.skillId)?.title} · {result ? modeLabel[result.mode] : question.mode === 'recognition' ? '识别训练' : repeated ? '已见题 · 模仿练习' : '新题 · 独立造句'}</p>
    <p className="whitespace-pre-wrap break-words text-lg leading-8">{question.prompt}</p>
    {question.options ? <fieldset className="space-y-3" disabled={busy || !!result}><legend className="sr-only">选择答案</legend>{question.options.map(option => <label key={option} className={`flex min-h-14 items-center gap-3 rounded-lg border p-3 ${answer === option ? 'border-emerald-700 bg-emerald-50' : 'border-stone-200 bg-white'}`}><input type="radio" name={question.id} checked={answer === option} onChange={() => edit(option)} /><span className="min-w-0 break-words" lang="en">{option}</span></label>)}</fieldset> : <textarea className="min-h-40 w-full rounded-lg border border-stone-300 bg-white p-4 text-base" aria-label="你的英文句子" value={answer} disabled={busy} onChange={event => edit(event.target.value)} autoCorrect="off" spellCheck={false} />}
    {!result && <button disabled={busy || !answer.trim()} onClick={() => void submit()} className="tap-button w-full bg-stone-950 text-white disabled:opacity-50">{busy ? '保存中…' : '提交并核对'}</button>}
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    {result && <div className="space-y-4 border-t border-stone-200 pt-4">
      <h3 className="font-semibold">{statusLabel[result.feedback.status]} · {modeLabel[result.mode]}</h3>
      {result.feedback.status === 'unverified' && <p className="text-sm text-amber-800">未匹配到已核验答案，也未发现本题预设的明确错误。可能是合理改写；本次不计为正确或错误。</p>}
      {question.mode === 'independent' && <p className="text-sm text-stone-500">本地规则核对，不是全面语言批改或 IELTS 评分。</p>}
      {result.feedback.issues.map((issue, index) => <p key={index} className="text-sm text-rose-700">{issueLabels[issue.type]}：{issue.message}</p>)}
      <div><p className="text-sm text-stone-500">参考表达</p><p className="mt-1 break-words leading-7" lang="en">{question.answer}</p></div>
      <p className="text-sm leading-7">{question.explanation}</p>
      <details><summary className="min-h-11 py-2">逐项核对</summary><ul className="space-y-3">{question.checks.map((check, index) => <li key={index} className="text-sm"><strong>{issueLabels[check.type]}</strong>：{check.label}</li>)}</ul></details>
      {question.mode === 'independent' && <button disabled={busy || answer === result.original || !answer.trim()} className="tap-button w-full bg-white disabled:opacity-50" onClick={() => void submit()}>保存修改并重新核对</button>}
      <button disabled={busy} className="tap-button w-full bg-emerald-700 text-white" onClick={() => onNext(state)}>下一道同知识点造句</button>
    </div>}
  </div>
}

function WritingDraft({ mode, value, onChange }: { mode: 'paragraph' | 'task2'; value: string; onChange: (text: string) => Promise<void> }) {
  const [text, setText] = useState(value), [saved, setSaved] = useState(true)
  const serial = useRef(0)
  return <div className="space-y-4">
    <p className="leading-7">{writingPrompts[mode]}</p>
    <p className="text-sm text-amber-800">阶段一：草稿与自检。自动作文评分和计时考试尚未启用。</p>
    <textarea aria-label="写作草稿" className="min-h-72 w-full rounded-lg border border-stone-300 bg-white p-4 text-base leading-7" value={text} onChange={event => { const next = event.target.value, revision = ++serial.current; setText(next); setSaved(false); void onChange(next).then(() => { if (revision === serial.current) setSaved(true) }).catch(() => {}) }} />
    <p className="flex justify-between text-sm"><span>{wordCount(text)} 词 · {mode === 'paragraph' ? '目标 60–100' : '至少 250'}</span><span>{saved ? '已保存到本机' : '保存中…'}</span></p>
    <details open><summary className="min-h-11 py-2 font-semibold">论证检查</summary><ol className="list-decimal space-y-2 pl-5 text-sm">{['观点：这一段要证明什么？', '原因：为什么会发生？', '机制：具体通过哪个过程产生影响？', '例子：哪个情境能体现这个机制？', '结果：如何回到题目和你的立场？'].map(text => <li key={text}>{text}</li>)}</ol></details>
    <h3 className="font-semibold">官方四项标准 · 自检</h3>
    <dl className="space-y-4">{rubric.map(([title, description]) => <div key={title}><dt className="font-medium">{title}</dt><dd className="mt-1 text-sm leading-6">{description}</dd></div>)}</dl>
    <a className="inline-flex min-h-11 items-center text-sm text-emerald-800 underline" href="https://ielts.org/cdn/Guides/ielts-writing-band-descriptors.pdf" target="_blank" rel="noreferrer">IELTS 官方 Writing Band Descriptors</a>
  </div>
}

function WritingStats({ state, now, onExport }: { state: WritingState; now: number; onExport: () => void }) {
  const verified = state.attempts.filter(item => item.feedback.status !== 'unverified')
  const first = new Map<string, Attempt>()
  state.attempts.forEach(item => { const key = `${localDateKey(new Date(item.at))}:${item.questionId}`; if (!first.has(key)) first.set(key, item) })
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-4 border-y border-stone-200 py-4"><p>提交记录 <strong>{state.attempts.length}</strong></p><p>待核对 <strong>{state.attempts.length - verified.length}</strong></p></div>
    <h3 className="font-semibold">按能力分类</h3>
    <ul className="divide-y divide-stone-200">{Object.entries(categories).map(([id, title]) => { const records = state.attempts.filter(item => skills.find(skill => skill.id === item.skillId)?.category === id); return <li key={id} className="flex justify-between py-3"><span>{title}</span><span className="text-sm">{records.length} 次 · 明确问题 {records.filter(item => item.feedback.status === 'error').length} 次</span></li> })}</ul>
    <h3 className="font-semibold">证据类型</h3>
    {Object.entries(modeLabel).map(([mode, label]) => { const records = state.attempts.filter(item => item.mode === mode && item.feedback.status !== 'unverified'); return <p key={mode} className="text-sm">{label}：核对通过 {records.filter(item => item.feedback.status === 'pass').length}/{records.length}</p> })}
    <h3 className="font-semibold">最近 7 天 · 每题当天首答</h3>
    <ul className="divide-y divide-stone-200">{Array.from({ length: 7 }, (_, i) => { const date = localDateKey(new Date(now - (6 - i) * DAY)), records = [...first.values()].filter(item => localDateKey(new Date(item.at)) === date); return <li key={date} className="flex justify-between gap-2 py-3 text-sm"><span>{date}</span><span>{records.length ? `${records.length} 题 · 问题 ${records.filter(item => item.feedback.status === 'error').length} · 待核对 ${records.filter(item => item.feedback.status === 'unverified').length}` : '无记录'}</span></li> })}</ul>
    <p className="text-sm text-stone-500">这里只统计已记录的训练，不推算 IELTS 分数。草稿不计作已批改作文。</p>
    <button className="tap-button flex w-full items-center justify-center gap-2 bg-white" onClick={onExport}><Download size={18} />导出写作记录</button>
  </div>
}
