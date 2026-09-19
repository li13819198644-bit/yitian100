import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, ExternalLink, Search, X } from 'lucide-react'
import { grammarLibrary, searchGrammarLibrary } from '../data/grammarLibrary'

export function GrammarLibrary() {
  const [articleId, setArticleId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const top = useRef<HTMLDivElement>(null)
  const article = grammarLibrary.find((item) => item.id === articleId)
  const results = searchGrammarLibrary(query, category)
  const currentIndex = grammarLibrary.findIndex((item) => item.id === articleId)
  function open(id: string | null) {
    setArticleId(id)
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: 'start' }))
  }

  return <div ref={top} className="space-y-5 scroll-mt-3" aria-label="高级语法资料">
    {article ? <>
      <div className="flex items-center gap-3">
        <button type="button" className="icon-button shrink-0" title="返回资料目录" aria-label="返回资料目录" onClick={() => open(null)}><ArrowLeft size={20} /></button>
        <p className="text-sm text-stone-500">{article.category} · {currentIndex + 1}/{grammarLibrary.length}</p>
      </div>
      <article className="min-w-0 break-words" aria-labelledby="grammar-reading-title">
        <header className="border-b border-stone-200 pb-5">
          <h2 id="grammar-reading-title" className="text-2xl font-bold leading-snug">{article.title}</h2>
          <p className="mt-3 leading-7 text-stone-600">{article.summary}</p>
          <p className="mt-4 border-l-4 border-emerald-600 pl-3 font-medium leading-7">{article.takeaway}</p>
        </header>
        <nav aria-label="本篇目录" className="flex flex-col border-b border-stone-200 py-3">
          {article.sections.map((s, i) => <a key={s.title} className="flex min-h-11 items-center gap-2 py-2 text-sm text-emerald-800 underline-offset-4 hover:underline" href={`#reading-${article.id}-${i}`}><span>{String(i + 1).padStart(2, '0')}</span>{s.title}</a>)}
        </nav>
        {article.sections.map((s, i) => <section key={s.title} id={`reading-${article.id}-${i}`} className="scroll-mt-4 space-y-3 border-b border-stone-200 py-6">
          <h3 className="text-lg font-bold">{s.title}</h3>
          <p className="leading-7">{s.explanation}</p>
          <p className="break-words bg-stone-100 px-3 py-3 text-sm font-semibold leading-6">{s.pattern}</p>
          <blockquote className="space-y-2 border-l-2 border-emerald-600 pl-3">
            <p className="text-lg font-medium leading-8" lang="en">{s.english}</p>
            <p className="leading-7 text-stone-600">{s.chinese}</p>
          </blockquote>
          <p className="text-sm leading-6 text-stone-600">{s.note}</p>
        </section>)}
        <section className="space-y-3 border-b border-stone-200 py-6">
          <h3 className="text-lg font-bold">放在一起比较</h3>
          <p className="border-l-2 border-sky-600 pl-3 leading-7" lang="en">{article.contrast.first}</p>
          <p className="border-l-2 border-emerald-600 pl-3 leading-7" lang="en">{article.contrast.second}</p>
          <p className="leading-7">{article.contrast.explanation}</p>
        </section>
        <aside className="space-y-2 border-b border-stone-200 py-6">
          <h3 className="font-bold text-rose-800">容易误用的地方</h3>
          <p className="leading-7">{article.pitfall}</p>
        </aside>
        <footer className="py-4">
          <a href={article.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-emerald-800 underline underline-offset-4">{article.source.title}<ExternalLink size={15} className="shrink-0" /></a>
        </footer>
      </article>
      <div className="grid grid-cols-2 gap-3 border-t border-stone-200 pt-4">
        <button type="button" disabled={currentIndex === 0} onClick={() => open(grammarLibrary[currentIndex - 1].id)} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 disabled:opacity-30"><ArrowLeft size={18} />上一篇</button>
        <button type="button" disabled={currentIndex === grammarLibrary.length - 1} onClick={() => open(grammarLibrary[currentIndex + 1].id)} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 disabled:opacity-30">下一篇<ArrowRight size={18} /></button>
      </div>
      <button type="button" onClick={() => open(null)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 text-white"><BookOpen size={18} />返回资料目录</button>
    </> : <>
      <header><h2 className="flex items-center gap-2 text-xl font-bold"><BookOpen size={22} />高级语法资料</h2><p className="mt-2 text-sm text-stone-500">{grammarLibrary.length} 篇 · 结构、语义与真实表达</p></header>
      <div className="flex min-h-12 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3">
        <Search size={19} className="shrink-0 text-stone-500" />
        <input aria-label="搜索语法资料" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索倒装、条件句、having…" className="min-h-12 min-w-0 flex-1 bg-transparent outline-none" type="search" />
        {query && <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center" title="清空搜索" aria-label="清空搜索" onClick={() => setQuery('')}><X size={18} /></button>}
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor="grammar-reading-category" className="shrink-0 text-sm text-stone-600">分类</label>
        <select id="grammar-reading-category" className="min-h-11 min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">全部资料</option>{['时间与假设', '长句与结构', '表达与语气'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <p role="status" className="text-sm text-stone-500">{results.length ? `${results.length} 篇资料` : '没有找到相关资料'}</p>
      <div className="divide-y divide-stone-200 border-y border-stone-200">
        {results.map((item) => <button type="button" key={item.id} onClick={() => open(item.id)} className="flex min-h-24 w-full items-center gap-3 py-4 text-left">
          <span className="min-w-0 flex-1"><span className="text-xs text-emerald-700">{item.category}</span><span className="mt-1 block font-semibold leading-6">{item.title}</span><span className="mt-1 block text-sm leading-6 text-stone-500">{item.summary}</span></span><ChevronRight size={20} className="shrink-0 text-stone-400" />
        </button>)}
      </div>
    </>}
  </div>
}
