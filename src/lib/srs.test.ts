import { describe, expect, it } from 'vitest'
import {
  buildDailyPlan,
  chooseLeechRepairSession,
  chooseWeakRotationSession,
  chooseLearnSession,
  chooseQuizSession,
  chooseReviewSession,
  chooseWeakPracticeSession,
  createProgress,
  chooseDailyWords,
  forecastReviewLoad,
  recommendNewWordCountWithForecast,
  getDueReviewWords,
  getNewWords,
  insertDelayedRetry,
  isWeak,
  isLeech,
  isMastered,
  isRecovered,
  recommendNewWordCount,
  recommendNewWordCountWithWeakDebt,
  scheduleQuizResult,
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

  it('caps review intervals for repeated lapse words until they recover', () => {
    const leech = {
      ...createProgress('encompass', now),
      repetitions: 2,
      lapses: 12,
      stability: 16,
      seen: 20,
      correct: 9,
      incorrect: 11,
    }
    const next = scheduleReview(leech, 'known', now)

    expect(isLeech(leech)).toBe(true)
    expect(next.nextReviewAt - now).toBeLessThanOrEqual(12 * 60 * 60 * 1000)
  })

  it('lets a historically weak word recover after enough consecutive recalls', () => {
    const recovered = {
      ...createProgress('recovered', now),
      repetitions: 6,
      lapses: 8,
      seen: 20,
      correct: 12,
      incorrect: 8,
      easeFactor: 2.05,
      stability: 7,
      lastRating: 'known' as const,
    }

    expect(isRecovered(recovered)).toBe(true)
    expect(isWeak(recovered)).toBe(false)
  })

  it('allows mastery after recovery instead of requiring a perfect history', () => {
    const recovered = {
      ...createProgress('eventual-mastery', now),
      repetitions: 8,
      lapses: 12,
      seen: 30,
      correct: 18,
      incorrect: 12,
      easeFactor: 2.3,
      stability: 16,
      lastRating: 'known' as const,
    }

    expect(isMastered(recovered)).toBe(true)
    expect(isWeak(recovered)).toBe(false)
  })

  it('keeps a lapse word weak while consecutive-recall recovery is incomplete', () => {
    const recovering = {
      ...createProgress('recovering', now),
      repetitions: 2,
      lapses: 8,
      seen: 12,
      correct: 7,
      incorrect: 5,
      easeFactor: 2.2,
      lastRating: 'known' as const,
    }

    expect(isRecovered(recovering)).toBe(false)
    expect(isWeak(recovering)).toBe(true)
  })

  it('does not graduate a lapse word while the learner still rates it fuzzy', () => {
    const fuzzy = {
      ...createProgress('still-fuzzy', now),
      repetitions: 6,
      lapses: 8,
      seen: 20,
      correct: 12,
      incorrect: 8,
      easeFactor: 2.05,
      stability: 7,
      lastRating: 'fuzzy' as const,
    }

    expect(isRecovered(fuzzy)).toBe(false)
    expect(isWeak(fuzzy)).toBe(true)
  })

  it('treats correct quiz answers as light reinforcement instead of known mastery', () => {
    const base = createProgress('quiz-word', now)
    const selfRatedKnown = scheduleReview(base, 'known', now)
    const quizCorrect = scheduleQuizResult(base, true, now)

    expect(quizCorrect.lastRating).toBe('fuzzy')
    expect(quizCorrect.nextReviewAt).toBeLessThan(selfRatedKnown.nextReviewAt)
    expect(quizCorrect.correct).toBe(1)
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

  it('forecasts future review load by day', () => {
    const progress = [
      { ...createProgress('today', now), nextReviewAt: now + 60 * 1000 },
      { ...createProgress('tomorrow', now), nextReviewAt: now + day + 60 * 1000 },
      { ...createProgress('tomorrow-2', now), nextReviewAt: now + day + 120 * 1000 },
    ]

    expect(forecastReviewLoad(progress, 3, now)).toEqual([1, 2, 0])
  })

  it('reduces new words when the seven-day forecast is overloaded', () => {
    const overloadedForecast = [0, 220, 210, 180, 170, 0, 0]

    expect(recommendNewWordCountWithForecast(0, 100, 160, overloadedForecast)).toBeLessThan(100)
  })

  it('stops new words when weak debt is high', () => {
    expect(recommendNewWordCountWithWeakDebt(0, 95, 120, 100, 160)).toBe(0)
    expect(recommendNewWordCountWithWeakDebt(0, 10, 20, 100, 160)).toBe(20)
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

    expect(new Set(learn.map((item) => item.id))).toEqual(new Set(['new-a', 'new-b']))
  })

  it('keeps new words shuffled but stable within the same day', () => {
    const words = Array.from({ length: 12 }, (_, index) => word(`new-${String(index).padStart(2, '0')}`))
    const morning = new Date(2026, 7, 13, 8).getTime()
    const evening = new Date(2026, 7, 13, 20).getTime()
    const first = getNewWords(words, [], 12, morning).map((item) => item.id)
    const repeated = getNewWords(words, [], 12, evening).map((item) => item.id)

    expect(first).toEqual(repeated)
    expect(first).not.toEqual(words.map((item) => item.id))
    expect(new Set(first)).toEqual(new Set(words.map((item) => item.id)))
  })

  it('supplements quiz sessions beyond a small overdue queue', () => {
    const words = Array.from({ length: 12 }, (_, index) => word(`word-${index}`))
    const dueA = { ...createProgress('word-0', now), nextReviewAt: now - 5000, updatedAt: now - 5000 }
    const dueB = { ...createProgress('word-1', now), nextReviewAt: now - 1000, updatedAt: now - 1000 }
    const recent = words.slice(2, 8).map((item, index) => ({
      ...createProgress(item.id, now),
      nextReviewAt: now + day,
      updatedAt: now - index,
    }))

    const quiz = chooseQuizSession(words, [dueB, dueA, ...recent], {
      baseNewWordsPerDay: 100,
      dailyCapacity: 160,
      quizSize: 8,
      now,
    })

    expect(quiz).toHaveLength(8)
    expect(quiz.slice(0, 2).map((item) => item.id)).toEqual(['word-0', 'word-1'])
    expect(new Set(quiz.map((item) => item.id)).size).toBe(8)
  })

  it('prioritizes leech words in weak practice sessions', () => {
    const words = [word('mild'), word('leech')]
    const mild = {
      ...createProgress('mild', now),
      nextReviewAt: now + day,
      lapses: 1,
      incorrect: 1,
    }
    const leech = {
      ...createProgress('leech', now),
      nextReviewAt: now + day,
      lapses: 6,
      incorrect: 6,
      correct: 2,
    }

    const practice = chooseWeakPracticeSession(words, [mild, leech], {
      baseNewWordsPerDay: 100,
      dailyCapacity: 160,
      now,
    })

    expect(practice.map((item) => item.id)).toEqual(['leech', 'mild'])
  })

  it('builds a dedicated leech session even when stubborn words are already due', () => {
    const words = [word('future-mild'), word('due-leech'), word('future-leech')]
    const futureMild = {
      ...createProgress('future-mild', now),
      nextReviewAt: now + day,
      lapses: 1,
      incorrect: 1,
    }
    const dueLeech = {
      ...createProgress('due-leech', now),
      nextReviewAt: now - day,
      lapses: 9,
      incorrect: 9,
      correct: 3,
    }
    const futureLeech = {
      ...createProgress('future-leech', now),
      nextReviewAt: now + day,
      lapses: 6,
      incorrect: 6,
      correct: 2,
    }

    const repair = chooseLeechRepairSession(words, [futureMild, futureLeech, dueLeech], 10)

    expect(repair.map((item) => item.id)).toEqual(['due-leech', 'future-leech'])
  })

  it('rotates recently practised weak words behind untouched weak words', () => {
    const words = Array.from({ length: 12 }, (_, index) => word(`weak-${index}`))
    const weakProgress = words.map((item, index) => ({
      ...createProgress(item.id, now),
      nextReviewAt: now + day,
      updatedAt: now - (12 - index) * day,
      lapses: 6,
      incorrect: 6,
      correct: 2,
      lastRating: 'known' as const,
    }))

    const first = chooseWeakRotationSession(words, weakProgress, 5, now)
    const practisedIds = new Set(first.map((item) => item.id))
    const updatedProgress = weakProgress.map((item) => practisedIds.has(item.wordId) ? { ...item, updatedAt: now } : item)
    const second = chooseWeakRotationSession(words, updatedProgress, 5, now)

    expect(first.map((item) => item.id)).toEqual(['weak-0', 'weak-1', 'weak-2', 'weak-3', 'weak-4'])
    expect(second.map((item) => item.id)).toEqual(['weak-5', 'weak-6', 'weak-7', 'weak-8', 'weak-9'])
  })

  it('mixes current failures, leeches, and recovering weak words', () => {
    const words = Array.from({ length: 12 }, (_, index) => word(`mixed-${index}`))
    const weakProgress = words.map((item, index) => ({
      ...createProgress(item.id, now),
      nextReviewAt: now + day,
      updatedAt: now - (12 - index) * day,
      lapses: index < 7 ? 6 : 1,
      incorrect: index < 7 ? 6 : 1,
      correct: index < 7 ? 2 : 1,
      lastRating: index < 4 ? 'unknown' as const : 'known' as const,
    }))

    const session = chooseWeakRotationSession(words, weakProgress, 10, now)
    const sessionProgress = session.map((item) => weakProgress.find((entry) => entry.wordId === item.id)!)

    expect(session).toHaveLength(10)
    expect(sessionProgress.filter((item) => item.lastRating === 'unknown')).toHaveLength(4)
    expect(sessionProgress.filter(isLeech)).toHaveLength(7)
    expect(sessionProgress.some((item) => !isLeech(item))).toBe(true)
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
    expect(plan.weakDebt).toBe(0)
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
