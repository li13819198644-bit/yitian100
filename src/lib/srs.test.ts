import { describe, expect, it } from 'vitest'
import { createProgress, chooseDailyWords, insertDelayedRetry, isWeak, scheduleReview } from './srs'
import type { VocabWord } from '../types'

const now = new Date('2026-07-17T00:00:00Z').getTime()

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
