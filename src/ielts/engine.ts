import { localDateKey } from '../lib/studyStats'
import type { Attempt, Feedback, Question, Skill, WritingState } from './types'

export const DAY = 86_400_000
export const normalizeAnswer = (text: string) => text.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[.!?]+$/g, '').replace(/\s+/g, ' ')

export function gradeWriting(question: Question, answer: string): Feedback {
  if (!answer.trim()) throw new Error('请先作答。')
  if ([question.answer, ...(question.alternatives ?? [])].some(reference => normalizeAnswer(reference) === normalizeAnswer(answer))) return { status: 'pass', issues: [] }
  if (question.mode === 'recognition') return { status: 'error', issues: [{ type: question.checks[0].type, message: question.explanation }] }
  const issues = (question.traps ?? []).filter(trap => new RegExp(trap.pattern, 'i').test(answer)).map(({ type, message }) => ({ type, message }))
  // Unknown paraphrases are not wrong merely because they differ from a reference.
  return { status: issues.length ? 'error' : 'unverified', issues }
}

export function skillProgress(skill: Skill, attempts: Attempt[], now = Date.now()) {
  const history = attempts.filter(item => item.skillId === skill.id && item.at <= now).sort((a, b) => a.at - b.at)
  const failures = history.filter(item => item.feedback.status === 'error')
  const lastFailure = failures.at(-1)?.at ?? 0
  const successful = history.filter(item => item.at > lastFailure && item.mode === 'independent' && item.feedback.status === 'pass')
  const days = new Set<string>(), questionIds = new Set<string>()
  let independentDays = 0
  let previousEvidenceAt = -Infinity
  for (const attempt of successful) {
    const date = localDateKey(new Date(attempt.at))
    if (!days.has(date) && !questionIds.has(attempt.questionId) && attempt.at - previousEvidenceAt >= DAY) { independentDays++; days.add(date); questionIds.add(attempt.questionId); previousEvidenceAt = attempt.at }
  }
  const last = history.at(-1)
  const interval = last?.feedback.status === 'error' ? 10 * 60_000 : Math.min(14, 2 ** Math.min(independentDays, 4)) * DAY
  const nextReviewAt = last ? last.at + interval : now
  return { errors: failures.length, independentDays, nextReviewAt, due: nextReviewAt <= now, stage: independentDays >= 2 ? '可增加难度' : '继续巩固', priority: skill.priority * 10 + Math.min(failures.length, 10) * 5 }
}

export function nextQuestion(pool: Question[], state: WritingState, skillId?: string, maxDifficulty = 1) {
  const candidates = pool.filter(question => (!skillId || question.skillId === skillId) && (question.difficulty ?? 1) <= maxDifficulty)
  const visited = new Set(state.attempts.map(item => item.questionId))
  return candidates.find(question => !visited.has(question.id)) ?? [...candidates].sort((a, b) => {
    const last = (id: string) => Math.max(0, ...state.attempts.filter(item => item.questionId === id).map(item => item.at))
    return last(a.id) - last(b.id)
  })[0]
}

export function mergeWriting(...states: (WritingState | undefined)[]): WritingState {
  const attempts = new Map<string, Attempt>(), drafts: WritingState['drafts'] = {}
  for (const state of states) {
    for (const attempt of state?.attempts ?? []) if (!attempts.has(attempt.id)) attempts.set(attempt.id, attempt)
    for (const [key, draft] of Object.entries(state?.drafts ?? {})) if (!drafts[key] || draft.updatedAt >= drafts[key].updatedAt) drafts[key] = draft
  }
  return { version: 1, attempts: [...attempts.values()].sort((a, b) => a.at - b.at), drafts }
}

export const wordCount = (text: string) => text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length ?? 0
