export type Category = 'grammar' | 'vocabulary' | 'logic' | 'writing'
export type IssueType = 'grammar' | 'vocabulary' | 'naturalness' | 'meaning'
export interface Skill {
  id: string
  title: string
  category: Category
  priority: 1 | 2 | 3
  initial: string
  explanation: string
}
export interface Question {
  id: string
  skillId: string
  mode: 'recognition' | 'independent'
  difficulty?: 1 | 2
  prompt: string
  options?: string[]
  answer: string
  alternatives?: string[]
  explanation: string
  checks: { type: IssueType; label: string }[]
  traps?: { pattern: string; type: IssueType; message: string }[]
}
export interface Feedback {
  status: 'pass' | 'error' | 'unverified'
  issues: { type: IssueType; message: string }[]
}
export interface Attempt {
  id: string
  questionId: string
  skillId: string
  at: number
  original: string
  mode: 'recognition' | 'independent' | 'imitation'
  feedback: Feedback
  reference: string
  suggestion: string
}
export interface Draft { text: string; updatedAt: number }
export interface WritingState {
  version: 1
  attempts: Attempt[]
  drafts: Record<string, Draft>
}
export const emptyWriting = (): WritingState => ({ version: 1, attempts: [], drafts: {} })
