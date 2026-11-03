import type { AppStats, VocabWord, WordProgress } from '../types'
import type { LearningEvent } from './learningProtocol'
import { localDateKey } from './studyStats'

export function todayWords(words: VocabWord[], progress: WordProgress[], stats: AppStats, events: LearningEvent[], now = Date.now()) {
  const date = localDateKey(new Date(now))
  const entries = new Map<string, { at: number; missed: boolean }>()
  const add = (id: string, at = 0, missed = false) => {
    const previous = entries.get(id)
    entries.set(id, { at: Math.max(previous?.at ?? 0, at), missed: missed || !!previous?.missed })
  }
  const isToday = (at: number) => at <= now && localDateKey(new Date(at)) === date
  if (stats.todayDate === date) stats.todaySeen.forEach(id => add(id))
  const day = stats.dailyHistory?.find(item => item.date === date)
  Object.entries(day?.firstAnswers ?? {}).forEach(([id, answer]) => add(id, 0, !answer.correct))
  Object.entries(day?.wordDetails ?? {}).forEach(([id, detail]) => add(id, detail.lastAt, detail.correct < detail.attempts))
  // lastStudiedAt is a study timestamp; updatedAt can also mean a settings or cut-word change.
  progress.forEach(item => { if (item.lastStudiedAt && isToday(item.lastStudiedAt)) add(item.wordId, item.lastStudiedAt) })
  events.forEach(event => { if (isToday(event.at)) add(event.wordId, event.at, event.outcome === 'incorrect') })
  return words.filter(word => entries.has(word.id)).map(word => ({ word, ...entries.get(word.id)! }))
    .sort((a, b) => b.at - a.at || a.word.word.localeCompare(b.word.word))
}

export type TodayWord = ReturnType<typeof todayWords>[number]
