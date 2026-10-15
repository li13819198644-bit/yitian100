import type { AppStats, VocabWord, WordProgress } from '../types'
import { localDateKey } from './studyStats'
import { isWeak, isLeech } from './srs'

export const RELIEF_TARGET = 25
const RECENT_WINDOW = 3 * 86400000

function mixDue(words: VocabWord[], byId: Map<string, WordProgress>, limit: number, recentLimit: number, now: number) {
  const recent = words.filter(w => (byId.get(w.id)!.lastStudiedAt ?? byId.get(w.id)!.updatedAt) >= now - RECENT_WINDOW)
  const older = words.filter(w => !recent.includes(w))
  const pickedRecent = recent.splice(0, recentLimit)
  const pickedOlder = older.splice(0, Math.max(0, limit - pickedRecent.length))
  const selected: VocabWord[] = []
  while (pickedRecent.length || pickedOlder.length) {
    for (let i = 0; i < 3 && pickedRecent.length; i++) selected.push(pickedRecent.shift()!)
    for (let i = 0; i < 2 && pickedOlder.length; i++) selected.push(pickedOlder.shift()!)
  }
  return [...selected, ...recent, ...older].slice(0, limit)
}

export function extraReviewWords(words: VocabWord[], progress: WordProgress[], weakOnly = false, now = Date.now()) {
  const byId = new Map(progress.map(p => [p.wordId, p]))
  const eligible = words.filter(w => {
    const p = byId.get(w.id)
    return p && p.seen > 0 && !p.excluded && (!weakOnly || isWeak(p))
  }).sort((a, b) => {
    const left = byId.get(a.id)!, right = byId.get(b.id)!
    return Number(right.nextReviewAt <= now) - Number(left.nextReviewAt <= now)
      || (left.lastStudiedAt ?? left.updatedAt) - (right.lastStudiedAt ?? right.updatedAt)
  })
  const due = eligible.filter(w => byId.get(w.id)!.nextReviewAt <= now)
  const selected = mixDue(due, byId, 10, 6, now)
  return [...selected, ...eligible.filter(w => byId.get(w.id)!.nextReviewAt > now)].slice(0, 10)
}

export function reliefPlan(words: VocabWord[], progress: WordProgress[], stats: AppStats, now = Date.now()) {
  const today = localDateKey(new Date(now))
  const seen = new Set(stats.todayDate === today ? stats.todaySeen : [])
  for (const p of progress) if (p.seen > 0 && localDateKey(new Date(p.lastStudiedAt ?? p.updatedAt)) === today) seen.add(p.wordId)
  const byId = new Map(progress.map(p => [p.wordId, p]))
  const hard = (p: WordProgress) => isWeak(p) || isLeech(p)
  const remaining = Math.max(0, RELIEF_TARGET - seen.size)
  const due = words.filter(w => {
    const p = byId.get(w.id)
    return p && p.seen > 0 && !p.excluded && !seen.has(w.id) && p.nextReviewAt <= now
  }).sort((a, b) => byId.get(a.id)!.nextReviewAt - byId.get(b.id)!.nextReviewAt)
  // Recent due words must not be blocked by the old hard-word quota.
  const recent = due.filter(w => (byId.get(w.id)!.lastStudiedAt ?? byId.get(w.id)!.updatedAt) >= now - RECENT_WINDOW)
  const older = due.filter(w => !recent.includes(w))
  const eligibleOlder = older.filter(w => !hard(byId.get(w.id)!))
  eligibleOlder.push(...older.filter(w => hard(byId.get(w.id)!)).slice(0, 5))
  const candidates = [...recent, ...eligibleOlder].sort((a, b) => byId.get(a.id)!.nextReviewAt - byId.get(b.id)!.nextReviewAt)
  return { words: mixDue(candidates, byId, remaining, Math.min(15, Math.ceil(remaining * 0.6)), now), remaining, done: seen.size >= RELIEF_TARGET }
}
