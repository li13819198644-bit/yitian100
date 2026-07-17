import { openDB, type DBSchema } from 'idb'
import type { AppSettings, AppStats, VocabWord, WordProgress } from '../types'
import { seedWords } from '../data/seedWords'

interface WordsDb extends DBSchema {
  words: {
    key: string
    value: VocabWord
  }
  progress: {
    key: string
    value: WordProgress
  }
  meta: {
    key: string
    value: AppSettings | AppStats
  }
}

const dbPromise = openDB<WordsDb>('yitian-100-words', 1, {
  upgrade(db) {
    db.createObjectStore('words', { keyPath: 'id' })
    db.createObjectStore('progress', { keyPath: 'wordId' })
    db.createObjectStore('meta')
  },
})

export const defaultSettings: AppSettings = {
  dailyTarget: 100,
  currentLevel: 'B2',
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function defaultStats(): AppStats {
  return {
    todayDate: todayKey(),
    todaySeen: [],
    combo: 0,
    bestCombo: 0,
    streak: 0,
  }
}

export async function ensureSeedData() {
  const db = await dbPromise
  const count = await db.count('words')
  if (count === 0) {
    const tx = db.transaction('words', 'readwrite')
    await Promise.all(seedWords.map((word) => tx.store.put(word)))
    await tx.done
  }
  if (!(await db.get('meta', 'settings'))) {
    await db.put('meta', defaultSettings, 'settings')
  }
  if (!(await db.get('meta', 'stats'))) {
    await db.put('meta', defaultStats(), 'stats')
  }
}

export async function getWords() {
  await ensureSeedData()
  const db = await dbPromise
  return db.getAll('words')
}

export async function saveWords(words: VocabWord[]) {
  const db = await dbPromise
  const tx = db.transaction('words', 'readwrite')
  await Promise.all(words.map((word) => tx.store.put(word)))
  await tx.done
}

export async function getProgress() {
  const db = await dbPromise
  return db.getAll('progress')
}

export async function saveProgress(progress: WordProgress) {
  const db = await dbPromise
  await db.put('progress', progress)
}

export async function getSettings() {
  await ensureSeedData()
  const db = await dbPromise
  return ((await db.get('meta', 'settings')) as AppSettings | undefined) ?? defaultSettings
}

export async function saveSettings(settings: AppSettings) {
  const db = await dbPromise
  await db.put('meta', settings, 'settings')
}

export async function getStats() {
  await ensureSeedData()
  const db = await dbPromise
  const stats = ((await db.get('meta', 'stats')) as AppStats | undefined) ?? defaultStats()
  if (stats.todayDate !== todayKey()) {
    return { ...stats, todayDate: todayKey(), todaySeen: [], combo: 0 }
  }
  return stats
}

export async function saveStats(stats: AppStats) {
  const db = await dbPromise
  await db.put('meta', stats, 'stats')
}

export async function resetProgress() {
  const db = await dbPromise
  await db.clear('progress')
  await db.put('meta', defaultStats(), 'stats')
}
