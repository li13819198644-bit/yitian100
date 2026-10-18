import { expect, it } from 'vitest'
import { familiarWordBridges, withFamiliarWordBridge } from './familiarWordBridges'
import { seedWords } from './seedWords'

it('publishes only the five approved bridges and keeps identity and origins', () => {
  expect(Object.keys(familiarWordBridges).sort()).toEqual(['compensate', 'entail', 'fiscal', 'mandate', 'nuance'])
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
