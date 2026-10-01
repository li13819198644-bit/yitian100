/// <reference types="node" />
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { seedWords } from '../data/seedWords'
import { spellingParts, spellingRates, type AudioEntry, type SpellingManifest } from './listening'

describe('shipped listening recordings', () => {
  it('changes only letter recordings across all ten speeds for every word', () => {
    const directory = resolve('public/listening')
    const manifest: SpellingManifest = JSON.parse(readFileSync(resolve(directory, 'segments.json'), 'utf8'))
    expect(Object.keys(manifest.words).sort()).toEqual(seedWords.map(word => word.id).sort())
    expect(spellingRates).toEqual(['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'])
    const entries: AudioEntry[] = []
    for (const word of seedWords) {
      const normal = spellingParts(manifest, word.id, '1.0')
      entries.push(manifest.words[word.id].intro, manifest.words[word.id].meaning)
      for (const speed of spellingRates) {
        const parts = spellingParts(manifest, word.id, speed)
        expect(parts[0]).toBe(normal[0])
        expect(parts.at(-1)).toBe(normal.at(-1))
        expect(parts).toHaveLength(manifest.words[word.id].letters.length + 2)
      }
    }
    expect(Object.keys(manifest.letters)).toHaveLength(26)
    for (const speeds of Object.values(manifest.letters)) {
      expect(Object.keys(speeds).sort()).toEqual([...spellingRates].sort())
      expect(speeds['0.1'].duration).toBeGreaterThan(speeds['1.0'].duration * 5)
      entries.push(...Object.values(speeds))
    }
    for (const entry of entries) {
      expect(entry.file).toMatch(/^[a-z0-9-]+\.mp3$/)
      const bytes = readFileSync(resolve(directory, entry.file))
      expect(bytes[0]).toBe(255)
      expect(bytes[1] & 224).toBe(224)
      expect(Math.abs(bytes.length - entry.duration * 6000)).toBeLessThan(10)
    }
    expect(() => spellingParts(manifest, seedWords[0].id, '1.25')).toThrow()
  })
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
