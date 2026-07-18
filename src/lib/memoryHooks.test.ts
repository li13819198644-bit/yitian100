import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import { antigravityHooks } from './antigravityHooks'
import { auditMemoryHook } from './memoryHookAudit'

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
})
