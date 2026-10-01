import { useCallback, useEffect, useRef, useState } from 'react'
import { Headphones, SkipBack, SkipForward } from 'lucide-react'
import type { VocabWord } from '../types'
import { cachedAudio, spellingParts, spellingRates, trackAt, trackStarts, type SpellingManifest } from '../lib/listening'

export function ListeningPlayer({ words, due, weak, learned, visible }: { words: VocabWord[]; due: VocabWord[]; weak: VocabWord[]; learned: VocabWord[]; visible: boolean }) {
  const audio = useRef<HTMLAudioElement>(null)
  const controller = useRef<AbortController | undefined>(undefined)
  const blobUrl = useRef('')
  const [source, setSource] = useState('due')
  const [batch, setBatch] = useState(0)
  const [queue, setQueue] = useState<VocabWord[]>([])
  const [starts, setStarts] = useState<number[]>([])
  const [time, setTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [rate, setRate] = useState(() => {
    try { const stored = localStorage.getItem('yitian:spelling-rate'); return stored && spellingRates.includes(stored) ? stored : '1.0' } catch { return '1.0' }
  })
  const [loop, setLoop] = useState(false)
  const [saved, setSaved] = useState<{ ids: string[]; time: number; spellingRate?: string; version?: number } | null>(() => {
    try {
      const value = JSON.parse(localStorage.getItem('yitian:listening') ?? 'null')
      return value && Array.isArray(value.ids) && value.ids.every((id: unknown) => typeof id === 'string') && Number.isFinite(value.time) && value.time >= 0 ? value : null
    } catch { return null }
  })
  const pools: Record<string, VocabWord[]> = { due, weak, learned, all: words }
  const pool = pools[source]
  const selected = pool.slice(batch * 20, batch * 20 + 20)
  const currentIndex = trackAt(starts, time)
  const current = queue[currentIndex]
  const seek = useCallback((index: number) => {
    if (!audio.current || !starts.length) return
    const target = starts[Math.max(0, Math.min(starts.length - 1, index))]
    audio.current.currentTime = target
    setTime(target)
  }, [starts])
  useEffect(() => {
    const pause = () => audio.current?.pause()
    window.addEventListener('yitian:other-audio', pause)
    return () => { window.removeEventListener('yitian:other-audio', pause); controller.current?.abort(); URL.revokeObjectURL(blobUrl.current) }
  }, [])
  useEffect(() => {
    if (!ready || !('mediaSession' in navigator)) return
    const session = navigator.mediaSession
    if (typeof MediaMetadata !== 'undefined') session.metadata = new MediaMetadata({ title: current?.word ?? '听词复习', artist: '一天100词', album: '读音 · 拼写 · 中文' })
    const actions: Array<[MediaSessionAction, () => void]> = [
      ['play', () => { void audio.current?.play().catch(() => setError('请返回播放器点击播放。')) }],
      ['pause', () => audio.current?.pause()],
      ['previoustrack', () => seek(trackAt(starts, audio.current?.currentTime ?? 0) - 1)],
      ['nexttrack', () => seek(trackAt(starts, audio.current?.currentTime ?? 0) + 1)],
    ]
    actions.forEach(([action, handler]) => { try { session.setActionHandler(action, handler) } catch { /* Older Safari may not support every action. */ } })
    return () => actions.forEach(([action]) => { try { session.setActionHandler(action, null) } catch { /* Optional API. */ } })
  }, [ready, current?.word, starts, seek])
  const prepare = async (items: VocabWord[], resumeAt = 0, speed = rate, resumeWord?: number, keepPlaying = false) => {
    if (!items.length) return
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    audio.current?.pause()
    setRate(speed)
    try { localStorage.setItem('yitian:spelling-rate', speed) } catch { /* Optional preference storage. */ }
    setReady(false); setQueue([]); setLoading(true); setLoaded(0); setError('')
    try {
      const base = new URL(`${import.meta.env.BASE_URL}listening/`, document.baseURI)
      const response = await fetch(new URL('segments.json', base), { signal: abort.signal })
      if (!response.ok) throw new Error('无法读取音频词库，请联网后重试。')
      const manifest: SpellingManifest = await response.json()
      const available = items.filter(word => manifest.words[word.id])
      if (!available.length) throw new Error('这组词暂时没有音频；自定义导入词尚不支持。')
      const blobs: Blob[] = []
      const durations: number[] = []
      const fetched = new Map<string, Promise<Blob>>()
      for (const word of available) {
        const parts = spellingParts(manifest, word.id, speed)
        blobs.push(...await Promise.all(parts.map(part => {
          if (!fetched.has(part.file)) fetched.set(part.file, cachedAudio(new URL(part.file, base).href, abort.signal))
          return fetched.get(part.file)!
        })))
        durations.push(parts.reduce((sum, part) => sum + part.duration, 0))
        setLoaded(durations.length)
      }
      if (abort.signal.aborted) return
      const url = URL.createObjectURL(new Blob(blobs, { type: 'audio/mpeg' }))
      URL.revokeObjectURL(blobUrl.current)
      blobUrl.current = url
      const nextStarts = trackStarts(durations)
      const nextTime = resumeWord === undefined ? resumeAt : nextStarts[Math.min(resumeWord, nextStarts.length - 1)]
      setQueue(available); setStarts(nextStarts)
      setTime(nextTime)
      const element = audio.current!
      element.src = url
      element.onloadedmetadata = () => {
        element.currentTime = Math.min(nextTime, Math.max(0, element.duration - 0.1))
        element.playbackRate = 1
        if (keepPlaying) void element.play().catch(() => setError('拼写速度已更新，请点击播放继续。'))
      }
      element.load()
      setReady(true)
      if (available.length < items.length) setError(`已跳过 ${items.length - available.length} 个暂无音频的自定义词。`)
    } catch (error) {
      if (!abort.signal.aborted) setError(error instanceof Error ? error.message : '音频准备失败，请重试。')
    } finally { if (!abort.signal.aborted) setLoading(false) }
  }
  return <section hidden={!visible} className="space-y-4">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Headphones size={22} />听词复习</h2>
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">词单<select aria-label="听词词单" className="min-h-11 rounded border border-stone-300 bg-white px-2" disabled={loading} value={source} onChange={event => { setSource(event.target.value); setBatch(0) }}>
        <option value="due">到期复习（{due.length}）</option><option value="weak">弱词（{weak.length}）</option><option value="learned">已学单词（{learned.length}）</option><option value="all">全部单词（{words.length}）</option>
      </select></label>
      <label className="flex items-center gap-2 text-sm">分组<select aria-label="听词分组" className="min-h-11 rounded border border-stone-300 bg-white px-2" disabled={loading || !pool.length} value={batch} onChange={event => setBatch(Number(event.target.value))}>
        {Array.from({length: Math.max(1, Math.ceil(pool.length / 20))}, (_, index) => <option key={index} value={index}>第 {index + 1} 组</option>)}
      </select></label>
    </div>
    <button className="tap-button w-full bg-stone-950 text-white" disabled={loading || !selected.length} onClick={() => void prepare(selected)}>{loading ? `准备音频 ${loaded}/${selected.length}` : `载入这组 ${selected.length} 个词`}</button>
    {!pool.length && <p className="text-sm text-stone-600">这个词单目前为空。</p>}
    {saved && !ready && !loading && <button className="tap-button w-full bg-white ring-1 ring-stone-300" onClick={() => void prepare(saved.ids.map(id => words.find(word => word.id === id)).filter((word): word is VocabWord => Boolean(word)), saved.version === 2 ? saved.time : 0, saved.spellingRate && spellingRates.includes(saved.spellingRate) ? saved.spellingRate : rate)}>继续上次听词</button>}
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <div className="border-y border-stone-200 py-5">
      <p className="text-sm text-stone-500">{ready ? `${currentIndex + 1} / ${queue.length}` : '尚未载入音频'}</p>
      <h3 className="mt-3 break-words text-3xl font-semibold">{current?.word ?? '听词播放器'}</h3>
      {current && <><p className="mt-2 text-stone-500">{current.phonetic}</p><p className="mt-3 break-words font-mono text-lg">{current.word.toUpperCase().split('').join(' · ')}</p><p className="mt-3 text-lg">{current.meaning}</p></>}
      <audio ref={audio} controls={ready} controlsList="noplaybackrate" onRateChange={event => { if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1 }} preload="auto" loop={loop} className="mt-5 w-full" onPlay={() => { window.speechSynthesis?.cancel(); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing' }} onPause={() => { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused' }} onError={() => { if (ready) setError('音频无法播放，请重新载入这组词。') }} onTimeUpdate={() => {
        const next = audio.current?.currentTime ?? 0
        setTime(next)
        if (!ready || loading || !queue.length) return
        const record = { ids: queue.map(word => word.id), time: next, spellingRate: rate, version: 2 }
        try { localStorage.setItem('yitian:listening', JSON.stringify(record)) } catch { /* Optional resume storage. */ }
        setSaved(record)
      }} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <button title="上一词" aria-label="上一词" disabled={!ready || currentIndex === 0} className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100" onClick={() => seek(currentIndex - 1)}><SkipBack /></button>
        <label className="text-sm">拼写速度 <select aria-label="拼写速度" disabled={loading} className="min-h-11 rounded bg-white px-2" value={rate} onChange={event => {
          const next = event.target.value
          setRate(next)
          try { localStorage.setItem('yitian:spelling-rate', next) } catch { /* Optional preference storage. */ }
          if (ready) void prepare(queue, 0, next, currentIndex, !audio.current?.paused)
        }}>{spellingRates.map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
        <button title="下一词" aria-label="下一词" disabled={!ready || currentIndex >= queue.length - 1} className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100" onClick={() => seek(currentIndex + 1)}><SkipForward /></button>
      </div>
      <label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={loop} onChange={event => setLoop(event.target.checked)} />整组循环</label>
    </div>
  </section>
}
