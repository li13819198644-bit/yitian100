import { useEffect, useMemo, useState } from 'react'
import { BarChart3, BookOpen, Check, ChevronRight, Cloud, Download, Home, RotateCcw, Settings, Upload, Volume2, X } from 'lucide-react'
import clsx from 'clsx'
import type { AppSettings, AppStats, QuizMode, Rating, Screen, SessionKind, VocabWord, WordProgress } from './types'
import {
  createProgress,
  accuracy,
  buildDailyPlan,
  chooseLeechRepairSession,
  chooseQuizSession,
  chooseReviewSession,
  chooseWeakPracticeSession,
  getNewWords,
  insertDelayedRetry,
  isLeech,
  isMastered,
  isWeak,
  scheduleQuizResult,
  scheduleReview,
} from './lib/srs'
import {
  defaultSettings,
  defaultStats,
  getProgress,
  getSettings,
  getStats,
  getWords,
  resetProgress,
  saveProgress,
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

const actionMap: Record<Rating, { label: string; className: string }> = {
  known: { label: '认识', className: 'bg-emerald-600 text-white' },
  fuzzy: { label: '模糊', className: 'bg-amber-500 text-white' },
  unknown: { label: '不认识', className: 'bg-rose-600 text-white' },
}

const dayMs = 24 * 60 * 60 * 1000

function blankStats(): AppStats {
  return defaultStats()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function maskTargetWord(text: string, target: string): string {
  if (!text) return ''
  const masked = '_'.repeat(Math.max(4, target.length))
  return text.replace(new RegExp(`\\b${escapeRegExp(target)}\\b`, 'gi'), masked)
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
  const [words, setWords] = useState<VocabWord[]>([])
  const [progress, setProgress] = useState<WordProgress[]>([])
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [stats, setStats] = useState<AppStats>(blankStats)
  const [activeIndex, setActiveIndex] = useState(0)
  const [sessionWordIds, setSessionWordIds] = useState<string[]>([])
  const [sessionKind, setSessionKind] = useState<SessionKind>('learn')
  const [quizMode, setQuizMode] = useState<QuizMode>('en-zh')
  const [feedback, setFeedback] = useState<string>('')
  const [importMessage, setImportMessage] = useState('')
  const [cloudUser, setCloudUser] = useState<string>('')
  const [cloudLogin, setCloudLogin] = useState('')
  const [cloudPassword, setCloudPassword] = useState('')
  const [cloudMessage, setCloudMessage] = useState('')
  const [cloudBusy, setCloudBusy] = useState(false)

  async function refresh() {
    const [nextWords, nextProgress, nextSettings, nextStats] = await Promise.all([
      getWords(),
      getProgress(),
      getSettings(),
      getStats(),
    ])
    setWords(nextWords)
    setProgress(nextProgress)
    setSettings(nextSettings)
    setStats(nextStats)
  }

  useEffect(() => {
    refresh()
    getCloudUser().then((user) => setCloudUser(user?.email ?? '')).catch(() => setCloudUser(''))
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

  const progressMap = useMemo(() => new Map(progress.map((item) => [item.wordId, item])), [progress])
  const wordMap = useMemo(() => new Map(words.map((item) => [item.id, item])), [words])
  const learnedIds = useMemo(() => new Set(progress.map((item) => item.wordId)), [progress])
  const dailyPlan = useMemo(
    () => buildDailyPlan(words, progress, {
      baseNewWordsPerDay: settings.dailyTarget,
      dailyCapacity: settings.dailyCapacity,
    }),
    [words, progress, settings.dailyTarget, settings.dailyCapacity],
  )
  const reliefActive = settings.reliefMode && (dailyPlan.reviewDebt >= 30 || dailyPlan.weakDebt >= 20 || dailyPlan.forecastPressure > 0)
  const reliefReviewLimit = reliefActive && dailyPlan.reviewDebt ? Math.min(20, dailyPlan.reviewDebt) : undefined
  const recommendedNewCount = reliefActive ? 0 : dailyPlan.recommendedNewCount
  const sessionWords = useMemo(
    () => sessionWordIds.map((id) => wordMap.get(id)).filter((word): word is VocabWord => Boolean(word)),
    [sessionWordIds, wordMap],
  )
  const reviewWords = reliefReviewLimit ? dailyPlan.dueReviewWords.slice(0, reliefReviewLimit) : dailyPlan.dueReviewWords
  const weakWords = useMemo(() => words.filter((word) => {
    const item = progressMap.get(word.id)
    return item ? isWeak(item) : false
  }), [words, progressMap])
  const reliefActionCount = dailyPlan.reviewDebt ? (reliefReviewLimit ?? dailyPlan.reviewDebt) : Math.min(10, weakWords.length || 10)
  const unlearnedCount = Math.max(0, words.length - learnedIds.size)
  const gentleNewWordCount = Math.min(10, unlearnedCount)
  // Derive this so existing local/cloud progress benefits from improved criteria
  // without requiring a destructive data migration.
  const mastered = progress.filter(isMastered).length
  const stubbornWords = weakWords.filter((word) => {
    const item = progressMap.get(word.id)
    return item ? isLeech(item) : false
  }).length
  const progressStudiedToday = progress.filter((item) => todayKey(new Date(item.updatedAt)) === todayKey()).length
  const todayProgress = Math.max(stats.todayDate === todayKey() ? stats.todaySeen.length : 0, progressStudiedToday)
  const todayAccuracy = accuracy(progress)
  const activeWord = sessionWords[activeIndex]

  function speakNextSessionWord(nextIds: string[], nextIndex: number) {
    const nextId = nextIds[nextIndex]
    const nextWord = nextId ? wordMap.get(nextId) : undefined
    if (nextWord) void speakWord(nextWord.word)
  }

  function startLearnSession(options: { limit?: number } = {}) {
    const target = options.limit ?? settings.dailyTarget
    // Reaching this function is an explicit request to learn new words. Daily
    // load recommendations may show zero, but they must not disable this action.
    const nextWords = getNewWords(words, progress, target)
    if (!nextWords.length) {
      setFeedback('现在没有未学新词。可以先复习，或导入新词。')
      setScreen('home')
      return
    }
    setSessionWordIds(nextWords.map((word) => word.id))
    setActiveIndex(0)
    setSessionKind('learn')
    setScreen('learn')
  }

  function startReviewSession(nextScreen: Screen = 'learn') {
    const nextWords = chooseReviewSession(words, progress, {
      baseNewWordsPerDay: settings.dailyTarget,
      dailyCapacity: settings.dailyCapacity,
      reviewCap: reliefReviewLimit,
    })
    if (!nextWords.length) {
      setScreen('review')
      return
    }
    setSessionWordIds(nextWords.map((word) => word.id))
    setActiveIndex(0)
    setSessionKind('review')
    setScreen(nextScreen)
  }

  function startQuizSession() {
    const nextWords = chooseQuizSession(words, progress, {
      baseNewWordsPerDay: settings.dailyTarget,
      dailyCapacity: settings.dailyCapacity,
      quizSize: reliefActive ? 10 : 20,
    })
    setSessionWordIds(nextWords.map((word) => word.id))
    setActiveIndex(0)
    setSessionKind('quiz')
    setScreen('quiz')
  }

  function startWeakPracticeSession(nextScreen: Screen = 'learn') {
    const limit = reliefActive ? 10 : 30
    const leechWords = chooseLeechRepairSession(words, progress, limit)
    const nextWords = leechWords.length ? leechWords : chooseWeakPracticeSession(words, progress, {
      baseNewWordsPerDay: settings.dailyTarget,
      dailyCapacity: settings.dailyCapacity,
      weakPracticeLimit: limit,
    })
    if (!nextWords.length) {
      setScreen('weak')
      return
    }
    setSessionWordIds(nextWords.map((word) => word.id))
    setActiveIndex(0)
    setSessionKind('weak')
    setScreen(nextScreen)
  }

  async function rateWord(word: VocabWord, rating: Rating) {
    const existing = progressMap.get(word.id) ?? createProgress(word.id)
    const updated = scheduleReview(existing, rating)
    const nextSessionIds = insertDelayedRetry(sessionWordIds, activeIndex, word.id, rating)
    speakNextSessionWord(nextSessionIds, activeIndex + 1)
    await saveProgress(updated)

    const isCorrect = rating !== 'unknown'
    const seen = new Set(stats.todayDate === todayKey() ? stats.todaySeen : [])
    seen.add(word.id)
    const nextStats: AppStats = {
      ...stats,
      todayDate: todayKey(),
      todaySeen: Array.from(seen),
      combo: isCorrect ? stats.combo + 1 : 0,
      bestCombo: Math.max(stats.bestCombo, isCorrect ? stats.combo + 1 : stats.combo),
      streak: stats.lastStudyDate === todayKey() ? stats.streak : Math.max(1, stats.streak),
      lastStudyDate: todayKey(),
    }
    await saveStats(nextStats)
    void syncCloudQuietly()
    setSessionWordIds(nextSessionIds)
    setFeedback(`${word.word}: ${actionMap[rating].label}`)
    setActiveIndex((index) => index + 1)
    await refresh()
  }

  async function rateQuizAnswer(word: VocabWord, correct: boolean) {
    const existing = progressMap.get(word.id) ?? createProgress(word.id)
    const updated = scheduleQuizResult(existing, correct)
    await saveProgress(updated)

    const seen = new Set(stats.todayDate === todayKey() ? stats.todaySeen : [])
    seen.add(word.id)
    const nextStats: AppStats = {
      ...stats,
      todayDate: todayKey(),
      todaySeen: Array.from(seen),
      combo: correct ? stats.combo + 1 : 0,
      bestCombo: Math.max(stats.bestCombo, correct ? stats.combo + 1 : stats.combo),
      streak: stats.lastStudyDate === todayKey() ? stats.streak : Math.max(1, stats.streak),
      lastStudyDate: todayKey(),
    }
    await saveStats(nextStats)
    void syncCloudQuietly()
    setSessionWordIds((ids) => insertDelayedRetry(ids, activeIndex, word.id, correct ? 'fuzzy' : 'unknown'))
    setFeedback(`${word.word}: ${correct ? '测验答对' : '测验答错'}`)
    setActiveIndex((index) => index + 1)
    await refresh()
  }

  function quizPrompt(word: VocabWord) {
    if (quizMode === 'en-zh') return { question: word.word, answer: word.meaning }
    if (quizMode === 'zh-en') return { question: word.meaning, answer: word.word }
    if (quizMode === 'context') return { question: maskTargetWord(word.example, word.word), answer: word.word }
    if (quizMode === 'spelling') {
      const context = maskTargetWord(word.collocation || word.example, word.word)
      return {
        question: [`中文：${word.meaning}`, `提示：${word.word[0]} 开头，${word.word.length} 个字母`, context && `语境：${context}`].filter(Boolean).join('\n'),
        answer: word.word,
      }
    }
    if (quizMode === 'confusion') {
      const confusion = word.confusions?.[0]
      if (confusion) {
        return {
          question: `${word.word}\n容易误想：${confusion.trap}\n应该抓哪个线索？`,
          answer: confusion.cue,
        }
      }
      return { question: `${word.word}\n这个词没有专门误区，选核心意思。`, answer: word.meaning }
    }
    return { question: word.word, answer: word.meaning }
  }

  function choices(word: VocabWord) {
    const answer = quizPrompt(word).answer
    if (quizMode === 'spelling') return []
    if (quizMode === 'confusion') {
      const traps = [
        '看开头长得像就猜，不管词源核心。',
        '把它当成普通流程词。',
        '只记谐音，不校正错方向。',
        '把相近词混成同一个意思。',
      ]
      return [answer, ...traps.filter((trap) => trap !== answer).slice(0, 3)].sort(() => 0.5 - Math.random())
    }
    const pool = words
      .filter((candidate) => candidate.id !== word.id)
      .slice()
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((candidate) => (quizMode === 'zh-en' || quizMode === 'context' ? candidate.word : candidate.meaning))
    return [answer, ...pool].sort(() => 0.5 - Math.random())
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
    const learnedIds = new Set(progress.map((item) => item.wordId))
    const weakIds = new Set(weakWords.map((word) => word.id))
    const report = {
      schemaVersion: 1,
      app: '一天100词',
      exportedAt: new Date(now).toISOString(),
      summary: {
        totalWords: words.length,
        learnedWords: learnedIds.size,
        unlearnedWords: words.length - learnedIds.size,
        masteredWords: mastered,
        weakWords: weakWords.length,
        stubbornWords,
        dueReviewWords: dailyPlan.reviewDebt,
        recommendedNewWords: dailyPlan.recommendedNewCount,
        tomorrowReviews: dailyPlan.forecastReviewLoad[1] ?? 0,
        sevenDayPeak: Math.max(0, ...dailyPlan.forecastReviewLoad),
        accuracy: todayAccuracy,
        combo: stats.combo,
        streak: stats.streak,
      },
      forecast: dailyPlan.forecastReviewLoad.map((count, index) => ({
        date: new Date(now + index * dayMs).toISOString().slice(0, 10),
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
        <header className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm text-stone-500">iPhone 离线背词</p>
            <h1 className="text-3xl font-semibold tracking-normal">一天100词</h1>
          </div>
          <button className="icon-button" onClick={() => setScreen('settings')} aria-label="设置">
            <Settings size={22} />
          </button>
        </header>

        {screen === 'home' && (
          <section className="space-y-4">
            <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-stone-500">今日练习量</p>
                  <p className="mt-1 text-4xl font-semibold">{todayProgress}</p>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">B2 → C1</span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-stone-100">
                <div className="h-3 rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (todayProgress / settings.dailyCapacity) * 100)}%` }} />
              </div>
            </div>

            {reliefActive && (
              <div className="rounded-lg bg-emerald-50 p-5 shadow-sm ring-1 ring-emerald-100">
                <p className="text-sm font-medium text-emerald-800">减负模式</p>
                <p className="mt-2 text-2xl font-semibold text-stone-950">今天做 {reliefActionCount} 个就停</p>
                <p className="mt-2 leading-6 text-stone-600">默认先清最该复习的词；如果还有力气，可以只学 10 个新词，不追欠账。</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Metric label="词库总量" value={words.length} />
              <Metric label="未学新词" value={unlearnedCount} />
              <Metric label="今日该复习" value={dailyPlan.reviewDebt} />
              <Metric label="弱词债" value={dailyPlan.weakDebt} />
              <Metric label="建议新词" value={recommendedNewCount} />
              <Metric label="明日复习" value={dailyPlan.forecastReviewLoad[1] ?? 0} />
              <Metric label="7日峰值" value={Math.max(0, ...dailyPlan.forecastReviewLoad)} />
              <Metric label="正确率" value={`${todayAccuracy}%`} />
              <Metric label="Combo" value={stats.combo} />
              <Metric label="连续学习" value={`${stats.streak} 天`} />
              <Metric label="已掌握" value={mastered} />
              <Metric label="弱词" value={weakWords.length} />
              <Metric label="顽固词" value={stubbornWords} />
            </div>

            <div className="grid gap-3">
              <PrimaryButton
                onClick={dailyPlan.reviewDebt ? () => startReviewSession('learn') : recommendedNewCount ? () => startLearnSession() : () => startWeakPracticeSession('learn')}
                icon={<BookOpen size={20} />}
                label={reliefActive ? `做 ${reliefActionCount} 个就停` : dailyPlan.reviewDebt ? '先清复习' : recommendedNewCount ? '学习新词' : '修复弱词'}
              />
              {gentleNewWordCount > 0 && (
                <SecondaryButton onClick={() => startLearnSession({ limit: gentleNewWordCount })} icon={<BookOpen size={20} />} label={`学 ${gentleNewWordCount} 个新词`} />
              )}
              <SecondaryButton onClick={startQuizSession} icon={<BarChart3 size={20} />} label="进入测验" />
            </div>
          </section>
        )}

        {screen === 'learn' && activeWord && activeIndex < sessionWords.length && (
          sessionKind === 'weak' && isLeech(progressMap.get(activeWord.id) ?? createProgress(activeWord.id)) ? (
            <LeechRepairCard
              word={activeWord}
              progress={progressMap.get(activeWord.id)}
              attempt={sessionWordIds.slice(0, activeIndex).filter((id) => id === activeWord.id).length}
              position={activeIndex + 1}
              total={sessionWords.length}
              onResult={(correct) => rateWord(activeWord, correct ? 'known' : 'unknown')}
            />
          ) : (
            <WordCard title={`${sessionKind === 'review' ? '到期复习' : sessionKind === 'weak' ? '弱词修复' : '新词学习'} · 第 ${Math.floor(activeIndex / 5) + 1} 组 / ${Math.max(1, Math.ceil(sessionWords.length / 5))}`} word={activeWord} progress={progressMap.get(activeWord.id)}>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(actionMap) as Rating[]).map((rating) => (
                  <button key={rating} className={clsx('tap-button', actionMap[rating].className)} onClick={() => rateWord(activeWord, rating)}>
                    {actionMap[rating].label}
                  </button>
                ))}
              </div>
            </WordCard>
          )
        )}

        {screen === 'learn' && sessionWords.length > 0 && activeIndex >= sessionWords.length && (
          <DoneCard title={sessionKind === 'review' ? '复习完成' : sessionKind === 'weak' ? '弱词修复完成' : '今日新词完成'} subtitle={sessionKind === 'review' ? '到期复习已经清完。如果弱词债仍高，先修弱词。' : sessionKind === 'weak' ? '这组高错误词已经重新压了一遍，系统会更谨慎安排。' : '这组新词已经学完。模糊和不认识的词会按间隔回来。'} onRestart={sessionKind === 'review' ? () => startWeakPracticeSession('learn') : sessionKind === 'weak' ? startWeakPracticeSession : () => startLearnSession()} />
        )}

        {screen === 'quiz' && activeWord && activeIndex < sessionWords.length && (
          <QuizCard
            mode={quizMode}
            setMode={setQuizMode}
            word={activeWord}
            prompt={quizPrompt(activeWord)}
            choices={choices(activeWord)}
            onAnswer={(correct) => rateQuizAnswer(activeWord, correct)}
          />
        )}

        {screen === 'quiz' && sessionWords.length > 0 && activeIndex >= sessionWords.length && (
          <DoneCard title="测验完成" subtitle="本轮测验结束。可以去弱词本看刚才不稳的词。" onRestart={startQuizSession} />
        )}

        {screen === 'review' && (
          <section className="space-y-3">
            <PrimaryButton onClick={() => startReviewSession('learn')} icon={<RotateCcw size={20} />} label={reviewWords.length ? `开始复习 ${reviewWords.length} 个` : '暂无到期复习'} />
            <WordList title="复习队列" words={reviewWords} progressMap={progressMap} empty="现在没有到期复习词。" />
          </section>
        )}
        {screen === 'weak' && (
          <section className="space-y-3">
            {stubbornWords > 0 && (
              <div className="rounded-lg bg-fuchsia-50 p-4 text-sm leading-6 text-fuchsia-950 ring-1 ring-fuchsia-100">
                <p className="font-semibold">{stubbornWords} 个顽固词将使用专项修复</p>
                <p className="mt-1">系统会轮换中文拼写、语境填空和听音拼写，答错后展示辨析与记忆钩子，再延迟重测。</p>
              </div>
            )}
            <PrimaryButton onClick={() => startWeakPracticeSession('learn')} icon={<RotateCcw size={20} />} label={weakWords.length ? (stubbornWords ? `专项修复 ${Math.min(reliefActive ? 10 : 30, stubbornWords)} 个顽固词` : `修复弱词 ${Math.min(30, weakWords.length)} 个`) : '暂无弱词'} />
            <WordList title="弱词本" words={weakWords} progressMap={progressMap} empty="还没有弱词。" />
          </section>
        )}

        {screen === 'settings' && (
          <section className="space-y-4">
            <Panel title="设置">
              <label className="block text-sm font-medium text-stone-700">每日新词目标</label>
              <input className="mt-2 w-full accent-emerald-700" type="range" min="0" max="200" step="5" value={settings.dailyTarget} onChange={(event) => updateDailyTarget(Number(event.target.value))} />
              <div className="mt-1 text-sm text-stone-500">{settings.dailyTarget} 新词 / 天 · 总容量 {settings.dailyCapacity} 张卡</div>
              <label className="mt-5 flex min-h-12 items-center justify-between rounded-lg bg-stone-50 px-4 ring-1 ring-stone-200">
                <span className="font-medium text-stone-900">自动减负</span>
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
                <RotateCcw size={18} /> 重置学习进度
              </button>
            </Panel>
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

        {feedback && <div className="fixed left-1/2 top-[calc(14px+env(safe-area-inset-top))] z-20 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-lg bg-stone-950 px-4 py-3 text-center text-sm text-white shadow-lg">{feedback}</div>}

        <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-1">
            <NavButton active={screen === 'home'} onClick={() => setScreen('home')} icon={<Home size={20} />} label="首页" />
            <NavButton active={screen === 'learn'} onClick={() => startLearnSession()} icon={<BookOpen size={20} />} label="学习" />
            <NavButton active={screen === 'review'} onClick={() => setScreen('review')} icon={<RotateCcw size={20} />} label="复习" />
            <NavButton active={screen === 'weak'} onClick={() => setScreen('weak')} icon={<X size={20} />} label="弱词" />
            <NavButton active={screen === 'settings'} onClick={() => setScreen('settings')} icon={<Settings size={20} />} label="设置" />
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

function LeechRepairCard({ word, progress, attempt, position, total, onResult }: {
  word: VocabWord
  progress?: WordProgress
  attempt: number
  position: number
  total: number
  onResult: (correct: boolean) => void
}) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const challenge = attempt % 3
  const normalizedAnswer = answer.trim().toLowerCase()
  const correct = submitted && normalizedAnswer === word.word.toLowerCase()
  const context = maskTargetWord(word.example || word.collocation, word.word)

  useEffect(() => {
    setAnswer('')
    setSubmitted(false)
  }, [word.id, attempt])

  const submit = () => {
    if (!answer.trim() || submitted) return
    setSubmitted(true)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>顽固词专项 · {position} / {total}</span>
        <span>已错 {progress?.lapses ?? 0} 次</span>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-fuchsia-200">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-sm font-semibold text-fuchsia-900">
            {challenge === 0 ? '中文 → 拼写' : challenge === 1 ? '语境填空' : '听音拼写'}
          </span>
          <span className="text-sm text-stone-500">自动判分</span>
        </div>

        {!submitted && (
          <>
            {challenge === 0 && (
              <div className="mt-6">
                <p className="text-2xl font-semibold leading-9">{word.meaning}</p>
                <p className="mt-3 leading-7 text-stone-600">搭配提示：{maskTargetWord(word.collocation, word.word)}</p>
              </div>
            )}
            {challenge === 1 && (
              <div className="mt-6">
                <p className="whitespace-pre-line text-xl font-semibold leading-8">{context || word.meaning}</p>
                <p className="mt-3 text-stone-600">根据语境补出完整英文单词。</p>
              </div>
            )}
            {challenge === 2 && (
              <div className="mt-6 rounded-lg bg-sky-50 p-5 text-center ring-1 ring-sky-100">
                <button className="mx-auto flex min-h-14 items-center justify-center gap-2 rounded-full bg-stone-950 px-6 font-semibold text-white" onClick={() => speakWord(word.word)}>
                  <Volume2 size={21} /> 播放发音
                </button>
                <p className="mt-3 text-sm text-stone-600">只听声音，不看单词，把听到的词拼出来。</p>
              </div>
            )}

            <div className="mt-6 grid gap-3">
              <input
                className="min-h-14 rounded-lg border border-stone-300 bg-stone-50 px-4 text-xl font-semibold outline-none focus:border-fuchsia-600"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submit()
                }}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                placeholder="输入完整英文单词"
                autoFocus
              />
              <button className="tap-button bg-stone-950 text-white disabled:bg-stone-300" onClick={submit} disabled={!answer.trim()}>
                提交答案
              </button>
            </div>
          </>
        )}

        {submitted && (
          <>
            <div className={clsx('mt-6 rounded-lg p-4 ring-1', correct ? 'bg-emerald-50 text-emerald-950 ring-emerald-200' : 'bg-rose-50 text-rose-950 ring-rose-200')}>
              <p className="text-sm font-semibold">{correct ? '答对了：这次形成一次有效提取' : `答错了：你写的是 ${answer.trim()}`}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-3xl font-semibold">{word.word}</p>
                <button className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-stone-950 ring-1 ring-stone-200" onClick={() => speakWord(word.word)} aria-label={`朗读 ${word.word}`}>
                  <Volume2 size={19} />
                </button>
              </div>
              <p className="mt-2 text-lg font-medium">{word.meaning}</p>
            </div>

            {word.confusions?.map((confusion) => (
              <div key={confusion.trap} className="mt-4 rounded-lg bg-rose-50 p-4 ring-1 ring-rose-100">
                <p className="text-sm font-semibold text-rose-900">先切断错误联想：{confusion.trap}</p>
                <p className="mt-2 leading-7 text-stone-800">{confusion.correction}</p>
                <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-rose-900">新线索：{confusion.cue}</p>
              </div>
            ))}

            {word.memoryHook && (
              <div className="mt-4 rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p className="text-sm font-semibold text-emerald-900">重新编码</p>
                <p className="mt-2 font-medium leading-7 text-emerald-950">{word.memoryHook.core}</p>
                <p className="mt-2 leading-7 text-stone-700">{word.memoryHook.breakdown}</p>
                <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-sm font-semibold text-emerald-900">{word.memoryHook.personalPrompt}</p>
              </div>
            )}

            {word.evilHook && (
              <div className="mt-4 rounded-lg bg-fuchsia-50 p-4 ring-1 ring-fuchsia-100">
                <p className="text-sm font-semibold text-fuchsia-900">备用记忆钩子</p>
                <p className="mt-2 leading-7 text-fuchsia-950">{word.evilHook}</p>
              </div>
            )}

            {!correct && <p className="mt-4 text-sm leading-6 text-stone-600">系统会隔开几张卡后换一种题型再次测试；这次不会计作“认识”。</p>}
          </>
        )}
      </div>

      {submitted && (
        <div className="fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] z-20 border-t border-stone-200 bg-[#f7f4ef]/95 py-2 backdrop-blur">
          <div className="mx-auto w-full max-w-md px-4">
            <button className={clsx('tap-button w-full text-white', correct ? 'bg-emerald-700' : 'bg-stone-950')} onClick={() => onResult(correct)}>
              {correct ? '答对，继续' : '看完线索，稍后重测'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function WordCard({ title, word, progress, children }: { title: string; word: VocabWord; progress?: WordProgress; children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setRevealed(false)
  }, [word.id])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>{title}</span>
        <span>难度 {word.difficulty} · {word.level}</span>
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-4xl font-semibold">{word.word}</p>
            <p className="mt-2 text-stone-500">{word.phonetic}</p>
          </div>
          <button
            className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white shadow-sm"
            onClick={() => speakWord(word.word)}
            aria-label={`朗读 ${word.word}`}
          >
            <Volume2 size={21} />
          </button>
        </div>
        {!revealed ? (
          <div className="mt-6 space-y-4 rounded-lg bg-amber-50 p-4 text-left ring-1 ring-amber-100">
            <p className="text-sm font-semibold text-amber-900">先主动回忆，别急着看答案</p>
            <div className="space-y-3 text-stone-800">
              <p>1. 说出中文核心意思。</p>
              <p>2. 说一个常见搭配。</p>
              <p>3. 口头造一个很短的句子。</p>
            </div>
            <p className="text-sm leading-6 text-stone-600">这是 retrieval practice：先提取，再反馈，比反复看解释更能形成长期记忆。</p>
          </div>
        ) : (
          <>
            <p className="mt-5 text-2xl font-medium">{word.meaning}</p>
            <div className="mt-5 space-y-3 rounded-lg bg-stone-50 p-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{word.collocation}</p>
                  <p className="mt-3 leading-7 text-stone-600">{word.example}</p>
                </div>
                <button
                  className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-white text-stone-900 ring-1 ring-stone-200"
                  onClick={() => speakEnglish(word.example || word.collocation, { rate: 0.82 })}
                  aria-label="朗读例句"
                >
                  <Volume2 size={19} />
                </button>
              </div>
            </div>
            {word.confusions?.map((confusion) => (
              <div key={confusion.trap} className="mt-4 rounded-lg bg-rose-50 p-4 text-left ring-1 ring-rose-100">
                <p className="text-sm font-semibold text-rose-900">容易误想：{confusion.trap}</p>
                <p className="mt-2 text-sm leading-6 text-rose-950">{confusion.wrongPath}</p>
                <p className="mt-3 text-base font-medium leading-7 text-stone-950">{confusion.correction}</p>
                <p className="mt-3 rounded-lg bg-white/75 px-3 py-2 text-sm font-semibold text-rose-900">{confusion.cue}</p>
              </div>
            ))}
            {word.memoryHook && (
              <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-left ring-1 ring-emerald-100">
                <p className="text-sm font-semibold text-emerald-900">单词起源</p>
                <p className="mt-2 text-base font-medium leading-7 text-emerald-950">{word.memoryHook.breakdown}</p>
              </div>
            )}
            {word.evilHook && (
              <div className="mt-4 rounded-lg bg-fuchsia-50 p-4 text-left ring-1 ring-fuchsia-100">
                <p className="text-sm font-semibold text-fuchsia-900">邪修记法</p>
                <p className="mt-2 text-base font-medium leading-7 text-fuchsia-950">{word.evilHook}</p>
              </div>
            )}
            <p className="mt-4 text-sm text-stone-500">
              复习 {progress?.repetitions ?? 0} 次 · 稳定度 {(progress?.stability ?? 0).toFixed(1)} 天 · 错误 {progress?.lapses ?? 0}
            </p>
          </>
        )}
      </div>
      {!revealed ? (
        <div className="fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] z-20 border-t border-stone-200 bg-[#f7f4ef]/95 py-2 backdrop-blur">
          <div className="mx-auto w-full max-w-md px-4">
            <button className="tap-button w-full bg-stone-950 text-white" onClick={() => setRevealed(true)}>
              显示答案
            </button>
          </div>
        </div>
      ) : children && (
        <div className="fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] z-20 border-t border-stone-200 bg-[#f7f4ef]/95 py-2 backdrop-blur">
          <div className="mx-auto w-full max-w-md px-4">{children}</div>
        </div>
      )}
    </section>
  )
}

function DoneCard({ title, subtitle, onRestart }: { title: string; subtitle: string; onRestart: () => void }) {
  return (
    <section className="rounded-lg bg-white p-5 text-center shadow-sm ring-1 ring-stone-200">
      <p className="text-3xl font-semibold">{title}</p>
      <p className="mt-3 leading-7 text-stone-600">{subtitle}</p>
      <button className="mt-6 flex min-h-14 w-full items-center justify-center rounded-lg bg-stone-950 px-5 text-lg font-semibold text-white" onClick={onRestart}>
        再来一轮
      </button>
    </section>
  )
}

function QuizCard({ mode, setMode, word, prompt, choices, onAnswer }: {
  mode: QuizMode
  setMode: (mode: QuizMode) => void
  word: VocabWord
  prompt: { question: string; answer: string }
  choices: string[]
  onAnswer: (correct: boolean) => void
}) {
  const [answered, setAnswered] = useState<string>('')
  const [spelling, setSpelling] = useState('')
  useEffect(() => {
    setAnswered('')
    setSpelling('')
  }, [word.id, mode])
  const submitSpelling = () => {
    if (answered) return
    const normalizedInput = spelling.trim().toLowerCase()
    const normalizedAnswer = prompt.answer.trim().toLowerCase()
    const correct = normalizedInput === normalizedAnswer
    setAnswered(spelling.trim() || ' ')
    setTimeout(() => onAnswer(correct), 650)
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ['en-zh', '英中'],
          ['zh-en', '中英'],
          ['context', '填空'],
          ['spelling', '拼写'],
          ['confusion', '防偏'],
          ['swipe', '快刷'],
        ].map(([key, label]) => (
          <button key={key} className={clsx('min-h-11 rounded-lg text-xs font-medium ring-1 ring-stone-200', mode === key ? 'bg-stone-900 text-white' : 'bg-white')} onClick={() => setMode(key as QuizMode)}>
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm text-stone-500">{mode === 'swipe' ? '快刷判断' : mode === 'spelling' ? '看中文和搭配，拼出英文' : mode === 'confusion' ? '校正错误联想' : '即时反馈'}</p>
        <div className="mt-4 flex items-start justify-between gap-3">
          <p className={clsx('whitespace-pre-line font-semibold leading-tight', mode === 'spelling' ? 'text-2xl' : 'text-3xl')}>{prompt.question}</p>
          {(mode === 'en-zh' || mode === 'swipe') && (
            <button
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white shadow-sm"
              onClick={() => speakWord(word.word)}
              aria-label={`朗读 ${word.word}`}
            >
              <Volume2 size={19} />
            </button>
          )}
        </div>
        {mode === 'swipe' ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="tap-button bg-emerald-600 text-white" onClick={() => onAnswer(true)}><Check size={18} /> 认识</button>
            <button className="tap-button bg-rose-600 text-white" onClick={() => onAnswer(false)}><X size={18} /> 不认识</button>
          </div>
        ) : mode === 'spelling' ? (
          <div className="mt-6 grid gap-3">
            <input
              className={clsx('min-h-14 rounded-lg border border-stone-200 bg-stone-50 px-4 text-xl font-semibold outline-none focus:border-stone-900', answered && answered.trim().toLowerCase() === prompt.answer.toLowerCase() && 'border-emerald-300 bg-emerald-50', answered && answered.trim().toLowerCase() !== prompt.answer.toLowerCase() && 'border-rose-300 bg-rose-50')}
              value={spelling}
              onChange={(event) => setSpelling(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitSpelling()
              }}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="输入英文单词"
              disabled={Boolean(answered)}
            />
            {answered && <p className="rounded-lg bg-stone-100 px-4 py-3 text-sm font-medium text-stone-700">正确拼写：{prompt.answer}</p>}
            <button className="tap-button bg-stone-950 text-white disabled:bg-stone-300" onClick={submitSpelling} disabled={!spelling.trim() || Boolean(answered)}>
              提交拼写
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {choices.map((choice) => {
              const isAnswer = choice === prompt.answer
              return (
                <button
                  key={choice}
                  className={clsx('min-h-14 rounded-lg px-4 text-left font-medium ring-1 ring-stone-200', answered && isAnswer && 'bg-emerald-100 text-emerald-900', answered === choice && !isAnswer && 'bg-rose-100 text-rose-900')}
                  onClick={() => { setAnswered(choice); setTimeout(() => onAnswer(isAnswer), 350) }}
                >
                  {choice}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function WordList({ title, words, progressMap, empty }: { title: string; words: VocabWord[]; progressMap: Map<string, WordProgress>; empty: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {words.length === 0 && <p className="rounded-lg bg-white p-5 text-stone-500 ring-1 ring-stone-200">{empty}</p>}
      {words.map((word) => {
        const progress = progressMap.get(word.id)
        return (
          <div key={word.id} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{word.word}</p>
                <p className="text-sm text-stone-500">{word.meaning}</p>
              </div>
              <ChevronRight className="shrink-0 text-stone-300" size={20} />
            </div>
            <p className="mt-2 text-xs text-stone-500">EF {progress?.easeFactor.toFixed(2) ?? '2.50'} · 错误 {progress?.incorrect ?? 0}</p>
          </div>
        )
      })}
    </section>
  )
}

function PrimaryButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 text-lg font-semibold text-white" onClick={onClick}>{icon}{label}</button>
}

function SecondaryButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-white px-5 text-lg font-semibold ring-1 ring-stone-200" onClick={onClick}>{icon}{label}</button>
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
