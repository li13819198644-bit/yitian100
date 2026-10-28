import { describe, it, expect } from 'vitest'
import { extraReviewWords, reliefPlan } from './relief'
import { createProgress, isWeak } from './srs'
import { seedWords } from '../data/seedWords'
import type { AppStats } from '../types'
import { localDateKey } from './studyStats'

const now = new Date(2026, 9, 14, 12).getTime()
const words = seedWords.slice(0, 40)
const progress = words.map((w, i) => ({ ...createProgress(w.id, now - 10 * 86400000), seen: 5, correct: i < 20 ? 0 : 5, incorrect: i < 20 ? 5 : 0, lapses: i < 20 ? 5 : 0 }))
const stats: AppStats = { todayDate: localDateKey(new Date(now)), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }
describe('relief daily budget', () => {
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
    expect(plan.words).toHaveLength(25)
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
    expect(plan.words).toHaveLength(20)
    expect(plan.words.every(w => !todaySeen.includes(w.id))).toBe(true)
    expect(reliefPlan(words, progress, { ...stats, todaySeen: words.slice(0, 25).map(w => w.id) }, now).words).toEqual([])
  })
  it('allows fewer than 25 instead of filling with old hard words', () => {
    expect(reliefPlan(words.slice(0, 20), progress, stats, now).words).toHaveLength(5)
  })
  it('reserves recent due words even when old debt and hard words dominate', () => {
    const items = progress.map((p, i) => i < 20 ? { ...p, lastStudiedAt: now - 2 * 86400000, nextReviewAt: now - 86400000 } : p)
    const plan = reliefPlan(words, items, stats, now)
    expect(plan.words).toHaveLength(25)
    expect(plan.words.filter(w => words.slice(0, 20).some(r => r.id === w.id))).toHaveLength(15)
    expect(extraReviewWords(words, items, false, now).filter(w => words.slice(0, 20).some(r => r.id === w.id))).toHaveLength(6)
    expect(reliefPlan(words, items.map(p => ({ ...p, nextReviewAt: now + 1000 })), stats, now).words).toEqual([])
  })
  it('uses an individual budget and priority only among eligible due words', () => {
    const focusIds = [words[39].id, words[38].id, words[37].id]
    const items = progress.map((p, i) => ({ ...p, excluded: i === 39, nextReviewAt: i === 38 ? now + 1000 : p.nextReviewAt }))
    const plan = reliefPlan(words, items, stats, now, { target: 15, focusIds })
    expect(plan.words).toHaveLength(15)
    expect(plan.words[0].id).toBe(words[37].id)
    expect(plan.words.some(word => [words[38].id, words[39].id].includes(word.id))).toBe(false)
    expect(plan.words.filter(word => isWeak(items.find(p => p.wordId === word.id)!)).length).toBeLessThanOrEqual(5)
  })
  it('does not let individual priority bypass the two-failure daily cooldown', () => {
    const items = progress.map(p => ({ ...p, practiceDay: stats.todayDate, mistakesToday: 2 }))
    expect(reliefPlan(words, items, stats, now, { target: 15, focusIds: words.map(word => word.id) }).words).toEqual([])
  })
})
