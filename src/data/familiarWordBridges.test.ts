import { expect, it } from 'vitest'
import { familiarWordBridges, withFamiliarWordBridge } from './familiarWordBridges'
import { seedWords } from './seedWords'

it('publishes the twenty-two selected bridges and keeps identity and origins', () => {
  expect(Object.keys(familiarWordBridges).sort()).toEqual(['adverse', 'ascertain', 'beforehand', 'compelling', 'compensate', 'compromise', 'concede', 'concurrent', 'dilemma', 'discern', 'entail', 'exemption', 'fiscal', 'fraud', 'mandate', 'misconduct', 'nuance', 'outperform', 'oversight', 'pervasive', 'relinquish', 'volatile'])
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
  expect(seedWords.find(w => w.word === 'concede')?.evilHook).toContain('这点你对')
  expect(seedWords.find(w => w.word === 'concede')?.evilHook).not.toContain('seed')
  expect(familiarWordBridges.concede.usageNote).toContain('不要求此前一定争吵')
  expect(familiarWordBridges.ascertain.usageNote).toContain('如果认识 certain')
  expect(familiarWordBridges.pervasive.usageNote).toContain('不保证能独立想起英文')
})

it('distinguishes useful word parts from literal mistranslations', () => {
  expect(familiarWordBridges.beforehand.usageNote).toContain('不说 beforehand the meeting')
  expect(familiarWordBridges.outperform.usageNote).toContain('不用再加 than')
  expect(familiarWordBridges.misconduct.usageNote).toContain('名词“行为”')
  expect(familiarWordBridges.concurrent.usageNote).toContain('不要求起止时刻完全一样')
  expect(familiarWordBridges.volatile.usageNote).toContain('易挥发')
})

it('keeps important secondary meanings and does not equate a bridge with the target', () => {
  expect(familiarWordBridges.oversight.usageNote).toContain('监督')
  expect(familiarWordBridges.compelling.usageNote).toContain('不是严格的等级公式')
  expect(familiarWordBridges.compromise.usageNote).toContain('危及安全')
  expect(familiarWordBridges.exemption.usageNote).toContain('不是被拒绝参加')
})
