import { describe, expect, it } from 'vitest'
import { generatedBatch3 } from '../data/generatedBatch3'
import { generatedBatch4 } from '../data/generatedBatch4'
import { generatedBatch5 } from '../data/generatedBatch5'
import { generatedBatch6 } from '../data/generatedBatch6'
import { nextBatchDraft } from '../data/nextBatchDraft'
import { nextBatchDraft2 } from '../data/nextBatchDraft2'
import { seedWords } from '../data/seedWords'
import { antigravityHooks } from './antigravityHooks'
import { auditMemoryHook } from './memoryHookAudit'
import { originNebula } from './originNebula'
import { auditDraftWords } from './vocabQuality'

const supervisedBatches = [
  { name: 'nextBatchDraft', words: nextBatchDraft, expectedCount: 10 },
  { name: 'nextBatchDraft2', words: nextBatchDraft2, expectedCount: 10 },
  { name: 'generatedBatch3', words: generatedBatch3, expectedCount: 20 },
  { name: 'generatedBatch4', words: generatedBatch4, expectedCount: 21 },
  { name: 'generatedBatch5', words: generatedBatch5, expectedCount: 20 },
  { name: 'generatedBatch6', words: generatedBatch6, expectedCount: 20 },
]

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

  it('keeps precedent distinct from procedure/process', () => {
    const precedent = seedWords.find((word) => word.word === 'precedent')

    expect(precedent?.memoryHook?.core).toContain('前案')
    expect(precedent?.memoryHook?.breakdown).toContain('procedure 才是流程')
    expect(precedent?.memoryHook?.breakdown).toContain('案例')
  })

  it('keeps the draft audit available for future batches', () => {
    expect(auditDraftWords(seedWords.map((word) => word.word), [])).toContain('draft must contain exactly 100 words, got 0')
    expect(auditDraftWords(seedWords.map((word) => word.word), [], 10)).toContain('draft must contain exactly 10 words, got 0')
  })

  it('accepts each supervised batch before release', () => {
    for (const batch of supervisedBatches) {
      const draftWords = new Set(batch.words.map((word) => word.word))
      const existingWords = seedWords.map((word) => word.word).filter((word) => !draftWords.has(word))

      expect(auditDraftWords(existingWords, batch.words, batch.expectedCount), batch.name).toEqual([])
    }
  })

  it('keeps all published words globally unique', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const word of seedWords.map((item) => item.word.toLowerCase())) {
      if (seen.has(word)) duplicates.push(word)
      seen.add(word)
    }

    expect(duplicates).toEqual([])
  })
})
