import { expect, it } from 'vitest'
import { familiarWordBridges, withFamiliarWordBridge } from './familiarWordBridges'
import { seedWords } from './seedWords'

it('publishes the sixteen selected bridges and keeps identity and origins', () => {
  expect(Object.keys(familiarWordBridges).sort()).toEqual(['adverse', 'ascertain', 'compelling', 'compensate', 'compromise', 'concede', 'dilemma', 'discern', 'entail', 'exemption', 'fiscal', 'fraud', 'mandate', 'nuance', 'oversight', 'pervasive'])
  for (const [name, bridge] of Object.entries(familiarWordBridges)) {
    const word = seedWords.find(w => w.word === name)!
    expect(word).toMatchObject(bridge)
    expect(word.usageNote).toContain('假设')
    expect(word.usageNote).toContain('回想：')
    expect(withFamiliarWordBridge(word).id).toBe(word.id)
    expect(withFamiliarWordBridge(word).memoryHook).toBe(word.memoryHook)
    expect(word.memoryHook?.breakdown).toBeTruthy()
  }
  const other = seedWords.find(w => w.word === 'concrete')!
  expect(withFamiliarWordBridge(other)).toBe(other)
})

it('replaces ineffective hooks without claiming that scenes teach spelling or that concede requires an argument', () => {
  expect(seedWords.find(w => w.word === 'concede')?.evilHook).toContain('refute')
  expect(seedWords.find(w => w.word === 'concede')?.evilHook).not.toContain('seed')
  expect(familiarWordBridges.concede.usageNote).toContain('不要求此前一定争吵')
  expect(familiarWordBridges.ascertain.usageNote).toContain('如果认识 certain')
  expect(familiarWordBridges.pervasive.usageNote).toContain('不保证能独立想起英文')
})

it('keeps important secondary meanings and does not equate a bridge with the target', () => {
  expect(familiarWordBridges.oversight.usageNote).toContain('监督')
  expect(familiarWordBridges.compelling.usageNote).toContain('不是严格的等级公式')
  expect(familiarWordBridges.compromise.usageNote).toContain('危及安全')
  expect(familiarWordBridges.exemption.usageNote).toContain('不是被拒绝参加')
})
