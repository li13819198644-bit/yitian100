import type { AppSettings, VocabWord } from '../types'
import type { DailyReport } from './dailyReport'
import { parseDailyUpload, type CardDraft, type DailyAnalysis, type DailyUpload } from '../../supabase/functions/_shared/dailyAnalysis.ts'

export type { CardDraft, DailyAnalysis, DailyUpload }

export interface AnalysisJob {
  id: string
  report_date: string
  revision: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'superseded'
  result: DailyAnalysis | null
  created_at: string
  updated_at: string
}
export interface PersonalWordCard { word_id: string; content: CardDraft }

export function buildDailyUpload(report: DailyReport, words: VocabWord[], settings: AppSettings): DailyUpload {
  const byId = new Map(words.map(word => [word.id, word]))
  return parseDailyUpload({
    schemaVersion: 1, date: report.date, timeZone: report.timeZone,
    preferences: { reliefMode: settings.reliefMode, dailyTarget: settings.dailyTarget },
    vocabulary: {
      uniqueWords: report.vocabulary.uniqueWords, detailCoverage: report.vocabulary.detailCoverage,
      results: report.vocabulary.results.map(item => {
        const word = byId.get(item.id)
        return {
          id: item.id, word: item.word, meaning: item.meaning ?? '', firstAnswer: item.firstAnswer,
          attempts: item.detail?.attempts ?? null, mistakes: item.recordedMistakes, newWord: item.detail?.newWord ?? null,
          card: word ? { hook: word.evilHook ?? '', breakdown: word.memoryHook?.breakdown ?? '', collocation: word.collocation, example: word.example } : null,
        }
      }),
    },
    grammar: { questions: report.grammar.uniqueQuestionsRecorded, firstCount: report.grammar.firstAnswer.count, firstCorrect: report.grammar.firstAnswer.correct },
  })
}

// Apply only the plan for this exact local day. Stale results do not silently change a later day.
export function planForDate(jobs: AnalysisJob[], date: string, timeZone: string): DailyAnalysis | null {
  const latest = new Map<string, AnalysisJob>()
  for (const job of jobs) if (!latest.has(job.report_date) || latest.get(job.report_date)!.revision < job.revision) latest.set(job.report_date, job)
  return [...latest.values()].filter(job => job.status === 'completed' && job.result?.planDate === date && job.result.timeZone === timeZone && [15, 20, 25].includes(job.result.reviewWords) && Number.isInteger(job.result.newWords) && job.result.newWords >= 0 && job.result.newWords <= 5)
    .sort((a, b) => b.revision - a.revision || b.updated_at.localeCompare(a.updated_at))[0]?.result ?? null
}

export function applyPersonalCards(words: VocabWord[], cards: PersonalWordCard[]): VocabWord[] {
  const byId = new Map(cards.map(card => [card.word_id, card.content]))
  return words.map(word => {
    const card = byId.get(word.id)
    // Personal overlays affect approved memory aids; definitions and historical roots stay intact.
    return card ? { ...word, evilHook: card.hook, example: card.example, personalExampleTranslation: card.translation } : word
  })
}
