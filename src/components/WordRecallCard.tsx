import { useRef, useState } from 'react'
import type { VocabWord } from '../types'

export function WordRecallCard({ word, title, position, total, onRate }: {
  word: VocabWord; title: string; position: number; total: number
  onRate: (rating: 'known' | 'unknown') => boolean | void | Promise<boolean | void>
}) {
  const [revealed, setRevealed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const locked = useRef(false)
  async function rate(rating: 'known' | 'unknown') {
    if (!revealed || locked.current) return
    locked.current = true
    setSaving(true)
    setError('')
    try {
      if (await onRate(rating) !== false) return
    } catch { /* Allow retry without losing the revealed card. */ }
    locked.current = false
    setSaving(false)
    setError('保存失败，请重新点击会 / 不会。')
  }
  return <section className="space-y-4" aria-label="单词回忆">
    <p className="text-sm text-stone-500">{title} · {position} / {total}</p>
    <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <button type="button" className="min-h-40 w-full break-words text-center text-4xl font-semibold" aria-label={`查看 ${word.word} 的答案`} aria-expanded={revealed} disabled={saving} onClick={() => setRevealed(true)}>{word.word}</button>
      {!revealed ? <p className="text-center text-sm text-stone-500">点单词查看答案</p> : <div aria-live="polite">
        <p className="text-center text-sm text-stone-500">{word.phonetic}</p>
        <p className="mt-4 text-center text-2xl font-medium">{word.meaning}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" disabled={saving} className="tap-button bg-emerald-600 text-white" onClick={() => void rate('known')}>会</button>
          <button type="button" disabled={saving} className="tap-button bg-rose-600 text-white" onClick={() => void rate('unknown')}>不会</button>
        </div>
        {saving && <p role="status" className="mt-3 text-sm text-stone-500">正在保存…</p>}
        {error && <p role="alert" className="mt-3 text-rose-800">{error}</p>}
      </div>}
    </div>
  </section>
}
