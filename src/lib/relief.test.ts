import { describe, it, expect } from 'vitest'
import { extraReviewWords, reliefPlan } from './relief'
import { createProgress, isWeak } from './srs'
import { seedWords } from '../data/seedWords'
import type { AppStats } from '../types'
import { localDateKey } from './studyStats'

const now = new Date(2026, 9, 14, 12).getTime()
const words = seedWords.slice(0, 40)
const progress = words.map((w, i) => ({ ...createProgress(w.id, now - 86400000), seen: 5, correct: i < 20 ? 0 : 5, incorrect: i < 20 ? 5 : 0, lapses: i < 20 ? 5 : 0 }))
const stats: AppStats = { todayDate: localDateKey(new Date(now)), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }
describe('relief daily budget', () => {
  it('does not count browsing an old explanation as a new practice word', () => {
    const viewed = progress.map((p, index) => index < 3 ? { ...p, updatedAt: now, lastExplanationAt: now } : p)
    expect(reliefPlan(words, viewed, stats, now).remaining).toBe(15)
    expect(reliefPlan(words, viewed, stats, now).words).toHaveLength(15)
  })
  it('offers voluntary old-word practice without new or excluded words', () => {
    const items = progress.map((p, i) => ({ ...p, excluded: i === 0 }))
    const extra = extraReviewWords([...words, seedWords[41]], items, false, now)
    expect(extra).toHaveLength(10)
    expect(extra.some(w => w.id === words[0].id || w.id === seedWords[41].id)).toBe(false)
    expect(extraReviewWords(words, items, true, now).every(w => isWeak(items.find(p => p.wordId === w.id)!))).toBe(true)
  })
  it('caps total and difficult words without changing progress', () => {
    const before = JSON.stringify(progress)
    const plan = reliefPlan(words, progress, stats, now)
    expect(plan.words).toHaveLength(15)
    expect(plan.words.filter(w => isWeak(progress.find(p => p.wordId === w.id)!))).toHaveLength(5)
    expect(JSON.stringify(progress)).toBe(before)
  })
  it('never fills with new, excluded or future words', () => {
    expect(reliefPlan(words, [], stats, now).words).toEqual([])
    expect(reliefPlan(words, progress.map(p => ({ ...p, excluded: true })), stats, now).words).toEqual([])
    expect(reliefPlan(words, progress.map(p => ({ ...p, nextReviewAt: now + 1000 })), stats, now).words).toEqual([])
  })
  it('keeps the quota across entry points and reloads', () => {
    const todaySeen = words.slice(0, 5).map(w => w.id)
    const plan = reliefPlan(words, progress, { ...stats, todaySeen }, now)
    expect(plan.words).toHaveLength(10)
    expect(plan.words.every(w => !isWeak(progress.find(p => p.wordId === w.id)!))).toBe(true)
    expect(reliefPlan(words, progress, { ...stats, todaySeen: words.slice(0, 15).map(w => w.id) }, now).words).toEqual([])
  })
  it('allows fewer than 15 instead of adding extra hard words', () => {
    expect(reliefPlan(words.slice(0, 20), progress, stats, now).words).toHaveLength(5)
  })
})
