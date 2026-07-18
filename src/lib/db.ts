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

const progressBackupKey = 'yitian100:progress'
const settingsBackupKey = 'yitian100:settings'
const statsBackupKey = 'yitian100:stats'

function readBackup<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeBackup<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // IndexedDB remains the primary store; localStorage is a best-effort backup.
  }
}

export const defaultSettings: AppSettings = {
  dailyTarget: 100,
  dailyCapacity: 160,
  currentLevel: 'B2',
}

function normalizeSettings(settings: Partial<AppSettings>): AppSettings {
  return {
    ...defaultSettings,
    ...settings,
    dailyCapacity: settings.dailyCapacity ?? Math.max(160, settings.dailyTarget ?? defaultSettings.dailyTarget),
  }
}

export function todayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  const tx = db.transaction('words', 'readwrite')
  await Promise.all(seedWords.map((word) => tx.store.put(word)))
  await tx.done
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
  const stored = await db.getAll('progress')
  const backup = readBackup<WordProgress[]>(progressBackupKey, [])
  const merged = new Map<string, WordProgress>()

  for (const item of backup) merged.set(item.wordId, item)
  for (const item of stored) {
    const existing = merged.get(item.wordId)
    if (!existing || item.updatedAt >= existing.updatedAt) {
      merged.set(item.wordId, item)
    }
  }

  const progress = Array.from(merged.values())
  if (stored.length < progress.length) {
    const tx = db.transaction('progress', 'readwrite')
    await Promise.all(progress.map((item) => tx.store.put(item)))
    await tx.done
  }
  if (progress.length) writeBackup(progressBackupKey, progress)
  return progress
}

export async function saveProgress(progress: WordProgress) {
  const db = await dbPromise
  await db.put('progress', progress)
  const backup = readBackup<WordProgress[]>(progressBackupKey, [])
  const byId = new Map(backup.map((item) => [item.wordId, item]))
  byId.set(progress.wordId, progress)
  writeBackup(progressBackupKey, Array.from(byId.values()))
}

export async function getSettings() {
  await ensureSeedData()
  const db = await dbPromise
  const backup = readBackup<AppSettings | undefined>(settingsBackupKey, undefined)
  const settings = normalizeSettings(((await db.get('meta', 'settings')) as AppSettings | undefined) ?? backup ?? defaultSettings)
  writeBackup(settingsBackupKey, settings)
  return settings
}

export async function saveSettings(settings: AppSettings) {
  const db = await dbPromise
  const normalized = normalizeSettings(settings)
  await db.put('meta', normalized, 'settings')
  writeBackup(settingsBackupKey, normalized)
}

export async function getStats() {
  await ensureSeedData()
  const db = await dbPromise
  const backup = readBackup<AppStats | undefined>(statsBackupKey, undefined)
  const stats = ((await db.get('meta', 'stats')) as AppStats | undefined) ?? backup ?? defaultStats()
  if (stats.todayDate !== todayKey()) {
    const nextStats = { ...stats, todayDate: todayKey(), todaySeen: [], combo: 0 }
    writeBackup(statsBackupKey, nextStats)
    return nextStats
  }
  writeBackup(statsBackupKey, stats)
  return stats
}

export async function saveStats(stats: AppStats) {
  const db = await dbPromise
  await db.put('meta', stats, 'stats')
  writeBackup(statsBackupKey, stats)
}

export async function resetProgress() {
  const db = await dbPromise
  await db.clear('progress')
  await db.put('meta', defaultStats(), 'stats')
  writeBackup(progressBackupKey, [])
  writeBackup(statsBackupKey, defaultStats())
}
