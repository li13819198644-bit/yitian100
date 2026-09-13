export type Rating = 'known' | 'fuzzy' | 'unknown'
export type ReviewMode = 'choice' | 'advanced'

export type QuizMode = 'en-zh' | 'zh-en' | 'context' | 'spelling' | 'confusion' | 'swipe'

export type Screen = 'home' | 'learn' | 'quiz' | 'review' | 'weak' | 'settings' | 'import' | 'sync' | 'detail' | 'grammar'
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
  confusions?: Array<{
    trap: string
    wrongPath: string
    correction: string
    cue: string
  }>
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
  lastSuccessfulReviewAt?: number
  practiceDay?: string
  mistakesToday?: number
}

export interface AppSettings {
  dailyTarget: number
  dailyCapacity: number
  reliefMode: boolean
  autoPronounce: boolean
  reviewMode: ReviewMode
  currentLevel: 'B2' | 'C1'
}

export type StudyMode = 'self' | 'choice' | 'spelling'

export interface DailyStudyRecord {
  date: string
  attempts: number
  correct: number
  firstAnswers: Record<string, { correct: boolean; mode: StudyMode }>
}

export interface AppStats {
  todayDate: string
  todaySeen: string[]
  combo: number
  bestCombo: number
  streak: number
  lastStudyDate?: string
  dailyHistory?: DailyStudyRecord[]
}

export interface LearningSnapshot {
  schemaVersion: 1
  updatedAt: number
  progress: WordProgress[]
  settings: AppSettings
  stats: AppStats
  grammar?: GrammarProgress[]
}

export interface GrammarProgress {
  questionId: string
  attempts: number
  correct: number
  firstCorrect: boolean
  lastCorrect: boolean
  reviewStage: number
  nextReviewAt: number
  updatedAt: number
}
