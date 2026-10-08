import type { AppStats, EvidenceCount, VocabWord, WordProgress } from '../types'
import { emptyEvidence } from './memoryEvidence'
import { getDueReviewWords, isLeech, isMastered, isWeak } from './srs'
import { localDateKey } from './studyStats'

function ratio(successes: number, attempts: number) {
  return { successes, attempts, accuracy: attempts ? Math.round(successes / attempts * 100) : null }
}
export function memoryDiagnostics(words: VocabWord[], progress: WordProgress[], stats: AppStats, now: number) {
  const today = localDateKey(new Date(now))
  const days = (stats.dailyHistory ?? []).filter((day) => day.date <= today).slice(-90)
  const events = days.flatMap((day) => Object.values(day.wordDetails ?? {}).flatMap((detail) => detail.events ?? []))
  const trials = (source: string) => {
    const subset = events.filter((event) => event.evaluationSource === source && event.hintUsed === false && !event.shortTermPractice && event.firstAttemptOfDay === true)
    return ratio(subset.filter((event) => source === 'recognition' ? event.correct : event.rating === 'known').length, subset.length)
  }
  const activeIds = new Set(words.map((word) => word.id))
  const active = progress.filter((item) => !item.excluded && activeIds.has(item.wordId))
  const combine = (select: (e: ReturnType<typeof emptyEvidence>) => EvidenceCount) => {
    const values = active.flatMap((item) => item.evidence ? [select(item.evidence)] : [])
    return ratio(values.reduce((s, v) => s + v.successes, 0), values.reduce((s, v) => s + v.attempts, 0))
  }
  const snapshots = days.flatMap((day) => day.leechSnapshot ? [{ date: day.date, ...day.leechSnapshot }] : [])
  const baseline = snapshots.length > 1 ? snapshots[0] : null
  const currentLeeches = active.filter((item) => isWeak(item) && isLeech(item)).length
  return {
    recognition: trials('recognition'), selfReportedRecall: trials('selfReportedRecall'), verifiedRecall: trials('verifiedRecall'),
    crossDay: { selfReportedRecall: combine((e) => e.retention.selfReportedRecall), verifiedRecall: combine((e) => e.retention.verifiedRecall) },
    sevenDay: { selfReportedRecall: combine((e) => e.sevenDayRetention.selfReportedRecall), verifiedRecall: combine((e) => e.sevenDayRetention.verifiedRecall) },
    verifiedRecallWords: active.filter((item) => item.evidence?.verifiedRecall.attempts).length,
    verifiedRecallCoverage: active.some((item) => item.evidence?.verifiedRecall.attempts) ? 'observed' : 'unknown',
    schedulingConsolidatedWords: active.filter(isMastered).length,
    overdueBacklog: getDueReviewWords(words, progress, now).length,
    leeches: { currentCount: currentLeeches, baselineDate: baseline?.date ?? null, change: baseline ? currentLeeches - baseline.count : null, snapshots },
    coverage: { eventsRecorded: events.length, attemptsWithMissingEvents: Math.max(0, days.reduce((s, d) => s + d.attempts, 0) - events.length),
      statement: '首答维度使用最近90个有记录学习日的新事件；保持统计使用新证据的累计试次。旧字段未知，不把选择题、自评或短时纠正视为客观验证。未做客观验证时显示缺乏证据。' },
  }
}
