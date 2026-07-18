import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import { antigravityHooks } from './antigravityHooks'
import { auditMemoryHook } from './memoryHookAudit'
import { originNebula } from './originNebula'
import { wordOrigins } from './wordOrigins'

describe('memory hooks', () => {
  it('covers every seed word with an antigravity draft hook', () => {
    const missing = seedWords
      .map((word) => word.word)
      .filter((word) => !antigravityHooks[word])

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

  it('has a word origin for every seed word', () => {
    const missing = seedWords
      .map((word) => word.word)
      .filter((word) => !wordOrigins[word])

    expect(missing).toEqual([])
  })

  it('adds nebula links for key etymology families', () => {
    expect(originNebula.explicit).toContain('implicit')
    expect(originNebula.anticipate).toContain('participate')
    expect(originNebula.sustain).toContain('retain')
    expect(originNebula.include).toContain('exclude')
  })
})
