import { describe, expect, it } from 'vitest'
import { reviewedRecallHooks } from '../data/reviewedRecallHooks'
import { seedWords } from '../data/seedWords'
import { buildWordShapeHook } from './wordShapeHooks'

describe('reviewed recall associations', () => {
  it('publishes all thirty reviewed associations verbatim, including preserved batches', () => {
    expect(Object.keys(reviewedRecallHooks)).toHaveLength(30)
    for (const [word, hook] of Object.entries(reviewedRecallHooks)) {
      const matches = seedWords.filter((item) => item.word === word)
      expect(matches, word).toHaveLength(1)
      expect(matches[0].evilHook, word).toBe(hook)
      expect(buildWordShapeHook(matches[0], 'old fallback'), word).toBe(hook)
      expect(hook.length, word).toBeLessThanOrEqual(60)
      expect(hook, word).toMatch(/。$/)
      expect(hook, word).toMatch(/借|看|别读/)
    }
  })

  it('keeps the learner-approved bridges outside this revision', () => {
    for (const word of ['refute', 'incentive', 'anticipate']) {
      expect(reviewedRecallHooks[word]).toBeUndefined()
    }
    expect(seedWords.find((word) => word.word === 'concede')?.evilHook).toContain('肯seed')
    expect(seedWords.find((word) => word.word === 'validate')?.evilHook).toContain('不是把date解释成证明')
  })
})
