import { expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import { todayWords } from './todayWords'
import { learningEvent } from './learningProtocol'
import { localDateKey, recordStudyResult } from './studyStats'
import { createProgress } from './srs'
import type { AppStats } from '../types'

const now = new Date(2026, 10, 3, 12).getTime()
const stats: AppStats = { todayDate: localDateKey(new Date(now)), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }
const [a, b, c] = seedWords
const event = (id: string, at: number) => learningEvent({ wordId: id, kind: 'encoding', cue: 'sentence', direction: 'en-zh', outcome: null, assessment: 'self', activeMs: 0, sessionId: 'test' }, at)

it('includes encoding without an answer, deduplicates all sources and retains mistakes after correction', () => {
  const failed = recordStudyResult(stats, a.id, false, 'recall', now - 5000)
  const corrected = recordStudyResult(failed, a.id, true, 'recall', now - 4000)
  const records = [event(b.id, now - 1000), event(a.id, now - 2000)]
  const before = JSON.stringify({ corrected, records })
  const result = todayWords(seedWords, [], corrected, records, now)
  expect(result.map(item => item.word.id)).toEqual([b.id, a.id])
  expect(result.map(item => item.missed)).toEqual([false, true])
  expect(JSON.stringify({ corrected, records })).toBe(before)
})
it('uses local calendar days and excludes yesterday, future events and metadata-only changes', () => {
  const yesterday = new Date(2026, 10, 2, 23, 59).getTime()
  const midnight = new Date(2026, 10, 3).getTime()
  const stale = { ...stats, todayDate: localDateKey(new Date(yesterday)), todaySeen: [a.id] }
  const progress = [{ ...createProgress(c.id, yesterday), updatedAt: now, seen: 3, lastStudiedAt: yesterday }]
  expect(todayWords(seedWords, progress, stale, [event(a.id, yesterday), event(b.id, midnight), event(c.id, now + 1000)], now).map(item => item.word.id)).toEqual([b.id])
})
it('supports legacy records and keeps excluded studied words available for a recap', () => {
  const progress = [{ ...createProgress(a.id, now), excluded: true, lastStudiedAt: now, seen: 1 }]
  expect(todayWords(seedWords, progress, { ...stats, todaySeen: [b.id, 'removed-id'] }, [], now).map(item => item.word.id)).toEqual([a.id, b.id])
})
