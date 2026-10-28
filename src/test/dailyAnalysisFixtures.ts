import { parseDailyUpload, type DailyUpload } from '../../supabase/functions/_shared/dailyAnalysis'

export function report(date = '2026-10-28', correct = true, mode = 'self', size = 10): DailyUpload {
  return parseDailyUpload({
    schemaVersion: 1, date, timeZone: 'Asia/Shanghai', preferences: { reliefMode: true, dailyTarget: 100 },
    vocabulary: { uniqueWords: size, detailCoverage: 'complete', results: Array.from({ length: size }, (_, i) => ({
      id: `word-${i}`, word: `word${i}`, meaning: '含义', firstAnswer: { correct, mode }, attempts: 1, mistakes: correct ? 0 : 1, newWord: false,
      card: { hook: '旧联想', breakdown: '已有构词依据', collocation: `word${i} phrase`, example: `A word${i} example.` },
    })) }, grammar: { questions: 0, firstCorrect: 0, firstCount: 0 },
  })
}
