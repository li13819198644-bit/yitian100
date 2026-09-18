import type { VocabWord } from '../types'
import { auditMemoryHook } from './memoryHookAudit'

export interface DraftWord extends VocabWord {
  memoryHook: NonNullable<VocabWord['memoryHook']>
  wordOrigin: string
  nebula?: string
}

export function auditDraftWords(existingWords: string[], draft: DraftWord[], expectedCount = 100): string[] {
  const issues: string[] = []
  const existing = new Set(existingWords.map((word) => word.toLowerCase()))
  const seen = new Set<string>()

  if (draft.length !== expectedCount) {
    issues.push(`draft must contain exactly ${expectedCount} words, got ${draft.length}`)
  }

  for (const item of draft) {
    const key = item.word.toLowerCase()
    if (existing.has(key)) issues.push(`${item.word}: already exists in seed words`)
    if (seen.has(key)) issues.push(`${item.word}: duplicate in draft`)
    seen.add(key)

    if (!item.word || !item.phonetic || !item.meaning || !item.collocation || !item.example) {
      issues.push(`${item.word}: missing required vocabulary fields`)
    }
    if (!item.memoryHook) {
      issues.push(`${item.word}: missing memoryHook`)
    } else {
      issues.push(...auditMemoryHook(key, item.memoryHook))
    }
    if (!/^(词源：|构词与用法：)/.test(item.wordOrigin ?? '')) {
      issues.push(`${item.word}: explanation must be labelled 词源： or 构词与用法：`)
    }
    if (!item.collocation.toLowerCase().includes(key)) {
      issues.push(`${item.word}: collocation should include the word`)
    }
  }

  return issues
}
