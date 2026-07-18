import { describe, expect, it } from 'vitest'
import {
  buildDailyPlan,
  chooseLearnSession,
  chooseReviewSession,
  createProgress,
  chooseDailyWords,
  getDueReviewWords,
  insertDelayedRetry,
  isWeak,
  recommendNewWordCount,
  scheduleReview,
} from './srs'
import type { VocabWord } from '../types'

const now = new Date('2026-07-17T00:00:00Z').getTime()
const day = 24 * 60 * 60 * 1000

function word(id: string): VocabWord {
  return {
    id,
    word: id,
    phonetic: '',
    meaning: `${id} meaning`,
    collocation: '',
    example: `${id} example`,
    difficulty: 3,
    level: 'B2',
  }
}

describe('spaced repetition', () => {
  it('schedules known words farther out as repetitions grow', () => {
    const first = scheduleReview(createProgress('facilitate', now), 'known', now)
    const second = scheduleReview(first, 'known', now)

    expect(first.repetitions).toBe(1)
    expect(second.repetitions).toBe(2)
    expect(second.nextReviewAt).toBeGreaterThan(first.nextReviewAt)
    expect(second.easeFactor).toBeGreaterThanOrEqual(2.5)
    expect(second.stability).toBeGreaterThan(first.stability)
  })

  it('resets repetitions and records lapses for unknown words', () => {
    const known = scheduleReview(createProgress('constrain', now), 'known', now)
    const unknown = scheduleReview(known, 'unknown', now)

    expect(unknown.repetitions).toBe(0)
    expect(unknown.lapses).toBe(1)
    expect(unknown.incorrect).toBe(1)
    expect(unknown.nextReviewAt - now).toBe(10 * 60 * 1000)
    expect(isWeak(unknown)).toBe(true)
  })

  it('prioritizes overdue review words before new words', () => {
    const words = [word('new'), word('overdue'), word('future')]
    const overdue = { ...createProgress('overdue', now), nextReviewAt: now - 1000 }
    const future = { ...createProgress('future', now), nextReviewAt: now + 100000 }

    const chosen = chooseDailyWords(words, [future, overdue], 3, now)

    expect(chosen.map((item) => item.id)).toEqual(['overdue', 'new', 'future'])
  })

  it('keeps review sessions limited to due words', () => {
    const words = [word('due-old'), word('due-newer'), word('new'), word('future-weak')]
    const dueOld = { ...createProgress('due-old', now), nextReviewAt: now - 5000 }
    const dueNewer = { ...createProgress('due-newer', now), nextReviewAt: now - 1000 }
    const futureWeak = {
      ...createProgress('future-weak', now),
      nextReviewAt: now + day,
      lastRating: 'unknown' as const,
      lapses: 1,
    }

    const review = chooseReviewSession(words, [futureWeak, dueNewer, dueOld], {
      baseNewWordsPerDay: 100,
      dailyCapacity: 160,
      now,
    })

    expect(review.map((item) => item.id)).toEqual(['due-old', 'due-newer'])
  })

  it('reduces new words as review debt consumes daily capacity', () => {
    expect(recommendNewWordCount(0, 100, 160)).toBe(100)
    expect(recommendNewWordCount(80, 100, 160)).toBe(80)
    expect(recommendNewWordCount(160, 100, 160)).toBe(0)
    expect(recommendNewWordCount(220, 100, 160)).toBe(0)
  })

  it('keeps learn sessions to unseen new words only', () => {
    const words = [word('seen-due'), word('seen-future'), word('new-a'), word('new-b')]
    const seenDue = { ...createProgress('seen-due', now), nextReviewAt: now - 1000 }
    const seenFuture = { ...createProgress('seen-future', now), nextReviewAt: now + day }

    const learn = chooseLearnSession(words, [seenDue, seenFuture], {
      baseNewWordsPerDay: 100,
      dailyCapacity: 160,
      now,
    })

    expect(learn.map((item) => item.id)).toEqual(['new-a', 'new-b'])
  })

  it('builds a daily plan with review debt and capped new words', () => {
    const words = Array.from({ length: 200 }, (_, index) => word(`word-${index}`))
    const dueProgress = words.slice(0, 90).map((item, index) => ({
      ...createProgress(item.id, now),
      nextReviewAt: now - index,
    }))

    const plan = buildDailyPlan(words, dueProgress, {
      baseNewWordsPerDay: 100,
      dailyCapacity: 160,
      now,
    })

    expect(plan.reviewDebt).toBe(90)
    expect(plan.recommendedNewCount).toBe(70)
    expect(plan.dueReviewWords).toHaveLength(90)
    expect(plan.newWords).toHaveLength(70)
  })

  it('sorts due review words by oldest nextReviewAt first', () => {
    const words = [word('later'), word('earlier')]
    const later = { ...createProgress('later', now), nextReviewAt: now - 1000 }
    const earlier = { ...createProgress('earlier', now), nextReviewAt: now - 5000 }

    expect(getDueReviewWords(words, [later, earlier], now).map((item) => item.id)).toEqual(['earlier', 'later'])
  })

  it('does not retry known words inside the same session', () => {
    expect(insertDelayedRetry(['a', 'b', 'c'], 0, 'a', 'known')).toEqual(['a', 'b', 'c'])
  })

  it('delays fuzzy and unknown retries instead of looping immediately', () => {
    const base = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']

    expect(insertDelayedRetry(base, 0, 'a', 'fuzzy').indexOf('a')).toBe(0)
    expect(insertDelayedRetry(base, 0, 'a', 'fuzzy').lastIndexOf('a')).toBe(9)
    expect(insertDelayedRetry(base, 0, 'a', 'unknown').filter((id) => id === 'a')).toHaveLength(3)
    expect(insertDelayedRetry(base, 0, 'a', 'unknown')[4]).toBe('a')
  })
})
