import type { AppStats, GrammarProgress, StudyMode, VocabWord, WordProgress } from '../types'
import { evidenceSummary } from './memoryEvidence'
import { memoryDiagnostics } from './memoryDiagnostics'
import { grammarQuestions, grammarTopics } from '../data/grammar'
import { isObjectiveMode, localDateKey } from './studyStats'

function ratio(correct: number, count: number) {
  return { correct, count, accuracy: count ? Math.round(correct / count * 100) : null }
}

export function buildDailyReport(words: VocabWord[], progress: WordProgress[], stats: AppStats, grammar: GrammarProgress[], now = Date.now()) {
  const date = localDateKey(new Date(now))
  const day = stats.dailyHistory?.find((entry) => entry.date === date)
  const wordMap = new Map(words.map((word) => [word.id, word]))
  const progressMap = new Map(progress.map((item) => [item.wordId, item]))
  const ids = new Set([...Object.keys(day?.firstAnswers ?? {}), ...Object.keys(day?.wordDetails ?? {}), ...(stats.todayDate === date ? stats.todaySeen : [])])
  const wordResults = [...ids].map((id) => {
    const word = wordMap.get(id)
    const detail = day?.wordDetails?.[id] ?? null
    return {
      id, word: word?.word ?? id, meaning: word?.meaning ?? null,
      firstAnswer: day?.firstAnswers[id] ?? null,
      recordedMistakes: detail ? detail.attempts - detail.correct : null,
      detail,
      currentProgress: progressMap.get(id) ?? null,
      memoryEvidence: evidenceSummary(progressMap.get(id)),
    }
  }).sort((a, b) => (b.recordedMistakes ?? -1) - (a.recordedMistakes ?? -1) || a.word.localeCompare(b.word))
  const firstAnswers = Object.values(day?.firstAnswers ?? {})
  const objective = wordResults.flatMap((item) => {
    const first = item.detail?.firstTestAnswer ?? (item.firstAnswer && isObjectiveMode(item.firstAnswer.mode) ? item.firstAnswer : null)
    return first && isObjectiveMode(first.mode) ? [first] : []
  })
  const modeFirst = (mode: StudyMode) => {
    const subset = (['self', 'recall', 'usage', 'assisted'].includes(mode) ? firstAnswers : objective).filter((answer) => answer.mode === mode)
    return ratio(subset.filter((answer) => answer.correct).length, subset.length)
  }
  const detailedAttempts = wordResults.reduce((sum, item) => sum + (item.detail?.attempts ?? 0), 0)
  const questionResults = grammar.flatMap((item) => {
    const record = item.dailyHistory?.find((entry) => entry.date === date)
    if (!record) return []
    const question = grammarQuestions.find((q) => q.id === item.questionId)
    return [{
      questionId: item.questionId,
      topic: grammarTopics.find((topic) => topic.id === question?.topicId)?.title ?? null,
      sentence: question?.sentence ?? null,
      correctAnswer: question?.options[question.answer] ?? null,
      explanation: question?.explanation ?? null,
      wrongAnswers: Object.entries(record.wrongOptions).map(([index, count]) => ({ answer: question?.options[Number(index)] ?? index, count })),
      record, nextReviewAt: item.nextReviewAt,
    }]
  }).sort((a, b) => (b.record.attempts - b.record.correct) - (a.record.attempts - a.record.correct))
  const grammarFirst = questionResults.filter((item) => item.record.firstCorrect !== null)
  const legacyGrammarToday = grammar.filter((item) => localDateKey(new Date(item.updatedAt)) === date && !item.dailyHistory?.some((entry) => entry.date === date)).length
  return {
    schemaVersion: 1, reportType: 'daily-learning', app: '一天100词', date,
    exportedAt: new Date(now).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    memoryDiagnostics: memoryDiagnostics(words, progress, stats, now),
    vocabulary: {
      observedFirstAnswerByMode: Object.fromEntries((['self', 'choice', 'recall', 'production', 'spelling', 'sentence', 'assisted', 'usage'] as const).map((mode) => {
        const answers = wordResults.flatMap((item) => item.detail?.observedFirstByMode?.[mode] ? [item.detail.observedFirstByMode[mode]!] : [])
        return [mode, ratio(answers.filter((answer) => answer.correct).length, answers.length)]
      })) as Record<StudyMode, ReturnType<typeof ratio>>,
      retrievalPractice: Object.fromEntries((['recall', 'production', 'assisted', 'usage'] as const).map((mode) => {
        const attempts = wordResults.reduce((sum, item) => sum + (item.detail?.modes[mode]?.attempts ?? 0), 0)
        const correct = wordResults.reduce((sum, item) => sum + (item.detail?.modes[mode]?.correct ?? 0), 0)
        return [mode, ratio(correct, attempts)]
      })) as Record<'recall' | 'production' | 'assisted' | 'usage', ReturnType<typeof ratio>>,
      uniqueWords: ids.size,
      attempts: day?.attempts ?? (ids.size ? null : 0),
      correct: day?.correct ?? (ids.size ? null : 0),
      objectiveFirstAnswer: ratio(objective.filter((answer) => answer.correct).length, objective.length),
      firstAnswerByMode: { choice: modeFirst('choice'), spelling: modeFirst('spelling'), sentence: modeFirst('sentence'), self: modeFirst('self'), recall: modeFirst('recall'), production: modeFirst('production'), assisted: modeFirst('assisted'), usage: modeFirst('usage') },
      detailedAttempts,
      detailCoverage: detailedAttempts === (day?.attempts ?? 0) && ids.size === firstAnswers.length ? 'complete' : 'partial',
      newWordsRecorded: wordResults.filter((item) => item.detail?.newWord === true).length,
      oldWordsRecorded: wordResults.filter((item) => item.detail?.newWord === false).length,
      unclassifiedWords: wordResults.filter((item) => item.detail?.newWord == null).length,
      mistakeWordsRecorded: wordResults.filter((item) => (item.recordedMistakes ?? 0) > 0).length,
      results: wordResults,
    },
    grammar: {
      uniqueQuestionsRecorded: questionResults.length,
      attemptsRecorded: questionResults.reduce((sum, item) => sum + item.record.attempts, 0),
      correctRecorded: questionResults.reduce((sum, item) => sum + item.record.correct, 0),
      firstAnswer: ratio(grammarFirst.filter((item) => item.record.firstCorrect).length, grammarFirst.length),
      mistakeQuestionsRecorded: questionResults.filter((item) => item.record.attempts > item.record.correct).length,
      legacyQuestionsWithoutDailyDetails: legacyGrammarToday,
      detailCoverage: legacyGrammarToday || questionResults.some((item) => item.record.partial) ? 'partial' : 'complete',
      results: questionResults,
    },
    measurement: {
      date: '按设备本地自然日统计；保留最近90个有记录的学习日。',
      firstAnswer: '每个词或语法题当天第一次作答；之后纠正不改写。测验首答另取该词当天第一次选择、拼写或组句，自评词义、表达自评及提示作答不会占用测验首答；旧记录不足时只代表已记录的首次测验。',
      retrieval: 'recall 为无选项词义回忆自评；choice 为英文选词辨认；production 保留旧版无选项英文输入记录；assisted 为主动选择需要提示后的作答；usage 为心里表达自评。提示答对不提高记忆强度；recall、assisted、usage 不计入客观测验正确率。retrievalPractice 为各模式作答次数，含同日重复，不等于长期掌握率。',
      sentence: '组句按还原参考例句语序计分，不是自由造句语法评分；单独记录为sentence。',
      missingData: '更新前未记录的细节不补造；recorded 字段只计算新记录，null 表示未知，currentProgress 是导出时累计状态，不是当天数据。',
      newWords: '首次记录该词学习进度时记为新词；同日多次作答只算一个词。',
      evidence: 'mastered 是排程巩固条件，不是客观掌握证据；stability 为规则使用的天数尺度，difficultyScore 为1至10的调度难度，均未经个人记忆模型校准。新字段采用可选字段，旧数据及云快照不反推。',
      timing: 'responseDurationMs 为词卡出现至点击揭示的时间，不是客观作答速度；发生切后台时留为null。intervalSinceLastReview 从已记录的lastStudiedAt及之后的解释浏览时间计算，无lastStudiedAt为null；浏览解释会重新起算间隔。',
      practiceDay: 'practiceDay/mistakesToday 记录最近发生练习的日期与当日错误数；不学习时保持旧日期属于预期行为。只有practiceDay等于当前本地日期时才用于当日冷却。',
      limitations: '未记录实际误选内容；当前揭示式词卡只有自评，没有客观验证。深度自评仍不是客观验证，不能以此声称记忆提升。',
    },
  }
}

export type DailyReport = ReturnType<typeof buildDailyReport>

export function dailyReportFile(report: DailyReport) {
  return new File([JSON.stringify(report, null, 2)], `yitian100-daily-report-${report.date}.json`, { type: 'application/json' })
}

export function downloadDailyReport(report: DailyReport) {
  const file = dailyReportFile(report)
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url; link.download = file.name
  document.body.append(link); link.click(); link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
