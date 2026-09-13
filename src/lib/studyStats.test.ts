import { describe, expect, it } from 'vitest'
import type { AppStats } from '../types'
import { firstAnswerSummary, localDateKey, recordStudyResult } from './studyStats'

const now = new Date(2026, 8, 13, 12).getTime()
const base: AppStats = { todayDate: localDateKey(new Date(now)), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }

describe('study measurements', () => {
  it('preserves a first failure after later correct answers and retains modes', () => {
    const failed = recordStudyResult(base, 'refute', false, 'choice', now)
    const corrected = recordStudyResult(failed, 'refute', true, 'spelling', now + 60_000)
    const nextWord = recordStudyResult(corrected, 'valid', true, 'self', now + 120_000)
    expect(firstAnswerSummary(nextWord.dailyHistory?.[0])).toEqual({ count: 2, correct: 1, accuracy: 50 })
    expect(nextWord.dailyHistory?.[0].attempts).toBe(3)
    expect(nextWord.dailyHistory?.[0].firstAnswers.refute).toEqual({ correct: false, mode: 'choice' })
    expect(nextWord.todaySeen).toHaveLength(2)
  })

  it('increments streaks across month boundaries and resets after a missed day', () => {
    const lastDay = new Date(2026, 7, 31, 23).getTime()
    const first = recordStudyResult(base, 'a', true, 'choice', lastDay)
    const second = recordStudyResult(first, 'a', true, 'choice', new Date(2026, 8, 1, 8).getTime())
    expect(second.streak).toBe(2)
    expect(recordStudyResult(second, 'b', true, 'choice', new Date(2026, 8, 1, 9).getTime()).streak).toBe(2)
    const gap = recordStudyResult(second, 'c', true, 'choice', new Date(2026, 8, 3, 8).getTime())
    expect(gap.streak).toBe(1)
    expect(gap.combo).toBe(1)
    expect(gap.todaySeen).toEqual(['c'])
  })

  it('keeps per-day first answers separate without inventing historical records', () => {
    expect(firstAnswerSummary()).toEqual({ count: 0, correct: 0, accuracy: null })
    const first = recordStudyResult(base, 'a', false, 'choice', now)
    const second = recordStudyResult(first, 'a', true, 'choice', new Date(2026, 8, 14, 12).getTime())
    expect(second.dailyHistory).toHaveLength(2)
    expect(firstAnswerSummary(second.dailyHistory?.[0]).accuracy).toBe(0)
    expect(firstAnswerSummary(second.dailyHistory?.[1]).accuracy).toBe(100)
  })
})
