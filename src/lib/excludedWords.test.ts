import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import { buildDailyPlan, chooseDailyWords, chooseLearnSession, chooseLeechRepairSession, chooseQuizSession, chooseReviewSession, chooseWeakPracticeSession, chooseWeakRotationSession, createProgress, forecastReviewLoad, getNewWords, isLeech, isWeak, scheduleReview, setWordExcluded } from './srs'

const now = new Date(2026, 9, 4, 12).getTime()
const words = seedWords.slice(0, 3)
const options = { now, baseNewWordsPerDay: 100, dailyCapacity: 160 }
describe('excluded easy words', () => {
  it('preserves history and never counts cutting or restoring as practice', () => {
    const before = { ...createProgress(words[0].id, now - 86400000), seen: 8, correct: 2, incorrect: 6, lapses: 6 }
    const cut = setWordExcluded(before, true, now)
    expect(cut).toMatchObject({ seen: 8, correct: 2, incorrect: 6, lapses: 6, lastStudiedAt: before.updatedAt, updatedAt: now, excluded: true })
    expect(scheduleReview(cut, 'known', now)).toBe(cut)
    expect(isWeak(cut)).toBe(false)
    expect(isLeech(cut)).toBe(false)
    const restored = setWordExcluded(cut, false, now + 1000)
    expect(restored).toMatchObject({ seen: 8, incorrect: 6, lapses: 6, lastStudiedAt: before.updatedAt, nextReviewAt: before.nextReviewAt })
    expect(isWeak(restored)).toBe(true)
  })
  it('excludes due, new, weak, leech, quiz and fallback queues', () => {
    const progress = words.map(word => setWordExcluded({ ...createProgress(word.id, now - 1000), seen: 8, lapses: 6, incorrect: 8 }, true, now))
    expect(buildDailyPlan(words, progress, options)).toMatchObject({ reviewDebt: 0, weakDebt: 0, newWords: [] })
    for (const choose of [chooseLearnSession, chooseReviewSession, chooseWeakPracticeSession, chooseQuizSession]) expect(choose(words, progress, options)).toEqual([])
    expect(chooseLeechRepairSession(words, progress)).toEqual([])
    expect(chooseWeakRotationSession(words, progress, 20, now)).toEqual([])
    expect(chooseDailyWords(words, progress, 100, now)).toEqual([])
    expect(forecastReviewLoad(progress.map(item => ({ ...item, nextReviewAt: now + 3600000 })), 7, now)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
  it('puts an unstudied restored word back into new words, not due reviews', () => {
    const cut = setWordExcluded(createProgress(words[0].id, now - 1000), true, now)
    expect(getNewWords(words.slice(0, 1), [cut])).toEqual([])
    const restored = setWordExcluded(cut, false, now)
    expect(getNewWords(words.slice(0, 1), [restored])).toEqual(words.slice(0, 1))
    expect(buildDailyPlan(words.slice(0, 1), [restored], options).reviewDebt).toBe(0)
    expect(restored.lastStudiedAt).toBe(0)
    expect(JSON.parse(JSON.stringify(cut)).excluded).toBe(true)
  })
})
