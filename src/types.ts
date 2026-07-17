export type Rating = 'known' | 'fuzzy' | 'unknown'

export type QuizMode = 'en-zh' | 'zh-en' | 'context' | 'swipe'

export type Screen = 'home' | 'learn' | 'quiz' | 'review' | 'weak' | 'settings' | 'import'

export interface VocabWord {
  id: string
  word: string
  phonetic: string
  meaning: string
  collocation: string
  example: string
  difficulty: 1 | 2 | 3 | 4 | 5
  level: 'B2' | 'C1'
}

export interface WordProgress {
  wordId: string
  nextReviewAt: number
  repetitions: number
  easeFactor: number
  lapses: number
  seen: number
  correct: number
  incorrect: number
  lastRating?: Rating
  mastered: boolean
  updatedAt: number
}

export interface AppSettings {
  dailyTarget: number
  currentLevel: 'B2' | 'C1'
}

export interface AppStats {
  todayDate: string
  todaySeen: string[]
  combo: number
  bestCombo: number
  streak: number
  lastStudyDate?: string
}
