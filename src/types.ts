export type Rating = 'known' | 'fuzzy' | 'unknown'
export type ReviewMode = 'choice' | 'advanced'

export type Screen = 'home' | 'learn' | 'quiz' | 'review' | 'weak' | 'settings' | 'import' | 'sync' | 'detail' | 'grammar' | 'daily' | 'listening'
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
  usageNote?: string
  etymologySource?: string
  confusions?: Array<{
    trap: string
    wrongPath: string
    correction: string
    cue: string
  }>
  difficulty: 1 | 2 | 3 | 4 | 5
  level: 'B2' | 'C1'
}

export type EvaluationSource = 'recognition' | 'selfReportedRecall' | 'verifiedRecall'
export type ReviewReason = 'meaning' | 'usage' | 'confusion' | 'form'
export interface EvidenceCount { attempts: number; successes: number }
export interface ReviewObservation {
  hintUsed: boolean | null
  responseDurationMs: number | null
  intervalSinceLastReview: number | null
  evaluationSource: EvaluationSource | null
  firstAttemptOfDay: boolean | null
  shortTermPractice: boolean
}
export interface StudyEvent extends ReviewObservation {
  at: number; rating: Rating; correct: boolean; mode: StudyMode
}
export interface MemoryEvidence {
  version: 1
  recognition: EvidenceCount
  selfReportedRecall: EvidenceCount
  verifiedRecall: EvidenceCount
  retention: { selfReportedRecall: EvidenceCount; verifiedRecall: EvidenceCount }
  sevenDayRetention: { selfReportedRecall: EvidenceCount; verifiedRecall: EvidenceCount }
  failureDays: string[]
  lastIndependentAt?: number
  lastVerifiedAt?: number
  lastVerifiedCorrect?: boolean
}
export interface InterventionRecord { reason: ReviewReason; reviewedAt: number }

export interface WordProgress {
  lastExplanationAt?: number
  evidence?: MemoryEvidence
  intervention?: InterventionRecord
  lastObservation?: ReviewObservation
  excluded?: boolean
  lastStudiedAt?: number
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

export type StudyMode = 'self' | 'choice' | 'spelling' | 'sentence' | 'recall' | 'production' | 'assisted' | 'usage'

export interface DailyStudyRecord {
  date: string
  attempts: number
  correct: number
  firstAnswers: Record<string, { correct: boolean; mode: StudyMode }>
  leechSnapshot?: { at: number; count: number }
  wordDetails?: Record<string, DailyWordDetail>
}

export interface DailyWordDetail {
  attempts: number
  correct: number
  lastCorrect: boolean
  firstTestAnswer?: { correct: boolean; mode: StudyMode }
  newWord: boolean | null
  firstAt: number
  lastAt: number
  modes: Partial<Record<StudyMode, { attempts: number; correct: number }>>
  ratings: Partial<Record<Rating, number>>
  observedFirstByMode?: Partial<Record<StudyMode, { correct: boolean }>>
  events?: StudyEvent[]
  sessions: Partial<Record<SessionKind, number>>
}

export interface GrammarDailyRecord {
  date: string
  attempts: number
  correct: number
  firstCorrect: boolean | null
  lastCorrect: boolean
  partial: boolean
  wrongOptions: Record<string, number>
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
  dailyHistory?: GrammarDailyRecord[]
}
