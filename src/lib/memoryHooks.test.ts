import { describe, expect, it } from 'vitest'
import { nextBatchDraft } from '../data/nextBatchDraft'
import { nextBatchDraft2 } from '../data/nextBatchDraft2'
import { seedWords } from '../data/seedWords'
import { antigravityHooks } from './antigravityHooks'
import { auditMemoryHook } from './memoryHookAudit'
import { originNebula } from './originNebula'
import { auditDraftWords } from './vocabQuality'

describe('memory hooks', () => {
  it('gives every seed word a memory hook', () => {
    const missing = seedWords.filter((word) => !word.memoryHook).map((word) => word.word)

    expect(missing).toEqual([])
  })

  it('keeps each hook concise enough for mobile cards', () => {
    for (const hook of Object.values(antigravityHooks)) {
      expect(hook.core.length).toBeLessThanOrEqual(32)
      expect(hook.cue.length).toBeLessThanOrEqual(48)
      expect(hook.personalPrompt.length).toBeLessThanOrEqual(80)
    }
  })

  it('passes the stronger usefulness audit', () => {
    const issues = Object.entries(antigravityHooks).flatMap(([word, hook]) => auditMemoryHook(word, hook))

    expect(issues).toEqual([])
  })

  it('has a word origin on every learning card', () => {
    const missing = seedWords
      .filter((word) => !word.memoryHook?.breakdown.startsWith('词源：'))
      .map((word) => word.word)

    expect(missing).toEqual([])
  })

  it('adds nebula links for key etymology families', () => {
    expect(originNebula.explicit).toContain('implicit')
    expect(originNebula.anticipate).toContain('participate')
    expect(originNebula.sustain).toContain('retain')
    expect(originNebula.include).toContain('exclude')
  })

  it('keeps the draft audit available for future batches', () => {
    expect(auditDraftWords(seedWords.map((word) => word.word), [])).toContain('draft must contain exactly 100 words, got 0')
    expect(auditDraftWords(seedWords.map((word) => word.word), [], 10)).toContain('draft must contain exactly 10 words, got 0')
  })

  it('accepts the supervised next batch before release', () => {
    const nextBatchWords = new Set(nextBatchDraft.map((word) => word.word))
    const existingWords = seedWords.map((word) => word.word).filter((word) => !nextBatchWords.has(word))

    expect(auditDraftWords(existingWords, nextBatchDraft, 10)).toEqual([])
  })

  it('accepts the second supervised batch before release', () => {
    const draftWords = new Set(nextBatchDraft2.map((word) => word.word))
    const existingWords = seedWords.map((word) => word.word).filter((word) => !draftWords.has(word))

    expect(auditDraftWords(existingWords, nextBatchDraft2, 10)).toEqual([])
  })
})
