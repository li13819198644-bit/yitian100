import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppSettings, AppStats, VocabWord, WordProgress } from './types'

const fixture = vi.hoisted(() => {
  const settings: AppSettings = { dailyTarget: 5, dailyCapacity: 20, reliefMode: false, autoPronounce: false, reviewMode: 'choice', currentLevel: 'B2' }
  const words: VocabWord[] = [
    { id: 'alpha', word: 'alpha', meaning: '秘密释义一', phonetic: '/a/', collocation: 'first phrase', example: 'First example.', difficulty: 2, level: 'B2' },
    { id: 'beta', word: 'beta', meaning: '秘密释义二', phonetic: '/b/', collocation: 'second phrase', example: 'Second example.', difficulty: 2, level: 'B2' },
  ]
  return { settings, words, progress: [] as WordProgress[], stats: {} as AppStats, saveProgress: vi.fn(), saveStats: vi.fn() }
})
vi.mock('./lib/db', () => {
  const todayKey = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
  const defaultStats = () => ({ todayDate: todayKey(), todaySeen: [], combo: 0, bestCombo: 0, streak: 0 })
  return {
    defaultSettings: fixture.settings, defaultStats, todayKey,
    getWords: async () => fixture.words, getProgress: async () => fixture.progress,
    getSettings: async () => fixture.settings, getStats: async () => fixture.stats,
    getGrammarProgress: async () => [], saveProgress: fixture.saveProgress, saveStats: fixture.saveStats,
    saveWords: vi.fn(), saveSettings: vi.fn(), resetProgress: vi.fn(), saveGrammarProgress: vi.fn(),
  }
})
vi.mock('./lib/srs', async (importOriginal) => ({
  ...await importOriginal<typeof import('./lib/srs')>(),
  getNewWords: () => fixture.words, chooseReviewSession: () => fixture.words,
  chooseQuizSession: () => fixture.words, chooseWeakRotationSession: () => fixture.words,
}))
vi.mock('./lib/cloudSync', () => ({
  getCloudUser: async () => null, isCloudSyncConfigured: () => false,
  uploadLocalSnapshot: vi.fn(), restoreCloudSnapshot: vi.fn(), signInToCloud: vi.fn(),
  signOutFromCloud: vi.fn(), signUpToCloud: vi.fn(),
}))
vi.mock('./components/ListeningPlayer', () => ({ ListeningPlayer: () => null }))
import App from './App'
import { createProgress } from './lib/srs'
import { defaultStats } from './lib/db'

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  fixture.settings.reviewMode = 'choice'
  fixture.stats = defaultStats()
  fixture.progress = fixture.words.map((word) => ({ ...createProgress(word.id, Date.now() - 86_400_000), seen: 1, incorrect: 1, lapses: 2, lastRating: 'unknown' }))
  fixture.saveProgress.mockReset().mockImplementation(async (item: WordProgress) => { fixture.progress = [...fixture.progress.filter((p) => p.wordId !== item.wordId), item] })
  fixture.saveStats.mockReset().mockImplementation(async (stats: AppStats) => { fixture.stats = stats })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })
async function mount() { await act(async () => { root.render(<App />) }) }
async function click(text: string) {
  const button = [...host.querySelectorAll('button')].find((item) => item.textContent?.trim() === text)
  expect(button, text).toBeDefined()
  await act(async () => button!.click())
}
async function start(entry: string) {
  if (entry === '学习') await click('学习')
  else if (entry === '复习') { await click('复习'); await click('开始复习 2 个') }
  else if (entry === '弱词') { await click('弱词'); await click('轮换复习 2 个弱词') }
  else await click('单词回忆')
}
function expectHidden(word = fixture.words[0]) {
  const section = host.querySelector('[aria-label="单词回忆"]')
  expect(section).not.toBeNull()
  expect(section!.textContent).toContain(word.word)
  expect(section!.textContent).not.toContain(word.meaning)
  expect(section!.querySelectorAll('button')).toHaveLength(1)
  expect(host.querySelector('[role=tablist]')).toBeNull()
}
describe('actual session navigation', () => {
  for (const entry of ['学习', '复习', '弱词', '单词回忆']) {
    it(`${entry}: hides the answer, known advances, unknown opens the same word detail, and returning resumes`, async () => {
      await mount(); await start(entry)
      expectHidden()
      await click('alpha')
      expect(host.textContent).toContain('秘密释义一')
      expect(fixture.saveProgress).not.toHaveBeenCalled()
      await click('会')
      expectHidden(fixture.words[1])
      expect(fixture.saveProgress).toHaveBeenCalledOnce()
      expect(fixture.saveProgress.mock.calls[0][0]).toMatchObject({ wordId: 'alpha', lastRating: 'known' })
      await click('beta'); await click('不会')
      expect(host.textContent).toContain('单词详情')
      expect(host.querySelector('h2')?.textContent).toBe('beta')
      expect(fixture.saveProgress).toHaveBeenCalledTimes(2)
      expect(fixture.saveProgress.mock.calls[1][0]).toMatchObject({ wordId: 'beta', lastRating: 'unknown' })
      await click('继续下一个词')
      expect(host.textContent).toMatch(/本轮完成|回忆完成/)
      expect(fixture.saveProgress).toHaveBeenCalledTimes(2)
      expect(fixture.stats.dailyHistory?.[0].wordDetails?.alpha.modes.self).toEqual({ attempts: 1, correct: 1 })
    })
  }
  it('ignores the legacy advanced setting and uses the same reveal flow for weak words', async () => {
    fixture.settings.reviewMode = 'advanced'
    await mount(); await start('弱词')
    expectHidden()
    await click('alpha'); await click('不会')
    expect(host.querySelector('h2')?.textContent).toBe('alpha')
    await click('继续下一个词')
    expectHidden(fixture.words[1])
  })
  it('retains the current revealed word when storage fails, then advances after a successful retry', async () => {
    fixture.saveProgress.mockRejectedValueOnce(new Error('database failed'))
    await mount(); await start('学习'); await click('alpha'); await click('会')
    expect(host.querySelector('[role=alert]')).not.toBeNull()
    expect(host.querySelector('[aria-label="单词回忆"]')?.textContent).toContain('秘密释义一')
    await click('会')
    expectHidden(fixture.words[1])
    expect(fixture.saveStats).toHaveBeenCalledOnce()
  })
})
