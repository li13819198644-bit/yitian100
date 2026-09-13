import type { AppStats, DailyStudyRecord, DailyWordDetail, Rating, SessionKind, StudyMode } from '../types'

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function localDateOffset(now: number, days: number): Date {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  return date
}

export function recordStudyResult(stats: AppStats, wordId: string, correct: boolean, mode: StudyMode, now = Date.now(), context?: { rating: Rating; session: SessionKind; isNew: boolean }): AppStats {
  const today = localDateKey(new Date(now))
  const sameDay = stats.todayDate === today
  const previous = stats.dailyHistory?.find((entry) => entry.date === today)
  const firstAnswers = { ...previous?.firstAnswers }
  // A correction later in the day must not replace the first retrieval result.
  if (!Object.hasOwn(firstAnswers, wordId)) firstAnswers[wordId] = { correct, mode }
  const old = previous?.wordDetails?.[wordId]
  const modeCount = old?.modes[mode]
  const previousFirst = previous?.firstAnswers[wordId]
  const firstTestAnswer = old?.firstTestAnswer ?? (previousFirst && previousFirst.mode !== 'self' ? previousFirst : mode !== 'self' ? { correct, mode } : undefined)
  const detail: DailyWordDetail = {
    attempts: (old?.attempts ?? 0) + 1,
    correct: (old?.correct ?? 0) + Number(correct),
    lastCorrect: correct,
    firstTestAnswer,
    newWord: old ? old.newWord : previous?.firstAnswers[wordId] ? null : context?.isNew ?? null,
    firstAt: old?.firstAt ?? now, lastAt: now,
    modes: { ...old?.modes, [mode]: { attempts: (modeCount?.attempts ?? 0) + 1, correct: (modeCount?.correct ?? 0) + Number(correct) } },
    ratings: { ...old?.ratings, ...(context ? { [context.rating]: (old?.ratings[context.rating] ?? 0) + 1 } : {}) },
    sessions: { ...old?.sessions, ...(context ? { [context.session]: (old?.sessions[context.session] ?? 0) + 1 } : {}) },
  }
  const record: DailyStudyRecord = {
    date: today,
    attempts: (previous?.attempts ?? 0) + 1,
    correct: (previous?.correct ?? 0) + Number(correct),
    firstAnswers,
    wordDetails: { ...previous?.wordDetails, [wordId]: detail },
  }
  const combo = correct ? (sameDay ? stats.combo : 0) + 1 : 0
  const yesterday = localDateKey(localDateOffset(now, -1))
  return {
    ...stats,
    todayDate: today,
    todaySeen: Array.from(new Set([...(sameDay ? stats.todaySeen : []), wordId])),
    combo,
    bestCombo: Math.max(stats.bestCombo, combo),
    streak: stats.lastStudyDate === today ? Math.max(1, stats.streak) : stats.lastStudyDate === yesterday ? stats.streak + 1 : 1,
    lastStudyDate: today,
    dailyHistory: [...(stats.dailyHistory ?? []).filter((entry) => entry.date !== today), record]
      .sort((a, b) => a.date.localeCompare(b.date)).slice(-90),
  }
}

export function firstAnswerSummary(record?: DailyStudyRecord) {
  const answers = Object.values(record?.firstAnswers ?? {})
  const correct = answers.filter((answer) => answer.correct).length
  return { count: answers.length, correct, accuracy: answers.length ? Math.round(correct / answers.length * 100) : null }
}
