/// <reference types="node" />
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import type { AudioEntry } from './listening'

describe('shipped listening recordings', () => {
  it('has a constant-rate MP3 and valid timing for every built-in word', () => {
    const directory = resolve('public/listening')
    const manifest: Record<string, AudioEntry> = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'))
    expect(Object.keys(manifest).sort()).toEqual(seedWords.map(word => word.id).sort())
    for (const word of seedWords) {
      const entry = manifest[word.id]
      expect(entry.file).toMatch(/^[a-z0-9-]+\.mp3$/)
      expect(entry.duration).toBeGreaterThan(3)
      const file = resolve(directory, entry.file)
      const bytes = readFileSync(file)
      expect(bytes[0]).toBe(255)
      expect(bytes[1] & 224).toBe(224)
      expect(Math.abs(statSync(file).size - entry.duration * 6000)).toBeLessThan(10)
    }
  })
})
