import type { WordProgress } from '../types'
import type { LearningEvent } from './learningProtocol'
import { DAY } from './learningProtocol'
import { scheduleReview } from './srs'

export function scheduleSemanticRecall(progress: WordProgress, correct: boolean, events: LearningEvent[], now: number): WordProgress {
  const next = scheduleReview(progress, correct ? 'known' : 'unknown', now)
  const exposure = events.filter(event => event.wordId === progress.wordId && event.at < now && !event.experimentId && ['encoding', 'feedback', 'context', 'contrast'].includes(event.kind)).sort((a, b) => b.at - a.at)[0]
  if (!correct || !progress.seen || !exposure || now - exposure.at >= DAY) return next
  return { ...next, repetitions: progress.repetitions, easeFactor: progress.easeFactor, stability: progress.stability, mastered: progress.mastered, lastSuccessfulReviewAt: progress.lastSuccessfulReviewAt, nextReviewAt: Math.min(next.nextReviewAt, now + DAY) }
}
