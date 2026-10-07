import { describe, expect, it } from 'vitest'
import { createProgress } from './srs'
import { scheduleRetrieval } from './retrieval'
import { firstAnswerSummary, localDateKey, recordStudyResult } from './studyStats'
import { buildDailyReport } from './dailyReport'
import type { AppStats } from '../types'

const now = new Date(2026, 9, 7, 12).getTime()
const base: AppStats = { todayDate: localDateKey(new Date(now)), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 }

describe('independent retrieval versus assisted answers', () => {
  it('keeps an assisted success from improving memory strength or mastery', () => {
    const old = { ...createProgress('postpone', now), seen: 10, correct: 8, repetitions: 5, stability: 30, mastered: true, lastSuccessfulReviewAt: now - 86_400_000 }
    const next = scheduleRetrieval(old, true, 'assisted', now)
    expect(next).toMatchObject({ repetitions: old.repetitions, stability: old.stability, easeFactor: old.easeFactor, mastered: false, seen: 11, correct: 9, lastSuccessfulReviewAt: old.lastSuccessfulReviewAt })
    expect(next.nextReviewAt).toBe(now + 6 * 60 * 60 * 1000)
    expect(old.mastered).toBe(true)
  })
  it('preserves next-morning cooling after two mistakes, even after a late assisted success', () => {
    const late = new Date(2026, 9, 7, 23).getTime()
    const old = { ...createProgress('a', late), practiceDay: localDateKey(new Date(late)), mistakesToday: 2 }
    expect(scheduleRetrieval(old, true, 'assisted', late).nextReviewAt).toBe(new Date(2026, 9, 8, 9).getTime())
  })
  it('schedules failures normally and leaves excluded words alone', () => {
    const old = createProgress('a', now)
    expect(scheduleRetrieval(old, false, 'assisted', now)).toMatchObject({ incorrect: 1, lapses: 1, lastRating: 'unknown' })
    const excluded = { ...old, excluded: true }
    expect(scheduleRetrieval(excluded, true, 'production', now)).toBe(excluded)
  })
  it('an independent input can increase strength, without treating same-day repeats as retention', () => {
    const first = scheduleRetrieval(createProgress('a', now), true, 'production', now)
    const repeat = scheduleRetrieval(first, true, 'production', now + 1000)
    expect(first.repetitions).toBe(1)
    expect(repeat.repetitions).toBe(1)
    expect(repeat.stability).toBe(first.stability)
  })
  it('reports hints, recall self-ratings, production and usage separately', () => {
    let stats = recordStudyResult(base, 'a', true, 'assisted', now)
    expect(firstAnswerSummary(stats.dailyHistory?.[0]).count).toBe(0)
    expect(stats.combo).toBe(0)
    stats = recordStudyResult(stats, 'a', true, 'recall', now + 1)
    stats = recordStudyResult(stats, 'a', true, 'usage', now + 2)
    stats = recordStudyResult(stats, 'a', false, 'production', now + 3)
    stats = recordStudyResult(stats, 'a', true, 'production', now + 4)
    const report = buildDailyReport([], [], stats, [], now)
    expect(report.vocabulary.objectiveFirstAnswer).toEqual({ correct: 0, count: 1, accuracy: 0 })
    expect(report.vocabulary.retrievalPractice).toEqual({
      assisted: { correct: 1, count: 1, accuracy: 100 }, recall: { correct: 1, count: 1, accuracy: 100 },
      usage: { correct: 1, count: 1, accuracy: 100 }, production: { correct: 1, count: 2, accuracy: 50 },
    })
    expect(report.vocabulary.results[0].firstAnswer).toEqual({ correct: true, mode: 'assisted' })
  })
})
