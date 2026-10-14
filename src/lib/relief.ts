import type { AppStats, VocabWord, WordProgress } from '../types'
import { localDateKey } from './studyStats'
import { isWeak, isLeech } from './srs'

export const RELIEF_TARGET = 15

export function extraReviewWords(words: VocabWord[], progress: WordProgress[], weakOnly = false, now = Date.now()) {
  const byId = new Map(progress.map(p => [p.wordId, p]))
  return words.filter(w => {
    const p = byId.get(w.id)
    return p && p.seen > 0 && !p.excluded && (!weakOnly || isWeak(p))
  }).sort((a, b) => {
    const left = byId.get(a.id)!, right = byId.get(b.id)!
    return Number(right.nextReviewAt <= now) - Number(left.nextReviewAt <= now)
      || (left.lastStudiedAt ?? left.updatedAt) - (right.lastStudiedAt ?? right.updatedAt)
  }).slice(0, 10)
}

export function reliefPlan(words: VocabWord[], progress: WordProgress[], stats: AppStats, now = Date.now()) {
  const today = localDateKey(new Date(now))
  const seen = new Set(stats.todayDate === today ? stats.todaySeen : [])
  for (const p of progress) {
    const lastStudy = p.lastStudiedAt ?? (p.lastExplanationAt === p.updatedAt ? undefined : p.updatedAt)
    if (p.seen > 0 && lastStudy !== undefined && localDateKey(new Date(lastStudy)) === today) seen.add(p.wordId)
  }
  const byId = new Map(progress.map(p => [p.wordId, p]))
  const hard = (p: WordProgress) => isWeak(p) || isLeech(p)
  const hardDone = progress.filter(p => seen.has(p.wordId) && (hard(p) || p.incorrect > 0)).length
  const remaining = Math.max(0, RELIEF_TARGET - seen.size)
  const due = words.filter(w => {
    const p = byId.get(w.id)
    return p && p.seen > 0 && !p.excluded && !seen.has(w.id) && p.nextReviewAt <= now
  }).sort((a, b) => byId.get(a.id)!.nextReviewAt - byId.get(b.id)!.nextReviewAt)
  const difficult = due.filter(w => hard(byId.get(w.id)!)).slice(0, Math.max(0, 5 - hardDone))
  const easier = due.filter(w => !hard(byId.get(w.id)!))
  const selected: VocabWord[] = []
  // Mix a difficult word with two easier words; never fill a short queue with extra hard words.
  while (selected.length < remaining && (difficult.length || easier.length)) {
    const next = difficult.shift()
    if (next) selected.push(next)
    for (let i = 0; i < 2 && easier.length; i++) selected.push(easier.shift()!)
  }
  return { words: selected.slice(0, remaining), remaining, done: seen.size >= RELIEF_TARGET }
}
