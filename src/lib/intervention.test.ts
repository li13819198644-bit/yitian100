import { describe, expect, it } from 'vitest'
import type { WordProgress } from '../types'
import { seedWords } from '../data/seedWords'
import { emptyEvidence } from './memoryEvidence'
import { interventionText, needsIntervention } from './intervention'
import { buildDailyPlan, createProgress, getDueReviewWords, getNewWords } from './srs'

const now = new Date(2026, 9, 7, 12).getTime()
const DAY = 86_400_000
describe('focused intervention and review priority', () => {
  it('offers optional intervention on observed failure days or conservatively labelled historical leeches', () => {
    const progress = createProgress('repudiate', now)
    expect(needsIntervention(progress)).toBe(false)
    expect(needsIntervention({ ...progress, evidence: { ...emptyEvidence(), failureDays: ['2026-10-06'] } })).toBe(false)
    expect(needsIntervention({ ...progress, evidence: { ...emptyEvidence(), failureDays: ['2026-10-06', '2026-10-07'] } })).toBe(true)
    expect(needsIntervention({ ...progress, lapses: 5 })).toBe(true)
    expect(needsIntervention({ ...progress, lapses: 5, excluded: true })).toBe(false)
  })
  it('explains repudiate responsibility precisely and distinguishes refute without inventing etymology', () => {
    const word = seedWords.find((word) => word.word === 'repudiate')!
    expect(interventionText(word, 'meaning')).toContain('不是用证据证明责任不存在')
    expect(interventionText(word, 'usage')).toContain('repudiate responsibility')
    for (const term of ['deny', 'reject', 'refute', 'repudiate', '用理由或证据反驳']) expect(interventionText(word, 'confusion')).toContain(term)
    expect(interventionText(word, 'form')).toContain('repu + di + ate')
    expect(interventionText(word, 'form')).toContain('仅按字形分块')
  })
  it('prioritizes high-risk due words under a 263-word backlog and still permits five new words', () => {
    const words = seedWords.slice(0, 273)
    const progress: WordProgress[] = words.slice(0, 263).map((word) => ({ ...createProgress(word.id, now - DAY), seen: 4, repetitions: 4, stability: 30, lastRating: 'known', nextReviewAt: now - 7 * DAY }))
    progress[10] = { ...progress[10], lastRating: 'unknown', lapses: 9, incorrect: 9, stability: 0.2, nextReviewAt: now - 1000 }
    const plan = buildDailyPlan(words, progress, { baseNewWordsPerDay: 200, dailyCapacity: 200, now })
    expect(plan.reviewDebt).toBe(263)
    expect(plan.dueReviewWords[0].id).toBe(words[10].id)
    expect(plan.recommendedNewCount).toBe(0)
    expect(getNewWords(words, progress, 5, now)).toHaveLength(5)
    expect(plan.forecastReviewLoad.every((count) => count === 0)).toBe(true)
    progress[10].excluded = true
    expect(getDueReviewWords(words, progress, now).some((word) => word.id === progress[10].wordId)).toBe(false)
  })
})
