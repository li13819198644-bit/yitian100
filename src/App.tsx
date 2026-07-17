import { useEffect, useMemo, useState } from 'react'
import { BarChart3, BookOpen, Check, ChevronRight, Download, Home, RotateCcw, Settings, Upload, X } from 'lucide-react'
import clsx from 'clsx'
import type { AppSettings, AppStats, QuizMode, Rating, Screen, VocabWord, WordProgress } from './types'
import { createProgress, accuracy, chooseDailyWords, isWeak, scheduleReview } from './lib/srs'
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

const actionMap: Record<Rating, { label: string; className: string }> = {
  known: { label: '认识', className: 'bg-emerald-600 text-white' },
  fuzzy: { label: '模糊', className: 'bg-amber-500 text-white' },
  unknown: { label: '不认识', className: 'bg-rose-600 text-white' },
}

function blankStats(): AppStats {
  return defaultStats()
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [words, setWords] = useState<VocabWord[]>([])
  const [progress, setProgress] = useState<WordProgress[]>([])
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [stats, setStats] = useState<AppStats>(blankStats)
  const [activeIndex, setActiveIndex] = useState(0)
  const [quizMode, setQuizMode] = useState<QuizMode>('en-zh')
  const [feedback, setFeedback] = useState<string>('')
  const [importMessage, setImportMessage] = useState('')

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
  }, [])

  const progressMap = useMemo(() => new Map(progress.map((item) => [item.wordId, item])), [progress])
  const dailyWords = useMemo(
    () => chooseDailyWords(words, progress, settings.dailyTarget),
    [words, progress, settings.dailyTarget],
  )
  const reviewWords = useMemo(
    () => words.filter((word) => (progressMap.get(word.id)?.nextReviewAt ?? Number.POSITIVE_INFINITY) <= Date.now()),
    [words, progressMap],
  )
  const weakWords = useMemo(() => words.filter((word) => {
    const item = progressMap.get(word.id)
    return item ? isWeak(item) : false
  }), [words, progressMap])
  const mastered = progress.filter((item) => item.mastered).length
  const progressStudiedToday = progress.filter((item) => todayKey(new Date(item.updatedAt)) === todayKey()).length
  const todayProgress = Math.max(stats.todayDate === todayKey() ? stats.todaySeen.length : 0, progressStudiedToday)
  const todayAccuracy = accuracy(progress)
  const activeWord = dailyWords[activeIndex % Math.max(dailyWords.length, 1)]

  async function rateWord(word: VocabWord, rating: Rating) {
    const existing = progressMap.get(word.id) ?? createProgress(word.id)
    const updated = scheduleReview(existing, rating)
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
    setFeedback(`${word.word}: ${actionMap[rating].label}`)
    setActiveIndex((index) => index + 1)
    await refresh()
  }

  function quizPrompt(word: VocabWord) {
    if (quizMode === 'en-zh') return { question: word.word, answer: word.meaning }
    if (quizMode === 'zh-en') return { question: word.meaning, answer: word.word }
    if (quizMode === 'context') return { question: word.example.replace(new RegExp(word.word, 'i'), '_____'), answer: word.word }
    return { question: word.word, answer: word.meaning }
  }

  function choices(word: VocabWord) {
    const answer = quizPrompt(word).answer
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
    const next = { ...settings, dailyTarget: Math.max(5, Math.min(200, value)) }
    setSettings(next)
    await saveSettings(next)
  }

  return (
    <main className="min-h-dvh bg-[#f7f4ef] text-stone-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
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
                  <p className="text-sm text-stone-500">今日进度</p>
                  <p className="mt-1 text-4xl font-semibold">{Math.min(todayProgress, settings.dailyTarget)}/{settings.dailyTarget}</p>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">B2 → C1</span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-stone-100">
                <div className="h-3 rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (todayProgress / settings.dailyTarget) * 100)}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric label="正确率" value={`${todayAccuracy}%`} />
              <Metric label="Combo" value={stats.combo} />
              <Metric label="连续学习" value={`${stats.streak} 天`} />
              <Metric label="已掌握" value={mastered} />
              <Metric label="弱词" value={weakWords.length} />
              <Metric label="复习队列" value={reviewWords.length} />
            </div>

            <div className="grid gap-3">
              <PrimaryButton onClick={() => { setActiveIndex(0); setScreen('learn') }} icon={<BookOpen size={20} />} label="开始今日学习" />
              <SecondaryButton onClick={() => { setActiveIndex(0); setScreen('quiz') }} icon={<BarChart3 size={20} />} label="进入测验" />
            </div>
          </section>
        )}

        {screen === 'learn' && activeWord && (
          <WordCard title={`第 ${Math.floor(activeIndex / 5) + 1} 组 / 20`} word={activeWord} progress={progressMap.get(activeWord.id)}>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(actionMap) as Rating[]).map((rating) => (
                <button key={rating} className={clsx('tap-button', actionMap[rating].className)} onClick={() => rateWord(activeWord, rating)}>
                  {actionMap[rating].label}
                </button>
              ))}
            </div>
          </WordCard>
        )}

        {screen === 'quiz' && activeWord && (
          <QuizCard
            mode={quizMode}
            setMode={setQuizMode}
            word={activeWord}
            prompt={quizPrompt(activeWord)}
            choices={choices(activeWord)}
            onAnswer={(correct) => rateWord(activeWord, correct ? 'known' : 'unknown')}
          />
        )}

        {screen === 'review' && <WordList title="复习队列" words={reviewWords} progressMap={progressMap} empty="现在没有到期复习词。" />}
        {screen === 'weak' && <WordList title="弱词本" words={weakWords} progressMap={progressMap} empty="还没有弱词。" />}

        {screen === 'settings' && (
          <section className="space-y-4">
            <Panel title="设置">
              <label className="block text-sm font-medium text-stone-700">每日目标</label>
              <input className="mt-2 w-full accent-emerald-700" type="range" min="20" max="200" step="5" value={settings.dailyTarget} onChange={(event) => updateDailyTarget(Number(event.target.value))} />
              <div className="mt-1 text-sm text-stone-500">{settings.dailyTarget} 词 / 天</div>
              <button className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 font-medium text-white" onClick={() => setScreen('import')}>
                <Upload size={18} /> 导入词库
              </button>
              <button className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 font-medium text-rose-700 ring-1 ring-rose-200" onClick={async () => { await resetProgress(); await refresh() }}>
                <RotateCcw size={18} /> 重置学习进度
              </button>
            </Panel>
          </section>
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
          <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
            <NavButton active={screen === 'home'} onClick={() => setScreen('home')} icon={<Home size={20} />} label="首页" />
            <NavButton active={screen === 'learn'} onClick={() => setScreen('learn')} icon={<BookOpen size={20} />} label="学习" />
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

function WordCard({ title, word, progress, children }: { title: string; word: VocabWord; progress?: WordProgress; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>{title}</span>
        <span>难度 {word.difficulty} · {word.level}</span>
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <p className="text-4xl font-semibold">{word.word}</p>
        <p className="mt-2 text-stone-500">{word.phonetic}</p>
        <p className="mt-5 text-2xl font-medium">{word.meaning}</p>
        <div className="mt-5 space-y-3 rounded-lg bg-stone-50 p-4 text-left">
          <p className="font-medium">{word.collocation}</p>
          <p className="leading-7 text-stone-600">{word.example}</p>
        </div>
        <p className="mt-4 text-sm text-stone-500">复习 {progress?.repetitions ?? 0} 次 · lapses {progress?.lapses ?? 0}</p>
      </div>
      {children}
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
  useEffect(() => setAnswered(''), [word.id, mode])
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[
          ['en-zh', '英中'],
          ['zh-en', '中英'],
          ['context', '填空'],
          ['swipe', '快刷'],
        ].map(([key, label]) => (
          <button key={key} className={clsx('min-h-11 rounded-lg text-sm font-medium ring-1 ring-stone-200', mode === key ? 'bg-stone-900 text-white' : 'bg-white')} onClick={() => setMode(key as QuizMode)}>
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm text-stone-500">{mode === 'swipe' ? '快刷判断' : '即时反馈'}</p>
        <p className="mt-4 text-3xl font-semibold leading-tight">{prompt.question}</p>
        {mode === 'swipe' ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="tap-button bg-emerald-600 text-white" onClick={() => onAnswer(true)}><Check size={18} /> 认识</button>
            <button className="tap-button bg-rose-600 text-white" onClick={() => onAnswer(false)}><X size={18} /> 不认识</button>
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
    <button className={clsx('flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs', active ? 'text-emerald-700' : 'text-stone-500')} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

export default App
