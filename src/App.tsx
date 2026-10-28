import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, BookOpen, ChevronRight, Cloud, Download, Headphones, Home, NotebookPen, RotateCcw, Scissors, Settings, Upload, Volume2, X } from 'lucide-react'
import clsx from 'clsx'
import { extraReviewWords, reliefPlan, RELIEF_TARGET } from './lib/relief'
import type { AppSettings, AppStats, GrammarProgress, Screen, SessionKind, VocabWord, WordProgress } from './types'
import { GrammarPanel } from './components/GrammarPanel'
import { DailyStatsPanel } from './components/DailyStatsPanel'
import { DailyAnalysisPanel } from './components/DailyAnalysisPanel'
import { applyPersonalCards, buildDailyUpload, planForDate } from './lib/dailyAnalysis'
import { useDailyLearning } from './lib/useDailyLearning'
import { WordRecallCard } from './components/WordRecallCard'
import { WordMeaning } from './components/WordMeaning'
import { ListeningPlayer } from './components/ListeningPlayer'
import { buildDailyReport } from './lib/dailyReport'
import { grammarQuestions, grammarTopics } from './data/grammar'
import { recordGrammarAnswer } from './lib/grammar'
import {
  createProgress,
  accuracy,
  buildDailyPlan,
  chooseQuizSession,
  chooseReviewSession,
  chooseWeakRotationSession,
  getNewWords,
  insertDelayedRetry,
  isLeech,
  isMastered,
  isWeak,
  scheduleReview,
  setWordExcluded,
} from './lib/srs'
import { firstAnswerSummary, localDateOffset, recordStudyResult } from './lib/studyStats'
import {
  defaultSettings,
  defaultStats,
  getProgress,
  getGrammarProgress,
  getSettings,
  getStats,
  getWords,
  resetProgress,
  saveProgress,
  saveGrammarProgress,
  saveSettings,
  saveStats,
  saveWords,
  todayKey,
} from './lib/db'
import { parseVocabulary } from './lib/importer'
import {
  getCloudUser,
  isCloudSyncConfigured,
  restoreCloudSnapshot,
  signInToCloud,
  signOutFromCloud,
  signUpToCloud,
  uploadLocalSnapshot,
} from './lib/cloudSync'

function blankStats(): AppStats {
  return defaultStats()
}

let activeAudio: HTMLAudioElement | undefined
let audioContext: AudioContext | undefined
const audioBufferCache = new Map<string, AudioBuffer>()

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

function pronunciationUrls(word: string): string[] {
  const normalized = word.toLowerCase().replace(/[^a-z-]/g, '')
  if (!normalized) return []
  return [
    `https://api.dictionaryapi.dev/media/pronunciations/en/${normalized}-us.mp3`,
    `https://api.dictionaryapi.dev/media/pronunciations/en/${normalized}-uk.mp3`,
  ]
}

function playAudioUrl(url: string): Promise<void> {
  activeAudio?.pause()
  const audio = new Audio(url)
  activeAudio = audio
  audio.preload = 'auto'
  audio.volume = 1

  return new Promise((resolve, reject) => {
    audio.onerror = () => reject(new Error('Audio failed'))
    audio.play().then(() => resolve()).catch(reject)
  })
}

async function playWebAudioUrl(url: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Web Audio unavailable')
  }
  const AudioContextCtor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!AudioContextCtor) throw new Error('Web Audio unavailable')
  audioContext = audioContext ?? new AudioContextCtor()
  if (audioContext.state === 'suspended') await audioContext.resume()

  let buffer = audioBufferCache.get(url)
  if (!buffer) {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Audio fetch failed')
    buffer = await audioContext.decodeAudioData(await response.arrayBuffer())
    audioBufferCache.set(url, buffer)
  }

  const source = audioContext.createBufferSource()
  const gain = audioContext.createGain()
  gain.gain.value = 1
  source.buffer = buffer
  source.connect(gain)
  gain.connect(audioContext.destination)
  source.start()
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return voices.find((voice) => voice.lang === 'en-US')
    ?? voices.find((voice) => voice.lang.startsWith('en-'))
    ?? voices.find((voice) => voice.lang.startsWith('en'))
}

function waitForEnglishVoice(synthesis: SpeechSynthesis): Promise<SpeechSynthesisVoice | undefined> {
  const voice = pickEnglishVoice(synthesis.getVoices())
  if (voice) return Promise.resolve(voice)

  return new Promise((resolve) => {
    const done = () => {
      window.clearTimeout(timeoutId)
      synthesis.removeEventListener('voiceschanged', done)
      resolve(pickEnglishVoice(synthesis.getVoices()))
    }
    const timeoutId = window.setTimeout(done, 800)
    synthesis.addEventListener('voiceschanged', done)
  })
}

async function speakEnglish(text: string, options: { rate?: number } = {}): Promise<boolean> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  window.dispatchEvent(new Event('yitian:other-audio'))
  const trimmed = text.trim()
  if (!trimmed) return false
  const synthesis = window.speechSynthesis
  const voice = await waitForEnglishVoice(synthesis)
  const utterance = new SpeechSynthesisUtterance(trimmed)
  utterance.lang = 'en-US'
  if (voice) utterance.voice = voice
  utterance.rate = options.rate ?? 0.86
  utterance.pitch = 1
  utterance.volume = 1
  synthesis.cancel()
  await new Promise((resolve) => window.setTimeout(resolve, 80))
  synthesis.resume()
  synthesis.speak(utterance)
  return true
}

async function speakWord(word: string) {
  const spokenBySystemVoice = await speakEnglish(word, { rate: 0.78 })
  if (spokenBySystemVoice) return

  for (const url of pronunciationUrls(word)) {
    try {
      await playWebAudioUrl(url)
      return
    } catch {
      // Web Audio helps with iPhone silent mode, but HTML audio is a useful fallback.
    }
    try {
      await playAudioUrl(url)
      return
    } catch {
      // Some imported words will not have dictionary audio; TTS remains the final fallback.
    }
  }
  await speakEnglish(word)
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [baseWords, setWords] = useState<VocabWord[]>([])
  const [progress, setProgress] = useState<WordProgress[]>([])
  const [grammarProgress, setGrammarProgress] = useState<GrammarProgress[]>([])
  const [grammarReady, setGrammarReady] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [stats, setStats] = useState<AppStats>(blankStats)
  const [activeIndex, setActiveIndex] = useState(0)
  const [sessionWordIds, setSessionWordIds] = useState<string[]>([])
  const [sessionKind, setSessionKind] = useState<SessionKind>('learn')
  const [feedback, setFeedback] = useState<string>('')
  const [feedbackWordId, setFeedbackWordId] = useState('')
  const [detailWordId, setDetailWordId] = useState('')
  const [detailReturnScreen, setDetailReturnScreen] = useState<Screen>('home')
  const [importMessage, setImportMessage] = useState('')
  const [cloudUser, setCloudUser] = useState<string>('')
  const [cloudLogin, setCloudLogin] = useState('')
  const [cloudPassword, setCloudPassword] = useState('')
  const [cloudMessage, setCloudMessage] = useState('')
  const [cloudBusy, setCloudBusy] = useState(false)
  const learning = useDailyLearning(cloudUser)
  const words = useMemo(() => applyPersonalCards(baseWords, learning.cards), [baseWords, learning.cards])
  const answering = useRef(false)
  const [clockNow, setClockNow] = useState(Date.now)

  async function refresh() {
    const [nextWords, nextProgress, nextSettings, nextStats, nextGrammar] = await Promise.all([
      getWords(),
      getProgress(),
      getSettings(),
      getStats(),
      getGrammarProgress(),
    ])
    setWords(nextWords)
    setProgress(nextProgress)
    setSettings(nextSettings)
    setStats(nextStats)
    setGrammarProgress(nextGrammar)
    setGrammarReady(true)
  }

  useEffect(() => {
    refresh()
    getCloudUser().then((user) => setCloudUser(user?.email ?? '')).catch(() => setCloudUser(''))
    const updateClock = () => setClockNow(Date.now())
    const timer = window.setInterval(updateClock, 30_000)
    window.addEventListener('focus', updateClock)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', updateClock)
    }
  }, [])

  async function syncCloudQuietly() {
    if (!cloudUser) return
    try {
      await uploadLocalSnapshot()
      setCloudMessage('已自动云同步')
    } catch {
      setCloudMessage('自动云同步失败，本地进度已保存')
    }
  }

  async function answerGrammar(id: string, correct: boolean, selectedOption: number) {
    const current = await getGrammarProgress()
    const item = recordGrammarAnswer(id, correct, current.find((entry) => entry.questionId === id), Date.now(), selectedOption)
    const saved = await saveGrammarProgress([item])
    setGrammarProgress(saved)
    setClockNow(Date.now())
    void syncCloudQuietly()
  }

  const progressMap = useMemo(() => new Map(progress.map((item) => [item.wordId, item])), [progress])
  const wordMap = useMemo(() => new Map(words.map((item) => [item.id, item])), [words])
  const excludedWords = useMemo(() => words.filter(word => progressMap.get(word.id)?.excluded), [words, progressMap])
  const availableWords = useMemo(() => words.filter(word => !progressMap.get(word.id)?.excluded), [words, progressMap])
  const personalPlan = settings.dailyAnalysisEnabled !== false ? planForDate(learning.jobs, todayKey(new Date(clockNow)), Intl.DateTimeFormat().resolvedOptions().timeZone) : null
  const reliefTarget = personalPlan?.reviewWords ?? RELIEF_TARGET
  const reliefOptions = { target: reliefTarget, focusIds: personalPlan?.focusWords.map(word => word.id), oldOnly: !!personalPlan }
  const todayNewWords = Object.values(stats.dailyHistory?.find(day => day.date === todayKey(new Date(clockNow)))?.wordDetails ?? {}).filter(word => word.newWord === true).length
  const personalNewRemaining = personalPlan ? Math.max(0, Math.min(settings.dailyTarget, personalPlan.newWords) - todayNewWords) : null
  const dailyPlan = useMemo(
    () => buildDailyPlan(words, progress, {
      baseNewWordsPerDay: settings.dailyTarget,
      dailyCapacity: settings.dailyCapacity,
      reviewCap: personalPlan?.reviewWords,
      now: clockNow,
    }),
    [words, progress, settings.dailyTarget, settings.dailyCapacity, clockNow, personalPlan?.reviewWords],
  )
  const reliefActive = settings.reliefMode
  const guidedReview = reliefActive || !!personalPlan
  const [extraPractice, setExtraPractice] = useState(false)
  const relief = reliefPlan(words, progress, stats, clockNow, reliefOptions)
  const extraWords = extraReviewWords(words, progress, false, clockNow)
  const recommendedNewCount = reliefActive ? 0 : Math.min(dailyPlan.recommendedNewCount, personalNewRemaining ?? Infinity)
  const sessionWords = useMemo(
    () => sessionWordIds.map((id) => wordMap.get(id)).filter((word): word is VocabWord => Boolean(word)),
    [sessionWordIds, wordMap],
  )
  const reviewWords = guidedReview ? relief.words.length ? relief.words : extraWords : dailyPlan.dueReviewWords
  const weakWords = useMemo(() => words.filter((word) => {
    const item = progressMap.get(word.id)
    return item ? isWeak(item) : false
  }), [words, progressMap])
  const weakSessionWords = reliefActive ? relief.words : chooseWeakRotationSession(words, progress, 30, clockNow)
  const unlearnedCount = getNewWords(words, progress).length
  const gentleNewWordCount = Math.min(10, unlearnedCount, personalNewRemaining ?? Infinity)
  // Derive this so existing local/cloud progress benefits from improved criteria
  // without requiring a destructive data migration.
  const mastered = progress.filter(isMastered).length
  const stubbornWords = weakWords.filter((word) => {
    const item = progressMap.get(word.id)
    return item ? isLeech(item) : false
  }).length
  const studiedTodayIds = new Set(stats.todayDate === todayKey() ? stats.todaySeen : [])
  for (const item of progress) if (item.seen > 0 && todayKey(new Date(item.lastStudiedAt ?? item.updatedAt)) === todayKey()) studiedTodayIds.add(item.wordId)
  const todayProgress = studiedTodayIds.size
  const todayAccuracy = accuracy(progress)
  const todayFirstAnswers = firstAnswerSummary(stats.dailyHistory?.find((entry) => entry.date === todayKey()))
  const activeWord = sessionWords[activeIndex]
  const detailWord = detailWordId ? wordMap.get(detailWordId) : undefined
  const cutTarget = screen === 'detail' ? detailWord : screen === 'learn' || screen === 'quiz' ? activeWord : undefined

  async function changeExcluded(word: VocabWord, excluded: boolean) {
    if (answering.current) return
    answering.current = true
    try {
      const updated = setWordExcluded(progressMap.get(word.id) ?? createProgress(word.id), excluded)
      await saveProgress(updated)
      setProgress(items => [...items.filter(item => item.wordId !== word.id), updated])
      if (excluded) {
        window.speechSynthesis?.cancel()
        const inSession = (screen === 'learn' || screen === 'quiz') && activeWord?.id === word.id
        const nextIds = sessionWordIds.filter((id, index) => id !== word.id || index < activeIndex || (inSession && index === activeIndex))
        setSessionWordIds(nextIds)
        if (inSession) {
          setActiveIndex(activeIndex + 1)
          if (screen === 'learn') autoSpeakSessionWord(nextIds, activeIndex + 1)
        }
      }
      setClockNow(Date.now())
      setFeedback(`${word.word}：${excluded ? '已斩，不再安排学习' : '已恢复学习'}`)
      setFeedbackWordId(word.id)
      void syncCloudQuietly()
    } catch { setFeedback('保存斩词状态失败，请重试。'); setFeedbackWordId('') }
    finally { answering.current = false }
  }

  function openWordDetail(wordId: string, returnScreen: Screen = screen) {
    if (!wordMap.has(wordId)) return
    setDetailWordId(wordId)
    setDetailReturnScreen(returnScreen === 'detail' ? 'home' : returnScreen)
    setScreen('detail')
  }

  function autoSpeakSessionWord(nextIds: string[], nextIndex: number, kind: SessionKind = sessionKind) {
    if (!settings.autoPronounce || kind === 'quiz') return
    const nextId = nextIds[nextIndex]
    const nextWord = nextId ? wordMap.get(nextId) : undefined
    if (nextWord) void speakWord(nextWord.word)
  }

  function startLearnSession(options: { limit?: number } = {}) {
    if (reliefActive) { startReliefSession(); return }
    const target = Math.min(options.limit ?? settings.dailyTarget, personalNewRemaining ?? Infinity)
    if (target === 0) { setFeedback('今日建议新词量已完成，可以复习旧词。'); setFeedbackWordId(''); return }
    // Voluntary new-word practice remains available within the active personal plan.
    const nextWords = getNewWords(words, progress, target, Date.now())
    if (!nextWords.length) {
      setFeedback('现在没有未学新词。可以先复习，或导入新词。')
      setFeedbackWordId('')
      setScreen('home')
      return
    }
    setSessionWordIds(nextWords.map((word) => word.id))
    setActiveIndex(0)
    setSessionKind('learn')
    setScreen('learn')
    autoSpeakSessionWord(nextWords.map((word) => word.id), 0, 'learn')
  }

  function startReviewSession(nextScreen: Screen = 'learn', limit?: number) {
    if (guidedReview) { startReliefSession(); return }
    const nextWords = chooseReviewSession(words, progress, {
      baseNewWordsPerDay: settings.dailyTarget,
      dailyCapacity: settings.dailyCapacity,
      reviewCap: limit,
    })
    if (!nextWords.length) {
      setScreen('review')
      return
    }
    setSessionWordIds(nextWords.map((word) => word.id))
    setActiveIndex(0)
    setSessionKind('review')
    setScreen(nextScreen)
    autoSpeakSessionWord(nextWords.map((word) => word.id), 0, 'review')
  }

  function startQuizSession() {
    if (reliefActive) { startReliefSession(); return }
    const nextWords = chooseQuizSession(words, progress, {
      baseNewWordsPerDay: settings.dailyTarget,
      dailyCapacity: settings.dailyCapacity,
      quizSize: reliefActive ? 10 : 20,
    })
    if (!nextWords.length) {
      setFeedback('今天先休息，冷却中的词明天再测。')
      setFeedbackWordId('')
      setScreen('home')
      return
    }
    setSessionWordIds(nextWords.map((word) => word.id))
    setActiveIndex(0)
    setSessionKind('quiz')
    setScreen('quiz')
  }

  function startWeakPracticeSession(nextScreen: Screen = 'learn', requestedLimit?: number) {
    if (reliefActive) { startExtraPractice(true); return }
    const limit = requestedLimit ?? (reliefActive ? 10 : 30)
    const nextWords = chooseWeakRotationSession(words, progress, limit)
    if (!nextWords.length) {
      setFeedback('这批弱词正在间隔休息，稍后再练。单词详情仍可查看。')
      setFeedbackWordId('')
      setScreen('weak')
      return
    }
    setSessionWordIds(nextWords.map((word) => word.id))
    setActiveIndex(0)
    setSessionKind('weak')
    setScreen(nextScreen)
    autoSpeakSessionWord(nextWords.map((word) => word.id), 0, 'weak')
  }

  function startExtraPractice(weakOnly = false) {
    const selected = extraReviewWords(words, progress, weakOnly)
    if (!selected.length) { setScreen(weakOnly ? 'weak' : 'review'); return }
    const ids = selected.map(w => w.id)
    setExtraPractice(true)
    setSessionWordIds(ids)
    setActiveIndex(0)
    setSessionKind(weakOnly ? 'weak' : 'review')
    setScreen('learn')
    autoSpeakSessionWord(ids, 0, 'review')
  }

  function startReliefSession() {
    const plan = reliefPlan(words, progress, stats, Date.now(), reliefOptions)
    if (!plan.words.length) {
      startExtraPractice()
      return
    }
    setExtraPractice(false)
    const ids = plan.words.map(w => w.id)
    setSessionWordIds(ids)
    setActiveIndex(0)
    setSessionKind('review')
    setScreen('learn')
    autoSpeakSessionWord(ids, 0, 'review')
  }

  async function rateWord(word: VocabWord, rating: 'known' | 'unknown', returnScreen: 'learn' | 'quiz') {
    if (progressMap.get(word.id)?.excluded || answering.current) return false
    answering.current = true
    try {
      const now = Date.now()
      const correct = rating === 'known'
      const updated = scheduleReview(progressMap.get(word.id) ?? createProgress(word.id), rating, now)
      const nextStats = recordStudyResult(stats, word.id, correct, 'self', now, { rating, session: sessionKind, isNew: !(progressMap.get(word.id)?.seen) })
      const reachedGuidedQuota = guidedReview && !extraPractice && sessionKind === 'review' && reliefPlan(words, [...progress.filter(item => item.wordId !== word.id), updated], nextStats, now, reliefOptions).done
      const nextIds = reachedGuidedQuota
        ? sessionWordIds.slice(0, activeIndex + 1)
        : insertDelayedRetry(sessionWordIds, activeIndex, word.id, rating)
      await saveProgress(updated)
      await saveStats(nextStats)
      setProgress((items) => [...items.filter((item) => item.wordId !== word.id), updated])
      setStats(nextStats)
      setClockNow(now)
      setSessionWordIds(nextIds)
      setFeedback(`${word.word}: ${correct ? '会' : '不会，已安排复习'}`)
      setFeedbackWordId(word.id)
      setActiveIndex(activeIndex + 1)
      if (!correct) {
        setDetailWordId(word.id)
        setDetailReturnScreen(returnScreen)
        setScreen('detail')
      } else if (returnScreen === 'learn') {
        autoSpeakSessionWord(nextIds, activeIndex + 1)
      }
      void syncCloudQuietly()
      return true
    } catch {
      setFeedback('保存失败，请重新点击会 / 不会。')
      setFeedbackWordId('')
      return false
    } finally { answering.current = false }
  }

  async function importFile(file?: File) {
    if (!file) return
    try {
      const imported = parseVocabulary(await file.text(), file.name)
      await saveWords(imported)
      setImportMessage(`已导入 ${imported.length} 个词`)
      await refresh()
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : '导入失败')
    }
  }

  async function updateDailyTarget(value: number) {
    const dailyTarget = Math.max(0, Math.min(200, value))
    const next = { ...settings, dailyTarget, dailyCapacity: Math.max(settings.dailyCapacity, dailyTarget) }
    setSettings(next)
    await saveSettings(next)
    void syncCloudQuietly()
  }

  async function updateReliefMode(reliefMode: boolean) {
    const next = { ...settings, reliefMode }
    setSettings(next)
    await saveSettings(next)
    void syncCloudQuietly()
  }

  async function updateAutoPronounce(autoPronounce: boolean) {
    const next = { ...settings, autoPronounce }
    setSettings(next)
    await saveSettings(next)
    void syncCloudQuietly()
  }

  function continueFromWordDetail() {
    setScreen(detailReturnScreen)
    if (detailReturnScreen === 'learn') {
      autoSpeakSessionWord(sessionWordIds, activeIndex)
    }
  }

  async function signInOrUp(mode: 'in' | 'up') {
    setCloudBusy(true)
    setCloudMessage('')
    try {
      const auth = mode === 'in'
        ? await signInToCloud(cloudLogin, cloudPassword)
        : await signUpToCloud(cloudLogin, cloudPassword)

      if (!auth.session || !auth.user) {
        setCloudUser('')
        setCloudMessage('账号已创建，但还没有登录 session。请先确认邮箱，或在 Supabase Auth 里关闭邮箱确认后再注册/登录。')
        return
      }

      setCloudUser(auth.user.email ?? cloudLogin)
      setCloudMessage(mode === 'in' ? '已登录，之后学习会自动同步' : '账号已创建并登录，之后学习会自动同步')
      await uploadLocalSnapshot()
      setCloudMessage(mode === 'in' ? '已登录，并已上传本机进度' : '账号已创建并登录，已上传本机进度')
    } catch (error) {
      setCloudMessage(error instanceof Error ? error.message : '云同步操作失败')
    } finally {
      setCloudBusy(false)
    }
  }

  async function uploadCloudNow() {
    setCloudBusy(true)
    setCloudMessage('')
    try {
      const snapshot = await uploadLocalSnapshot()
      setCloudMessage(`已上传 ${snapshot.progress.length} 条进度`)
    } catch (error) {
      setCloudMessage(error instanceof Error ? error.message : '上传失败')
    } finally {
      setCloudBusy(false)
    }
  }

  function uploadToday() {
    if (!cloudUser || !isCloudSyncConfigured()) { setScreen('sync'); return }
    try {
      const now = Date.now()
      setClockNow(now); setScreen('daily')
      void learning.upload(buildDailyUpload(buildDailyReport(baseWords, progress, stats, grammarProgress, now), baseWords, settings))
    } catch { setFeedback('当天记录未能整理，请重新读取后上传。本机记录已保留。'); setFeedbackWordId('') }
  }

  async function restoreCloudNow() {
    setCloudBusy(true)
    setCloudMessage('')
    try {
      const snapshot = await restoreCloudSnapshot()
      if (!snapshot) {
        setCloudMessage('云端还没有进度')
      } else {
        await refresh()
        setCloudMessage(`已从云端恢复 ${snapshot.progress.length} 条进度`)
      }
    } catch (error) {
      setCloudMessage(error instanceof Error ? error.message : '恢复失败')
    } finally {
      setCloudBusy(false)
    }
  }

  async function signOutCloudNow() {
    setCloudBusy(true)
    try {
      await signOutFromCloud()
      setCloudUser('')
      setCloudMessage('已退出登录')
    } catch (error) {
      setCloudMessage(error instanceof Error ? error.message : '退出失败')
    } finally {
      setCloudBusy(false)
    }
  }

  function exportLearningReport() {
    const now = Date.now()
    const learnedIds = new Set(progress.filter(item => item.seen > 0).map((item) => item.wordId))
    const weakIds = new Set(weakWords.map((word) => word.id))
    const report = {
      schemaVersion: 1,
      app: '一天100词',
      exportedAt: new Date(now).toISOString(),
      dailyReport: buildDailyReport(words, progress, stats, grammarProgress, now),
      summary: {
        totalWords: words.length,
        learnedWords: learnedIds.size,
        unlearnedWords: unlearnedCount,
        excludedWords: excludedWords.length,
        masteredWords: mastered,
        weakWords: weakWords.length,
        stubbornWords,
        dueReviewWords: dailyPlan.reviewDebt,
        recommendedNewWords: dailyPlan.recommendedNewCount,
        tomorrowReviews: dailyPlan.forecastReviewLoad[1] ?? 0,
        sevenDayPeak: Math.max(0, ...dailyPlan.forecastReviewLoad),
        accuracy: todayAccuracy,
        todayFirstAnswer: todayFirstAnswers,
        combo: stats.combo,
        streak: stats.streak,
      },
      forecast: dailyPlan.forecastReviewLoad.map((count, index) => ({
        date: todayKey(localDateOffset(now, index)),
        dueCount: count,
      })),
      weakWords: weakWords.map((word) => ({
        word: word.word,
        meaning: word.meaning,
        progress: progressMap.get(word.id),
      })),
      words: words.map((word) => ({
        id: word.id,
        word: word.word,
        meaning: word.meaning,
        level: word.level,
        difficulty: word.difficulty,
        learned: learnedIds.has(word.id),
        weak: weakIds.has(word.id),
        progress: progressMap.get(word.id) ?? null,
      })),
      settings,
      stats,
      measurement: {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        firstAnswerHistory: '仅记录更新后最近90个学习日；重复纠正不覆盖当天首答，mode区分自评、选择、拼写、组句、无选项词义回忆、无选项英文输入、提示作答及表达自评。',
        forecast: '按本地自然日统计尚未到期的已排程单词；不包含旧积压和未来答错产生的重测。',
      },
      grammar: {
        totalQuestions: grammarQuestions.length,
        progress: grammarProgress,
        topics: grammarTopics.map((topic) => ({ id: topic.id, title: topic.title, questionIds: topic.questions.map((question) => question.id) })),
        measurement: '语法独立计数；firstCorrect 是该题第一次作答结果，重复答对不会改写首次正确率。',
      },
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `yitian100-learning-report-${todayKey()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-dvh bg-[#f7f4ef] text-stone-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-[calc(136px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-3 py-2">
          {feedback && screen !== 'detail' ? feedbackWordId ? (
            <button type="button" className="flex min-h-12 min-w-0 flex-1 items-center justify-between rounded-lg bg-stone-950 px-3 py-3 text-left text-sm text-white" onClick={() => openWordDetail(feedbackWordId)} aria-label={`打开上一个单词 ${feedbackWordId} 的详情`}>
              <span className="min-w-0 break-words">上一个：{feedback}</span>
              <ChevronRight className="ml-2 shrink-0" size={18} />
            </button>
          ) : <p role="status" className="min-w-0 flex-1 rounded-lg bg-stone-950 p-3 text-sm text-white">{feedback}</p> : <div>
            {screen !== 'grammar' && <p className="text-sm text-stone-500">iPhone 离线背词</p>}
            <h1 className={`${screen === 'grammar' ? 'text-2xl' : 'text-3xl'} font-semibold tracking-normal`}>一天100词</h1>
          </div>}
          <button className="icon-button" onClick={() => setScreen('settings')} aria-label="设置">
            <Settings size={22} />
          </button>
        </header>
        {(cutTarget || (feedbackWordId && progressMap.get(feedbackWordId)?.excluded && screen !== 'detail')) && <div className="mb-2 flex items-center justify-between gap-3">
          <div>{feedbackWordId && progressMap.get(feedbackWordId)?.excluded && screen !== 'detail' && <button className="flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-800" onClick={() => { const word = wordMap.get(feedbackWordId); if (word) void changeExcluded(word, false) }}><RotateCcw size={18} />撤销斩词</button>}</div>
          {cutTarget && <button className="flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 font-semibold text-stone-700 ring-1 ring-stone-200" title={progressMap.get(cutTarget.id)?.excluded ? '恢复学习' : '太简单，不再安排学习'} onClick={() => void changeExcluded(cutTarget, !progressMap.get(cutTarget.id)?.excluded)}>{progressMap.get(cutTarget.id)?.excluded ? <><RotateCcw size={18} />恢复学习</> : <><Scissors size={18} />斩</>}</button>}
        </div>}

        {screen === 'grammar' && <GrammarPanel progress={grammarProgress} ready={grammarReady} onAnswer={answerGrammar} />}
        <ListeningPlayer words={availableWords} due={dailyPlan.dueReviewWords} weak={weakWords} learned={availableWords.filter(word => (progressMap.get(word.id)?.seen ?? 0) > 0)} visible={screen === 'listening'} />
        {screen === 'daily' && <DailyStatsPanel report={buildDailyReport(words, progress, stats, grammarProgress, clockNow)} ready={grammarReady} onBack={() => setScreen('home')} analysis={<DailyAnalysisPanel
          date={todayKey(new Date(clockNow))} ready={grammarReady} configured={isCloudSyncConfigured()} signedIn={!!cloudUser}
          job={learning.jobs.find(job => job.report_date === todayKey(new Date(clockNow)))} previousJob={learning.jobs.find(job => job.status === 'completed')}
          cards={learning.cards} busy={learning.busy} message={learning.message}
          onUpload={uploadToday}
          onLogin={() => setScreen('sync')} onRefresh={() => void learning.reload()} onAccept={(jobId, wordId) => void learning.accept(jobId, wordId)} onRestore={wordId => void learning.restore(wordId)}
        />} />}

        {screen === 'home' && (
          <section className="space-y-4">
            <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-stone-500">今日练习量</p>
                  <p className="mt-1 text-4xl font-semibold">{todayProgress}{guidedReview ? ` / ${reliefTarget + (reliefActive ? 0 : personalPlan?.newWords ?? 0)}` : ''}</p>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">B2 → C1</span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-stone-100">
                <div className="h-3 rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (todayProgress / (guidedReview ? reliefTarget + (reliefActive ? 0 : personalPlan?.newWords ?? 0) : Math.max(1, settings.dailyCapacity))) * 100)}%` }} />
              </div>
            </div>

            {reliefActive && (
              <div className="rounded-lg bg-emerald-50 p-5 shadow-sm ring-1 ring-emerald-100">
                <p className="text-sm font-medium text-emerald-800">减负模式</p>
                <p className="mt-2 text-2xl font-semibold text-stone-950">{relief.done || !relief.words.length ? '今日安排已完成' : `今天建议再做 ${relief.remaining} 个`}</p>
                <p className="mt-2 leading-6 text-stone-600">新词已暂停。{personalPlan ? personalPlan.reason : relief.done || !relief.words.length ? '可以休息，也可以自选加练。' : '每日建议 25 个旧词，优先兼顾近期到期词，不用补齐积压。'}</p>
              </div>
            )}
            {personalPlan && <p className="rounded-lg bg-white p-4 text-sm leading-6 ring-1 ring-stone-200">今日安排已按 {personalPlan.sourceDate} 的分析更新：{personalPlan.reviewWords}个旧词、{reliefActive ? 0 : Math.min(settings.dailyTarget, personalPlan.newWords)}个新词。{!reliefActive && personalPlan.reason}复习顺序兼顾近期到期词和反复不会的词。</p>}

            <div className="grid gap-3">
              <PrimaryButton
                disabled={guidedReview && !reviewWords.length}
                onClick={guidedReview ? startReliefSession : dailyPlan.reviewDebt ? () => startReviewSession('learn') : recommendedNewCount ? () => startLearnSession() : () => startWeakPracticeSession('learn')}
                icon={<BookOpen size={20} />}
                label={guidedReview ? relief.words.length ? `复习 ${relief.words.length} 个` : extraWords.length ? `自选加练 ${extraWords.length} 个旧词` : '暂无已学词' : dailyPlan.reviewDebt ? '先清复习' : recommendedNewCount ? '学习新词' : '修复弱词'}
              />
              {!reliefActive && gentleNewWordCount > 0 && (
                <SecondaryButton onClick={() => startLearnSession({ limit: gentleNewWordCount })} icon={<BookOpen size={20} />} label={`学 ${gentleNewWordCount} 个新词`} />
              )}
              {!reliefActive && <SecondaryButton onClick={startQuizSession} icon={<BarChart3 size={20} />} label="单词回忆" />}
              <SecondaryButton onClick={() => setScreen('listening')} icon={<Headphones size={20} />} label="听词复习 · MP3" />
              <SecondaryButton onClick={() => { setClockNow(Date.now()); setFeedback(''); setFeedbackWordId(''); setScreen('daily') }} icon={<BarChart3 size={20} />} label="当天学习统计" />
              <SecondaryButton disabled={!grammarReady || learning.busy} onClick={uploadToday} icon={<Upload size={20} />} label={learning.busy ? '正在上传学习记录…' : '上传今日记录'} />
            </div>

            <details><summary className="min-h-11 cursor-pointer py-3 font-medium">学习详情与复习存量</summary><div className="grid grid-cols-2 gap-3">
              <Metric label="词库总量" value={words.length} />
              <Metric label="未学新词" value={unlearnedCount} />
              <Metric label="待复习总数" value={dailyPlan.reviewDebt} />
              <Metric label="今日首答" value={todayFirstAnswers.accuracy === null ? '待记录' : `${todayFirstAnswers.accuracy}% · ${todayFirstAnswers.count}词`} />
              <Metric label="建议新词" value={recommendedNewCount} />
              <Metric label="明日新增到期" value={dailyPlan.forecastReviewLoad[1] ?? 0} />
              <Metric label="累计答对率" value={`${todayAccuracy}%`} />
              <Metric label="Combo" value={stats.combo} />
              <Metric label="连续学习" value={`${stats.streak} 天`} />
              <Metric label="已掌握" value={mastered} />
              <Metric label="弱词" value={weakWords.length} />
              <Metric label="顽固词" value={stubbornWords} />
            </div></details>

          </section>
        )}

        {screen === 'learn' && activeWord && activeIndex < sessionWords.length && (
          <WordRecallCard key={`${activeIndex}:${activeWord.id}`} word={activeWord}
            title={sessionKind === 'learn' ? '新词学习' : sessionKind === 'weak' ? '弱词复习' : '到期复习'}
            position={activeIndex + 1} total={sessionWords.length}
            onRate={(rating) => rateWord(activeWord, rating, 'learn')} />
        )}

        {screen === 'learn' && sessionWords.length > 0 && activeIndex >= sessionWords.length && (
          <DoneCard title="本轮完成" subtitle={reliefActive ? '今天先到这里，剩余单词留到之后。' : `本轮练习 ${new Set(sessionWordIds).size} 个词。`} onFinish={() => setScreen('home')} onRestart={reliefActive ? undefined : sessionKind === 'review' ? () => startReviewSession('learn') : sessionKind === 'weak' ? startWeakPracticeSession : () => startLearnSession()} />
        )}

        {screen === 'quiz' && activeWord && activeIndex < sessionWords.length && (
          <WordRecallCard key={`${activeIndex}:${activeWord.id}`} word={activeWord} title="单词回忆"
            position={activeIndex + 1} total={sessionWords.length}
            onRate={(rating) => rateWord(activeWord, rating, 'quiz')} />
        )}

        {screen === 'quiz' && sessionWords.length > 0 && activeIndex >= sessionWords.length && (
          <DoneCard title="回忆完成" subtitle="本轮回忆结束。不会的词已安排复习。" onFinish={() => setScreen('home')} onRestart={startQuizSession} />
        )}

        {screen === 'review' && (
          <section className="space-y-3">
            <PrimaryButton disabled={!reviewWords.length} onClick={() => startReviewSession('learn')} icon={<RotateCcw size={20} />} label={reviewWords.length ? `开始复习 ${reviewWords.length} 个` : reliefActive ? '今日安排已完成' : '暂无到期复习'} />
            <WordList title="复习队列" words={reviewWords} progressMap={progressMap} onOpen={openWordDetail} empty="现在没有到期复习词。" />
          </section>
        )}
        {screen === 'weak' && (
          <section className="space-y-3">
            <PrimaryButton disabled={reliefActive ? !weakWords.length : !weakSessionWords.length} onClick={() => startWeakPracticeSession('learn')} icon={<RotateCcw size={20} />} label={reliefActive && weakWords.length ? '自选加练弱词' : weakSessionWords.length ? `轮换复习 ${weakSessionWords.length} 个弱词` : weakWords.length ? '弱词正在间隔休息' : '暂无弱词'} />
            <WordList title="弱词本" words={weakWords} progressMap={progressMap} onOpen={openWordDetail} empty="还没有弱词。" />
          </section>
        )}

        {screen === 'settings' && (
          <section className="space-y-4">
            <Panel title="设置">
              <p className="text-sm font-medium text-stone-700">复习方式</p>
              <div className="mt-2">
                <p className="text-sm text-stone-600">先看单词，点单词显示答案，再选会 / 不会。不会进入详情页。</p>
              </div>
              <label className="mt-5 flex min-h-14 items-center justify-between gap-4 rounded-lg bg-stone-50 px-4 ring-1 ring-stone-200">
                <span>
                  <span className="block font-medium text-stone-900">自动发音</span>
                  <span className="mt-1 block text-sm text-stone-500">关闭后只在点击喇叭时朗读</span>
                </span>
                <input className="h-6 w-6 shrink-0 accent-emerald-700" type="checkbox" checked={settings.autoPronounce} onChange={(event) => updateAutoPronounce(event.target.checked)} />
              </label>
              <label className="mt-5 block text-sm font-medium text-stone-700">每日新词目标</label>
              <input className="mt-2 w-full accent-emerald-700" type="range" min="0" max="200" step="5" value={settings.dailyTarget} onChange={(event) => updateDailyTarget(Number(event.target.value))} />
              <label className="mt-4 flex items-center justify-between gap-3 text-sm"><span>按每日分析自动调整学习安排</span><input className="h-6 w-6 shrink-0 accent-emerald-700" type="checkbox" checked={settings.dailyAnalysisEnabled !== false} onChange={async event => { const next = { ...settings, dailyAnalysisEnabled: event.target.checked }; setSettings(next); await saveSettings(next); void syncCloudQuietly() }} /></label>
              <div className="mt-1 text-sm text-stone-500">{settings.dailyTarget} 新词 / 天 · 总容量 {settings.dailyCapacity} 张卡</div>
              <label className="mt-5 flex min-h-12 items-center justify-between rounded-lg bg-stone-50 px-4 ring-1 ring-stone-200">
                <span className="font-medium text-stone-900">减负模式 · 每天建议 {reliefTarget} 个旧词</span>
                <input className="h-6 w-6 accent-emerald-700" type="checkbox" checked={settings.reliefMode} onChange={(event) => updateReliefMode(event.target.checked)} />
              </label>
              <button className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 font-medium text-white" onClick={() => setScreen('import')}>
                <Upload size={18} /> 导入词库
              </button>
              <button className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 font-medium text-stone-900 ring-1 ring-stone-200" onClick={() => setScreen('sync')}>
                <Cloud size={18} /> 云同步
              </button>
              <button className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 font-medium text-stone-900 ring-1 ring-stone-200" onClick={exportLearningReport}>
                <Download size={18} /> 导出学习报告
              </button>
              <button className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 font-medium text-rose-700 ring-1 ring-rose-200" onClick={async () => { await resetProgress(); await refresh(); void syncCloudQuietly() }}>
                <RotateCcw size={18} /> 重置单词学习进度
              </button>
            </Panel>
            <details className="border-t border-stone-200 pt-3"><summary className="min-h-12 cursor-pointer py-3 font-semibold">已斩词 · {excludedWords.length}</summary><WordList title="已斩词" words={excludedWords} progressMap={progressMap} onOpen={openWordDetail} empty="还没有斩过单词。" /></details>
          </section>
        )}

        {screen === 'sync' && (
          <Panel title="云同步">
            {!isCloudSyncConfigured() ? (
              <div className="space-y-3 text-sm leading-6 text-stone-600">
                <p>还没配置 Supabase。配置后可以用账号密码把进度保存到云端。</p>
                <p>本地 IndexedDB 仍然会继续保存，不会因为没登录而丢进度。</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                  <p className="font-medium text-stone-900">{cloudUser ? `已登录：${cloudUser}` : '未登录'}</p>
                  <p>登录后，每次学习、测验或改设置都会自动上传一份进度快照。</p>
                </div>

                {!cloudUser && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-stone-700">用户名或邮箱</label>
                    <input className="min-h-12 w-full rounded-lg bg-white px-3 ring-1 ring-stone-200" value={cloudLogin} autoCapitalize="none" autoCorrect="off" onChange={(event) => setCloudLogin(event.target.value)} placeholder="例如 huali 或 you@example.com" />
                    <label className="block text-sm font-medium text-stone-700">密码</label>
                    <input className="min-h-12 w-full rounded-lg bg-white px-3 ring-1 ring-stone-200" value={cloudPassword} type="password" onChange={(event) => setCloudPassword(event.target.value)} placeholder="至少 6 位" />
                    <div className="grid grid-cols-2 gap-3">
                      <button disabled={cloudBusy} className="tap-button bg-stone-950 text-white disabled:opacity-50" onClick={() => signInOrUp('in')}>登录</button>
                      <button disabled={cloudBusy} className="tap-button bg-white text-stone-900 ring-1 ring-stone-200 disabled:opacity-50" onClick={() => signInOrUp('up')}>注册</button>
                    </div>
                  </div>
                )}

                {cloudUser && (
                  <div className="grid gap-3">
                    <button disabled={cloudBusy} className="tap-button bg-stone-950 text-white disabled:opacity-50" onClick={uploadCloudNow}>上传本机进度</button>
                    <button disabled={cloudBusy} className="tap-button bg-white text-stone-900 ring-1 ring-stone-200 disabled:opacity-50" onClick={restoreCloudNow}>从云端恢复</button>
                    <button disabled={cloudBusy} className="tap-button bg-white text-rose-700 ring-1 ring-rose-200 disabled:opacity-50" onClick={signOutCloudNow}>退出登录</button>
                  </div>
                )}

                {cloudMessage && <p className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-800 ring-1 ring-emerald-100">{cloudMessage}</p>}
              </div>
            )}
          </Panel>
        )}

        {screen === 'import' && (
          <Panel title="导入 CSV / JSON">
            <p className="text-sm leading-6 text-stone-600">字段：word, phonetic, meaning, collocation, example, difficulty, level。导入后会合并到本地 IndexedDB。</p>
            <label className="mt-5 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-4 font-medium">
              <Download size={18} /> 选择文件
              <input className="hidden" type="file" accept=".csv,.json,application/json,text/csv" onChange={(event) => importFile(event.target.files?.[0])} />
            </label>
            {importMessage && <p className="mt-3 text-sm text-emerald-700">{importMessage}</p>}
          </Panel>
        )}

        {screen === 'detail' && detailWord && (
          <WordDetail
            word={detailWord}
            progress={progressMap.get(detailWord.id)}
            onContinue={continueFromWordDetail}
            onRestore={learning.cards.some(card => card.word_id === detailWord.id) ? () => void learning.restore(detailWord.id) : undefined}
            restoreBusy={learning.busy}
            continueLabel={detailReturnScreen === 'learn' || detailReturnScreen === 'quiz' ? '继续下一个词' : '返回上一页'}
          />
        )}

        <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-1">
            <NavButton active={screen === 'home'} onClick={() => setScreen('home')} icon={<Home size={20} />} label="首页" />
            <NavButton active={screen === 'learn'} onClick={() => startLearnSession()} icon={<BookOpen size={20} />} label="学习" />
            <NavButton active={screen === 'review'} onClick={() => setScreen('review')} icon={<RotateCcw size={20} />} label="复习" />
            <NavButton active={screen === 'weak'} onClick={() => setScreen('weak')} icon={<X size={20} />} label="弱词" />
            <NavButton active={screen === 'grammar'} onClick={() => { setScreen('grammar'); setFeedback(''); setFeedbackWordId('') }} icon={<NotebookPen size={20} />} label="语法" />
          </div>
        </nav>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function OriginExtras({ word }: { word: VocabWord }) {
  return <>
    {word.etymologySource && <a href={word.etymologySource} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm text-emerald-800 underline underline-offset-4">词源出处 · Etymonline</a>}
    {word.usageNote && <details className="mt-2 border-t border-emerald-200 pt-1 text-emerald-950">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">用法辨析</summary>
      <p className="pb-2 leading-7">{word.usageNote}</p>
    </details>}
  </>
}

function WordDetail({ word, progress, onContinue, continueLabel, onRestore, restoreBusy }: {
  word: VocabWord
  progress?: WordProgress
  onContinue: () => void
  continueLabel: string
  onRestore?: () => void
  restoreBusy?: boolean
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>单词详情</span>
        <span>难度 {word.difficulty} · {word.level}</span>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-4xl font-semibold">{word.word}</h2>
            <p className="mt-2 text-stone-500">{word.phonetic}</p>
          </div>
          <button className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white" onClick={() => speakWord(word.word)} aria-label={`朗读 ${word.word}`}>
            <Volume2 size={21} />
          </button>
        </div>
        <WordMeaning word={word} detailed />
        <div className="mt-5 border-t border-stone-200 pt-4">
          <p className="font-semibold">{word.collocation}</p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <p className="leading-7 text-stone-600">{word.example}</p>
            <button className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-900" onClick={() => speakEnglish(word.example || word.collocation, { rate: 0.82 })} aria-label="朗读例句">
              <Volume2 size={19} />
            </button>
          </div>
        </div>
        {word.personalExampleTranslation && <p className="mt-2 text-sm text-stone-600">{word.personalExampleTranslation}</p>}
        {onRestore && <button disabled={restoreBusy} className="mt-2 min-h-11 text-sm font-semibold text-emerald-800 underline" onClick={onRestore}>恢复原词卡</button>}
      </div>

      {word.confusions?.map((confusion) => (
        <div key={confusion.trap} className="rounded-lg bg-rose-50 p-4 ring-1 ring-rose-100">
          <p className="text-sm font-semibold text-rose-900">容易误想：{confusion.trap}</p>
          <p className="mt-2 text-sm leading-6 text-rose-950">{confusion.wrongPath}</p>
          <p className="mt-3 font-medium leading-7 text-stone-950">{confusion.correction}</p>
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-rose-900">{confusion.cue}</p>
        </div>
      ))}

      {word.memoryHook && (
        <div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
          <p className="text-sm font-semibold text-emerald-900">{word.memoryHook.breakdown.startsWith('构词与用法：') ? '构词与用法' : '单词起源'}</p>
          <p className="mt-2 font-medium leading-7 text-emerald-950">{word.memoryHook.breakdown}</p>
          <OriginExtras word={word} />
        </div>
      )}

      {word.evilHook && (
        <div className="rounded-lg bg-fuchsia-50 p-4 ring-1 ring-fuchsia-100">
          <p className="text-sm font-semibold text-fuchsia-900">邪修记法 · 联想非词源</p>
          <p className="mt-2 font-medium leading-7 text-fuchsia-950">{word.evilHook}</p>
        </div>
      )}

      <p className="rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-600">
        累计练习 {progress?.seen ?? 0} 次 · 答错 {progress?.incorrect ?? 0} 次
        {progress && <span className="mt-1 block">下次复习：{new Date(progress.nextReviewAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
      </p>

      <button className="tap-button w-full bg-stone-950 text-white" onClick={onContinue}>
        {continueLabel}
      </button>
    </section>
  )
}

function DoneCard({ title, subtitle, onRestart, onFinish }: { title: string; subtitle: string; onRestart?: () => void; onFinish: () => void }) {
  return (
    <section className="rounded-lg bg-white p-5 text-center shadow-sm ring-1 ring-stone-200">
      <p className="text-3xl font-semibold">{title}</p>
      <p className="mt-3 leading-7 text-stone-600">{subtitle}</p>
      <button className="mt-6 flex min-h-14 w-full items-center justify-center rounded-lg bg-stone-950 px-5 text-lg font-semibold text-white" onClick={onFinish}>
        今天先到这里
      </button>
      {onRestart && <button className="mt-3 flex min-h-12 w-full items-center justify-center text-stone-600" onClick={onRestart}>
        再来一轮
      </button>}
    </section>
  )
}

function WordList({ title, words, progressMap, empty, onOpen }: { title: string; words: VocabWord[]; progressMap: Map<string, WordProgress>; empty: string; onOpen: (id: string) => void }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {words.length === 0 && <p className="rounded-lg bg-white p-5 text-stone-500 ring-1 ring-stone-200">{empty}</p>}
      {words.map((word) => {
        const progress = progressMap.get(word.id)
        return (
          <button type="button" key={word.id} onClick={() => onOpen(word.id)} className="block w-full rounded-lg bg-white p-4 text-left shadow-sm ring-1 ring-stone-200" aria-label={`查看 ${word.word} 的详情`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{word.word}</p>
                <p className="text-sm text-stone-500">{word.meaning}</p>
              </div>
              <ChevronRight className="shrink-0 text-stone-300" size={20} />
            </div>
            <p className="mt-2 text-xs text-stone-500">{progress?.lastRating === 'unknown' ? '最近未答对' : '等待巩固'} · 累计答错 {progress?.incorrect ?? 0} 次</p>
          </button>
        )
      })}
    </section>
  )
}

function PrimaryButton({ icon, label, onClick, disabled = false }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return <button disabled={disabled} className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 text-lg font-semibold text-white disabled:opacity-50" onClick={onClick}>{icon}{label}</button>
}

function SecondaryButton({ icon, label, onClick, disabled = false }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return <button disabled={disabled} className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-white px-5 text-lg font-semibold ring-1 ring-stone-200 disabled:opacity-50" onClick={onClick}>{icon}{label}</button>
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={clsx('flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px]', active ? 'text-emerald-700' : 'text-stone-500')} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

export default App
