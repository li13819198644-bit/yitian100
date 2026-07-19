export type Rating = 'known' | 'fuzzy' | 'unknown'

export type QuizMode = 'en-zh' | 'zh-en' | 'context' | 'swipe'

export type Screen = 'home' | 'learn' | 'quiz' | 'review' | 'weak' | 'settings' | 'import'
export type SessionKind = 'learn' | 'review' | 'quiz' | 'weak'

export interface VocabWord {
  id: string
  word: string
  phonetic: string
  meaning: string
  collocation: string
  example: string
  memoryHook?: {
    core: string
    image: string
    breakdown: string
    cue: string
    personalPrompt: string
  }
  evilHook?: string
  difficulty: 1 | 2 | 3 | 4 | 5
  level: 'B2' | 'C1'
}

export interface WordProgress {
  wordId: string
  nextReviewAt: number
  repetitions: number
  easeFactor: number
  stability: number
  difficultyScore: number
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
  dailyCapacity: number
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
