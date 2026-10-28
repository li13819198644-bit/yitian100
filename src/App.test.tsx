import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppSettings, AppStats, VocabWord, WordProgress } from './types'
import type { AnalysisJob, PersonalWordCard } from './lib/dailyAnalysis'
import { analyzeDailyReports, offsetDate } from '../supabase/functions/_shared/dailyAnalysis'
import { report } from './test/dailyAnalysisFixtures'

const fixture = vi.hoisted(() => {
  const settings: AppSettings = { dailyTarget: 5, dailyCapacity: 20, reliefMode: false, autoPronounce: false, reviewMode: 'choice', currentLevel: 'B2' }
  const words: VocabWord[] = [
    { id: 'alpha', word: 'alpha', meaning: '秘密释义一', phonetic: '/a/', collocation: 'first phrase', example: 'First example.', difficulty: 2, level: 'B2' },
    { id: 'beta', word: 'beta', meaning: '秘密释义二', phonetic: '/b/', collocation: 'second phrase', example: 'Second example.', difficulty: 2, level: 'B2' },
  ]
  return { settings, words, progress: [] as WordProgress[], stats: {} as AppStats, saveProgress: vi.fn(), saveStats: vi.fn(), account: '', jobs: [] as AnalysisJob[], cards: [] as PersonalWordCard[], uploadReport: vi.fn(), loadLearning: vi.fn() }
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
  getCloudUser: async () => fixture.account ? { id: 'owner', email: fixture.account } : null, isCloudSyncConfigured: () => !!fixture.account,
  uploadLocalSnapshot: vi.fn(), restoreCloudSnapshot: vi.fn(), signInToCloud: vi.fn(),
  signOutFromCloud: vi.fn(), signUpToCloud: vi.fn(),
  uploadDailyLearningReport: fixture.uploadReport, getDailyLearningState: fixture.loadLearning,
  acceptDailyWordCard: vi.fn(), restoreOriginalWordCard: vi.fn(),
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
  fixture.settings.reliefMode = false
  fixture.settings.dailyAnalysisEnabled = true
  fixture.account = ''; fixture.jobs = []; fixture.cards = []; fixture.words.splice(2)
  localStorage.clear()
  fixture.uploadReport.mockReset()
  fixture.loadLearning.mockReset().mockImplementation(async () => ({ jobs: fixture.jobs, cards: fixture.cards }))
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
  it('uploads today from the home button and fetches the completed server analysis', async () => {
    fixture.account = 'learner@example.com'
    const date = defaultStats().todayDate
    const input = report(date, false)
    const pending = { id: 'job-1', report_date: date, revision: 1, status: 'pending', result: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as AnalysisJob
    fixture.uploadReport.mockImplementation(async () => { fixture.jobs = [pending]; return pending })
    await mount(); await click('上传今日记录')
    expect(fixture.uploadReport).toHaveBeenCalledOnce()
    expect(fixture.uploadReport.mock.calls[0][0]).toMatchObject({ date, schemaVersion: 1, vocabulary: { uniqueWords: 0 } })
    expect(host.textContent).toContain('已上传，等待分析')
    expect(host.textContent).toContain('可以关闭页面')
    fixture.jobs = [{ ...pending, status: 'completed', result: analyzeDailyReports([input], date) }]
    await click('刷新分析状态')
    expect(host.textContent).toContain('分析已完成')
    expect(host.textContent).toContain(`${offsetDate(date, 1)} 建议：15个旧词`)
    expect(fixture.saveStats).not.toHaveBeenCalled()
  })
  it('shows a missing-backend error without claiming upload success or losing local progress', async () => {
    fixture.account = 'learner@example.com'
    fixture.uploadReport.mockRejectedValue({ code: 'PGRST202' })
    const before = JSON.stringify(fixture.progress)
    await mount(); await click('上传今日记录')
    expect(host.textContent).toContain('云端日报功能尚未部署')
    expect(host.textContent).not.toContain('当天记录已上传')
    expect(JSON.stringify(fixture.progress)).toBe(before)
    expect(fixture.saveProgress).not.toHaveBeenCalled()
  })
  it('actually applies the next-day review budget and priority without revealing personal card answers', async () => {
    fixture.account = 'learner@example.com'; fixture.settings.reliefMode = true
    for (let i = 2; i < 30; i++) fixture.words.push({ ...fixture.words[0], id: `word-${i}`, word: `word${i}` })
    fixture.progress = fixture.words.map(word => ({ ...createProgress(word.id, Date.now() - 86_400_000), seen: 5, correct: 5 }))
    const yesterday = offsetDate(defaultStats().todayDate, -1)
    const result = analyzeDailyReports([report(yesterday, false)], yesterday)
    result.focusWords = [{ id: 'word-29', word: 'word29', reason: '跨天又忘', unknownDays: 2 }]
    fixture.jobs = [{ id: 'job-1', report_date: yesterday, revision: 1, status: 'completed', result, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]
    // Match this device's timezone, as would a report uploaded from the device.
    result.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    fixture.cards = [{ word_id: 'word-29', content: { wordId: 'word-29', word: 'word29', hook: '个人助记只在详情出现', example: 'A word29 example.', translation: '个人例句译文。' } }]
    await mount()
    expect(host.textContent).toContain('15个旧词')
    await click('复习 15 个')
    expect(host.querySelector('[aria-label="查看 word29 的答案"]')).not.toBeNull()
    expect(host.textContent).not.toContain('个人助记只在详情出现')
    await click('word29'); await click('不会')
    expect(host.textContent).toContain('个人助记只在详情出现')
    expect(host.textContent).toContain('个人例句译文。')
  })
  it('allows voluntary review after the relief target without stopping after one word', async () => {
    fixture.settings.reliefMode = true
    fixture.stats.todaySeen = Array.from({ length: 25 }, (_, i) => `finished-${i}`)
    await mount()
    await click('自选加练 2 个旧词')
    expectHidden()
    await click('alpha'); await click('会')
    expectHidden(fixture.words[1])
    await click('beta'); await click('会')
    expect(host.textContent).toContain('本轮完成')
    expect(fixture.saveProgress).toHaveBeenCalledTimes(2)
  })
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
