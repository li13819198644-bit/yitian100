export type EvidenceMode = 'self' | 'choice' | 'spelling' | 'sentence' | 'recall' | 'production' | 'assisted' | 'usage'
export interface LearningWord {
  id: string
  word: string
  meaning: string
  firstAnswer: { correct: boolean; mode: EvidenceMode } | null
  attempts: number | null
  mistakes: number | null
  newWord: boolean | null
  card: { hook: string; breakdown: string; collocation: string; example: string } | null
}
export interface DailyUpload {
  schemaVersion: 1
  date: string
  timeZone: string
  preferences: { reliefMode: boolean; dailyTarget: number }
  vocabulary: { uniqueWords: number; detailCoverage: 'complete' | 'partial'; results: LearningWord[] }
  grammar: { questions: number; firstCorrect: number; firstCount: number }
}
export interface CardDraft {
  wordId: string
  word: string
  hook: string
  example: string
  translation: string
}
export interface DailyAnalysis {
  schemaVersion: 1
  algorithmVersion: 'rules-v1'
  sourceDate: string
  planDate: string
  timeZone: string
  analyzedDays: number
  reviewWords: number
  newWords: number
  reason: string
  evidence: {
    self: { count: number; known: number }
    recognition: { count: number; known: number }
    production: { count: number; known: number }
    assisted: { count: number; known: number }
    crossDaySelf: { count: number; known: number }
    partialDays: number
  }
  focusWords: Array<{ id: string; word: string; reason: string; unknownDays: number }>
  cardDrafts: CardDraft[]
  draftStatus: 'disabled' | 'generated' | 'unavailable' | 'not-needed'
  measurement: string
}

const modes: EvidenceMode[] = ['self', 'choice', 'spelling', 'sentence', 'recall', 'production', 'assisted', 'usage']
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max
const count = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100_000

export function offsetDate(date: string, offset: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10)
}

// Validate again at the worker boundary: authenticated uploads are still untrusted input.
export function parseDailyUpload(value: unknown): DailyUpload {
  const invalid = () => { throw new Error('invalid_daily_report') }
  if (!isObject(value) || value.schemaVersion !== 1 || !text(value.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return invalid()
  if (!Number.isFinite(Date.parse(`${value.date}T12:00:00Z`)) || offsetDate(value.date, 0) !== value.date) return invalid()
  if (!text(value.timeZone, 100)) return invalid()
  try { new Intl.DateTimeFormat('en', { timeZone: value.timeZone }).format() } catch { return invalid() }
  const prefs = value.preferences, vocabulary = value.vocabulary, grammar = value.grammar
  if (!isObject(prefs) || typeof prefs.reliefMode !== 'boolean' || !count(prefs.dailyTarget) || prefs.dailyTarget > 200) return invalid()
  if (!isObject(vocabulary) || !count(vocabulary.uniqueWords) || !['complete', 'partial'].includes(String(vocabulary.detailCoverage)) || !Array.isArray(vocabulary.results) || vocabulary.results.length > 1000 || vocabulary.uniqueWords !== vocabulary.results.length) return invalid()
  const ids = new Set<string>()
  for (const word of vocabulary.results) {
    if (!isObject(word) || !text(word.id, 150) || !word.id || ids.has(word.id) || !text(word.word, 150) || !word.word || !text(word.meaning, 1000)) return invalid()
    ids.add(word.id)
    if (word.firstAnswer !== null && (!isObject(word.firstAnswer) || typeof word.firstAnswer.correct !== 'boolean' || !modes.includes(word.firstAnswer.mode as EvidenceMode))) return invalid()
    if (word.attempts !== null && !count(word.attempts) || word.mistakes !== null && !count(word.mistakes)) return invalid()
    if (word.attempts !== null && word.mistakes !== null && Number(word.mistakes) > Number(word.attempts)) return invalid()
    if (word.newWord !== null && typeof word.newWord !== 'boolean') return invalid()
    if (word.card !== null && (!isObject(word.card) || !text(word.card.hook, 1000) || !text(word.card.breakdown, 2000) || !text(word.card.collocation, 1000) || !text(word.card.example, 1500))) return invalid()
  }
  if (!isObject(grammar) || !count(grammar.questions) || !count(grammar.firstCorrect) || !count(grammar.firstCount) || grammar.firstCorrect > grammar.firstCount || grammar.firstCount > grammar.questions) return invalid()
  // Rebuild the object to strip unexpected fields such as snapshots, tokens, and prompts.
  return {
    schemaVersion: 1, date: value.date, timeZone: value.timeZone,
    preferences: { reliefMode: prefs.reliefMode, dailyTarget: prefs.dailyTarget },
    vocabulary: {
      uniqueWords: vocabulary.uniqueWords, detailCoverage: vocabulary.detailCoverage as 'complete' | 'partial',
      results: vocabulary.results.map(word => ({
        id: word.id, word: word.word, meaning: word.meaning,
        firstAnswer: word.firstAnswer ? { mode: word.firstAnswer.mode, correct: word.firstAnswer.correct } : null,
        attempts: word.attempts, mistakes: word.mistakes, newWord: word.newWord,
        card: word.card ? { hook: word.card.hook, breakdown: word.card.breakdown, collocation: word.card.collocation, example: word.card.example } : null,
      })),
    },
    grammar: { questions: grammar.questions, firstCount: grammar.firstCount, firstCorrect: grammar.firstCorrect },
  }
}

export function analyzeDailyReports(input: DailyUpload[], sourceDate: string): DailyAnalysis {
  // Last upload wins within a date; a repeated upload is not another study day.
  const byDate = new Map(input.filter(r => r.date <= sourceDate && r.date >= offsetDate(sourceDate, -13)).map(r => [r.date, r]))
  const reports = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
  const source = byDate.get(sourceDate)
  if (!source) throw new Error('source_report_missing')
  const evidence: DailyAnalysis['evidence'] = {
    self: { count: 0, known: 0 }, recognition: { count: 0, known: 0 }, production: { count: 0, known: 0 }, assisted: { count: 0, known: 0 },
    crossDaySelf: { count: 0, known: 0 }, partialDays: reports.filter(r => r.vocabulary.detailCoverage === 'partial').length,
  }
  const history = new Map<string, { word: string; unknownDays: number; forgotten: number; previousSelf?: boolean }>()
  const recent = reports.filter(r => r.date >= offsetDate(sourceDate, -2))
  let recentSelf = 0, recentKnown = 0, recentSelfDays = 0
  for (const report of reports) {
    let selfToday = 0
    for (const word of report.vocabulary.results) {
      const answer = word.firstAnswer
      const item = history.get(word.id) ?? { word: word.word, unknownDays: 0, forgotten: 0 }
      if (answer) {
        const group = ['self', 'recall'].includes(answer.mode) ? 'self' : ['spelling', 'production'].includes(answer.mode) ? 'production' : ['choice', 'sentence'].includes(answer.mode) ? 'recognition' : 'assisted'
        evidence[group].count++
        if (answer.correct) evidence[group].known++
        if (group === 'self') {
          selfToday++
          if (recent.includes(report)) { recentSelf++; if (answer.correct) recentKnown++ }
          if (item.previousSelf === true) {
            evidence.crossDaySelf.count++
            if (answer.correct) evidence.crossDaySelf.known++
            else item.forgotten++
          }
          item.previousSelf = answer.correct
        }
        if (!answer.correct) item.unknownDays++
      }
      history.set(word.id, item)
    }
    if (recent.includes(report) && selfToday >= 5) recentSelfDays++
  }
  const selfRate = recentSelf ? recentKnown / recentSelf : null
  const crossRate = evidence.crossDaySelf.count ? evidence.crossDaySelf.known / evidence.crossDaySelf.count : null
  let reviewWords = 25, newWords = 0
  let reason = '跨天记录还少，先保持每天25个旧词，暂停新词；继续观察首次自评。'
  if (recentSelf >= 5 && (selfRate! < 0.6 || evidence.crossDaySelf.count >= 5 && crossRate! < 0.6)) {
    reviewWords = 15
    reason = '近期首次自评不会或跨天遗忘较多，降到15个旧词，先稳住已学内容。'
  } else if (recentSelf >= 5 && selfRate! < 0.8) {
    reviewWords = 20
    reason = '近期首次自评仍有较多不会，先安排20个旧词，暂停新词。'
  } else if (recentSelfDays >= 3 && selfRate! >= 0.85 && evidence.crossDaySelf.count >= 5 && crossRate! >= 0.8 && recent.every(r => r.vocabulary.detailCoverage === 'complete')) {
    reviewWords = 20
    newWords = source.preferences.reliefMode ? 0 : Math.min(5, source.preferences.dailyTarget)
    reason = newWords ? `连续几天首次自评较稳定，安排20个旧词和${newWords}个新词；仍需继续观察。` : '连续几天首次自评较稳定，安排20个旧词；按减负设置继续暂停新词。'
  }
  const focusWords = [...history].filter(([, item]) => item.unknownDays > 0)
    .sort((a, b) => b[1].forgotten - a[1].forgotten || b[1].unknownDays - a[1].unknownDays || a[0].localeCompare(b[0]))
    .slice(0, 10).map(([id, item]) => ({ id, word: item.word, unknownDays: item.unknownDays, reason: item.forgotten ? `有${item.forgotten}次前次自评会、跨天首答又不会` : `${item.unknownDays}个学习日的首答未通过` }))
  return {
    schemaVersion: 1, algorithmVersion: 'rules-v1', sourceDate, planDate: offsetDate(sourceDate, 1), timeZone: source.timeZone,
    analyzedDays: reports.filter(report => report.vocabulary.uniqueWords > 0 || report.grammar.questions > 0).length, reviewWords, newWords, reason, evidence, focusWords, cardDrafts: [], draftStatus: 'disabled',
    measurement: '会／不会是自评，选择与组句是辨认类练习，输入类首答单列；同日重复不增加跨天证据，均不直接证明长期掌握。缺少的记录保持未知。',
  }
}

export function parseCardDrafts(value: unknown, words: LearningWord[]): CardDraft[] {
  if (!isObject(value) || !Array.isArray(value.drafts) || value.drafts.length > 3) throw new Error('invalid_card_drafts')
  const seen = new Set<string>()
  return value.drafts.map(draft => {
    if (!isObject(draft) || !text(draft.wordId, 150)) throw new Error('invalid_card_drafts')
    const word = words.find(w => w.id === draft.wordId)
    if (!word || seen.has(word.id) || !text(draft.hook, 120) || draft.hook.length < 10 || !text(draft.example, 300) || !draft.example.toLowerCase().includes(word.word.toLowerCase()) || !text(draft.translation, 300) || !draft.translation.trim()) throw new Error('invalid_card_drafts')
    seen.add(word.id)
    return { wordId: word.id, word: word.word, hook: draft.hook, example: draft.example, translation: draft.translation }
  })
}
