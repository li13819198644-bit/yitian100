import type { GrammarProgress } from '../types'
import { localDateKey } from './studyStats'

export function mergeGrammarProgress(...sources: GrammarProgress[][]): GrammarProgress[] {
  const merged = new Map<string, GrammarProgress>()
  for (const items of sources) {
    for (const item of items) {
      const previous = merged.get(item.questionId)
      if (!previous || item.updatedAt >= previous.updatedAt) merged.set(item.questionId, item)
    }
  }
  return [...merged.values()]
}

export function recordGrammarAnswer(questionId: string, correct: boolean, previous?: GrammarProgress, now = Date.now()): GrammarProgress {
  const sameDay = previous && localDateKey(new Date(previous.updatedAt)) === localDateKey(new Date(now))
  // Same-day corrections cannot advance the review interval.
  const reviewStage = correct ? (sameDay ? previous.reviewStage : Math.min(4, (previous?.reviewStage ?? 0) + 1)) : 0
  const days = [1, 1, 3, 7, 14][reviewStage]
  const due = new Date(now)
  due.setDate(due.getDate() + days)
  due.setHours(9, 0, 0, 0)
  return {
    questionId, attempts: (previous?.attempts ?? 0) + 1,
    correct: (previous?.correct ?? 0) + Number(correct),
    firstCorrect: previous?.firstCorrect ?? correct, lastCorrect: correct,
    reviewStage, nextReviewAt: sameDay && correct && previous.lastCorrect ? previous.nextReviewAt : due.getTime(), updatedAt: now,
  }
}

export function chooseGrammarQuestions(ids: string[], progress: GrammarProgress[], reviewOnly = false, now = Date.now(), random = Math.random): string[] {
  const byId = new Map(progress.map((item) => [item.questionId, item]))
  return [...new Set(ids)]
    .filter((id) => !reviewOnly || Boolean(byId.get(id) && byId.get(id)!.nextReviewAt <= now))
    .map((id) => ({ id, item: byId.get(id), tie: random() }))
    .sort((a, b) => {
      const priority = (item?: GrammarProgress) => item && item.nextReviewAt <= now ? 0 : !item ? 1 : 2
      return priority(a.item) - priority(b.item) || (a.item?.updatedAt ?? 0) - (b.item?.updatedAt ?? 0) || a.tie - b.tie
    })
    .slice(0, 5).map(({ id }) => id)
}
