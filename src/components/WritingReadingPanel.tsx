import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Bookmark, Check, List, WifiOff } from 'lucide-react'
import { readingLessons } from '../ielts/reading'
import type { WritingState } from '../ielts/types'

export function WritingReadingPanel({ drafts, onSave }: { drafts: WritingState['drafts']; onSave: (key: string, text: string) => Promise<void> }) {
  const [index, setIndex] = useState<number | null>(null)
  const [cached, setCached] = useState(false)
  const [busy, setBusy] = useState(false)
  const [large, setLarge] = useState(false)
  const last = readingLessons.findIndex(item => item.id === drafts['reading:last']?.text)
  const read = readingLessons.filter(item => drafts[`reading:done:${item.id}`]?.text === 'done').length
  useEffect(() => {
    let active = true
    async function check() {
      try {
        if (!('caches' in window) || !('serviceWorker' in navigator)) return
        const registration = await navigator.serviceWorker.getRegistration()
        const assets = [new URL('index.html', document.baseURI).href, ...Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]')).map(item => item.src), ...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(item => item.href)]
        const available = !!registration?.active && (await Promise.all(assets.map(url => caches.match(url, { ignoreSearch: true })))).every(Boolean)
        if (active) setCached(available)
      } catch { if (active) setCached(false) }
    }
    void check()
    const timer = window.setInterval(() => void check(), 3000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])
  function open(next: number) {
    setIndex(next)
    void onSave('reading:last', readingLessons[next].id).catch(() => {})
    window.scrollTo({ top: 0 })
  }
  const lesson = index === null ? null : readingLessons[index]
  return <div className="space-y-5">
    {!lesson ? <>
      <div className="border-y border-stone-200 py-4"><h3 className="text-lg font-semibold">飞机阅读包 · 12 章</h3><p className="mt-2 text-sm text-stone-500">已读 {read}/{readingLessons.length} · 阅读不计作训练通过</p><p role="status" className={`mt-2 flex items-center gap-2 text-sm ${cached ? 'text-emerald-800' : 'text-amber-800'}`}><WifiOff size={16} />{cached ? '本版文字资料已缓存，可离线阅读' : '离线缓存尚未确认，请保持联网'}</p></div>
      {last >= 0 && <button className="tap-button flex w-full items-center justify-center gap-2 bg-emerald-700 text-white" onClick={() => open(last)}><Bookmark size={18} />继续阅读第 {last + 1} 章</button>}
      <ul className="divide-y divide-stone-200">{readingLessons.map((item, i) => <li key={item.id}><button className="flex min-h-20 w-full items-center gap-3 py-4 text-left" onClick={() => open(i)}><span className="min-w-0 flex-1"><strong className="block break-words">{item.title}</strong><span className="mt-1 block text-sm text-stone-500">{item.focus}</span></span>{drafts[`reading:done:${item.id}`]?.text === 'done' ? <Check className="shrink-0 text-emerald-700" size={20} aria-label="已读" /> : <ArrowRight className="shrink-0 text-stone-400" size={20} />}</button></li>)}</ul>
    </> : <>
      <div className="flex items-center justify-between border-b border-stone-200 pb-3"><button className="icon-button" aria-label="阅读目录" title="阅读目录" onClick={() => setIndex(null)}><List size={20} /></button><span className="text-sm text-stone-500">{index! + 1} / {readingLessons.length}</span><button className="icon-button font-semibold" aria-label="大字阅读" title="大字阅读" aria-pressed={large} onClick={() => setLarge(value => !value)}>Aa</button></div>
      <article className={`space-y-7 ${large ? 'text-xl leading-9' : 'text-base leading-8'}`}>
        <header><h3 className="text-2xl font-semibold leading-9">{lesson.title}</h3><p className="mt-2 text-sm text-stone-500">{lesson.focus}</p></header>
        {lesson.sections.map(section => <section key={section.title} className="space-y-3"><h4 className="text-lg font-semibold">{section.title}</h4>{section.body.map((paragraph, i) => <p key={i} className="break-words" lang={/^[A-Za-z]/.test(paragraph) && !/[\u4e00-\u9fff]/.test(paragraph) ? 'en' : 'zh-CN'}>{paragraph}</p>)}</section>)}
        {lesson.examples.length > 0 && <section className="space-y-5"><h4 className="text-lg font-semibold">例句拆解</h4>{lesson.examples.map(example => <div key={example.en} className="space-y-2 border-l-2 border-emerald-700 pl-4"><p className="break-words font-medium" lang="en">{example.en}</p><p>{example.zh}</p><p className="text-sm leading-7 text-stone-600">{example.note}</p></div>)}</section>}
        <section className="border-y border-stone-200 py-4"><h4 className="text-lg font-semibold">这一章带走一句话</h4><p className="mt-2">{lesson.takeaway}</p></section>
        {lesson.source && <a className="inline-flex min-h-11 items-center text-sm text-emerald-800 underline" href={lesson.source.url} target="_blank" rel="noreferrer">参考来源（需联网）：{lesson.source.title}</a>}
      </article>
      <button disabled={busy} className="tap-button flex w-full items-center justify-center gap-2 bg-emerald-700 text-white disabled:opacity-50" onClick={async () => { setBusy(true); try { await onSave(`reading:done:${lesson.id}`, 'done'); if (index! < readingLessons.length - 1) open(index! + 1); else setIndex(null) } catch { /* Parent displays storage failure. */ } finally { setBusy(false) } }}><Check size={18} />{busy ? '保存中…' : index === readingLessons.length - 1 ? '标为已读，返回目录' : '标为已读，继续下一章'}</button>
      <div className="flex items-center justify-between"><button className="icon-button disabled:opacity-30" disabled={index === 0} title="上一章" aria-label="上一章" onClick={() => open(index! - 1)}><ArrowLeft size={20} /></button><button className="icon-button disabled:opacity-30" disabled={index === readingLessons.length - 1} title="下一章" aria-label="下一章" onClick={() => open(index! + 1)}><ArrowRight size={20} /></button></div>
    </>}
  </div>
}
