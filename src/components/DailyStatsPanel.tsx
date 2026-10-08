import { useState } from 'react'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import { dailyReportFile, downloadDailyReport, type DailyReport } from '../lib/dailyReport'

export function DailyStatsPanel({ report, ready, onBack }: { report: DailyReport; ready: boolean; onBack: () => void }) {
  const [message, setMessage] = useState('')
  const [sharing, setSharing] = useState(false)
  const words = report.vocabulary
  const diagnostics = report.memoryDiagnostics
  const grammar = report.grammar
  const percent = (value: number | null) => value === null ? '未知' : `${value}%`
  const trial = (value: { successes: number; attempts: number; accuracy: number | null }) => value.attempts ? `${value.successes}/${value.attempts} · ${percent(value.accuracy)}` : '未知'
  async function share() {
    setMessage('')
    const file = dailyReportFile(report)
    setSharing(true)
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: `${report.date} 学习报告` })
      } else {
        downloadDailyReport(report)
        setMessage('报告已下载。')
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) setMessage('分享未完成，请使用旁边的下载按钮。')
    } finally { setSharing(false) }
  }
  return <section className="mt-4 space-y-5" aria-label="当天学习统计">
    <div className="flex items-center gap-3"><button className="icon-button shrink-0" aria-label="返回首页" title="返回首页" onClick={onBack}><ArrowLeft size={20} /></button><div><h2 className="text-xl font-bold">当天学习统计</h2><p className="mt-1 text-sm text-stone-500">{report.date}</p></div></div>
    <div className="flex gap-2">
      <button disabled={!ready || sharing} onClick={() => void share()} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-3 font-semibold text-white disabled:opacity-50"><Share2 size={19} />{sharing ? '分享中…' : '分享当天报告'}</button>
      <button disabled={!ready} aria-label="下载当天报告" title="下载当天报告" className="icon-button shrink-0" onClick={() => { downloadDailyReport(report); setMessage('报告已下载。') }}><Download size={20} /></button>
    </div>
    {message && <p role="status" className="text-sm text-stone-600">{message}</p>}
    {!ready ? <p role="status">正在读取学习记录…</p> : <>
      <div className="border-y border-stone-200 py-4">
        <h3 className="mb-4 text-lg font-bold">回忆证据与保持</h3>
        <dl className="grid grid-cols-2 gap-4">
          <Stat label="辨认 · 首答" value={trial(diagnostics.recognition)} />
          <Stat label="无提示回忆 · 自评首答" value={trial(diagnostics.selfReportedRecall)} />
          <Stat label="客观验证 · 首答" value={diagnostics.verifiedRecall.attempts ? trial(diagnostics.verifiedRecall) : '缺乏证据'} />
          <Stat label="跨天保持 · 自评" value={trial(diagnostics.crossDay.selfReportedRecall)} />
          <Stat label="跨天保持 · 客观验证" value={diagnostics.crossDay.verifiedRecall.attempts ? trial(diagnostics.crossDay.verifiedRecall) : '缺乏证据'} />
          <Stat label="7天间隔 · 自评" value={trial(diagnostics.sevenDay.selfReportedRecall)} />
          <Stat label="7天间隔 · 客观验证" value={diagnostics.sevenDay.verifiedRecall.attempts ? trial(diagnostics.sevenDay.verifiedRecall) : '缺乏证据'} />
          <Stat label="过期积压" value={diagnostics.overdueBacklog} />
          <Stat label="顽固词 · 当前" value={diagnostics.leeches.currentCount} />
          <Stat label="顽固词变化" value={diagnostics.leeches.change === null ? '未知' : `${diagnostics.leeches.change > 0 ? '+' : ''}${diagnostics.leeches.change}`} />
        </dl>
        <p className="mt-4 text-sm text-stone-500">排程巩固词 {diagnostics.schedulingConsolidatedWords}，是复习规则的判断；当前快速词卡与深度自评都不提供客观验证。</p>
        <p className="mt-2 text-sm text-stone-500">{diagnostics.coverage.statement}</p>
        {diagnostics.coverage.attemptsWithMissingEvents > 0 && <p className="mt-2 text-sm text-amber-800">{diagnostics.coverage.attemptsWithMissingEvents} 次历史作答缺少事件字段，不补造证据。</p>}
      </div>
      <div className="border-y border-stone-200 py-4">
        <h3 className="mb-4 text-lg font-bold">单词</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
          <Stat label="练习词数" value={words.uniqueWords} />
          <Stat label="总作答次数" value={words.attempts ?? '未记录'} />
          <Stat label="新学词 · 已记录" value={words.newWordsRecorded} />
          <Stat label="旧词 · 已记录" value={words.oldWordsRecorded} />
          <Stat label="测验首答正确率" value={percent(words.objectiveFirstAnswer.accuracy)} />
          <Stat label="旧版英文输入 · 作答" value={`${words.retrievalPractice.production.correct}/${words.retrievalPractice.production.count}`} />
          <Stat label="提示后答对 · 作答" value={`${words.retrievalPractice.assisted.correct}/${words.retrievalPractice.assisted.count}`} />
          <Stat label="词义回忆 · 自评" value={`${words.retrievalPractice.recall.correct}/${words.retrievalPractice.recall.count}`} />
          <Stat label="表达练习 · 自评" value={`${words.retrievalPractice.usage.correct}/${words.retrievalPractice.usage.count}`} />
          <Stat label="错词 · 已记录" value={words.mistakeWordsRecorded} />
        </dl>
        <details className="mt-4 text-sm text-stone-500"><summary className="min-h-11 cursor-pointer py-3">新记录按题型首答</summary><ul>{([['self', '快速自评'], ['choice', '选择'], ['recall', '词义回忆自评'], ['production', '旧版英文输入'], ['spelling', '拼写'], ['sentence', '组句'], ['assisted', '提示后作答'], ['usage', '表达自评']] as const).map(([mode, label]) => <li key={mode} className="py-1">{label}：{words.observedFirstAnswerByMode[mode].count ? `${words.observedFirstAnswerByMode[mode].correct}/${words.observedFirstAnswerByMode[mode].count} · ${percent(words.observedFirstAnswerByMode[mode].accuracy)}` : '未知'}</li>)}</ul></details>
        <p className="mt-2 text-sm text-stone-500">历史首测：选择首答 {words.firstAnswerByMode.choice.correct}/{words.firstAnswerByMode.choice.count} · 拼写首答 {words.firstAnswerByMode.spelling.correct}/{words.firstAnswerByMode.spelling.count} · 组句首答 {words.firstAnswerByMode.sentence.correct}/{words.firstAnswerByMode.sentence.count}</p>
        <p className="mt-1 text-sm text-stone-500">自评认识 {words.firstAnswerByMode.self.correct}/{words.firstAnswerByMode.self.count}；词义和表达也是自评，提示作答单独记录，均不计入客观测验正确率。</p>
        {words.detailCoverage === 'partial' && <p className="mt-3 text-sm text-amber-800">今日部分学习发生在更新前，逐词明细不完整{words.unclassifiedWords ? `，${words.unclassifiedWords} 个词无法区分新旧` : ''}。</p>}
      </div>
      <div className="border-b border-stone-200 pb-4">
        <h3 className="mb-4 text-lg font-bold">语法</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
          <Stat label="练习题数 · 已记录" value={grammar.uniqueQuestionsRecorded} />
          <Stat label="首答正确率" value={percent(grammar.firstAnswer.accuracy)} />
          <Stat label="作答次数 · 已记录" value={grammar.attemptsRecorded} />
          <Stat label="错题 · 已记录" value={grammar.mistakeQuestionsRecorded} />
        </dl>
        {grammar.detailCoverage === 'partial' && <p className="mt-3 text-sm text-amber-800">更新前的语法练习缺少当天明细，以下仅统计已记录的部分。</p>}
      </div>
      {words.uniqueWords === 0 && grammar.uniqueQuestionsRecorded === 0 && !grammar.legacyQuestionsWithoutDailyDetails && <p className="text-sm text-stone-500">今天还没有学习记录。</p>}
      {words.results.length > 0 && <details className="border-b border-stone-200 pb-4" open>
        <summary className="min-h-11 cursor-pointer font-semibold">单词明细 · {words.results.length} 个</summary>
        <ul className="divide-y divide-stone-200">{words.results.map((item) => <li key={item.id} className="py-3">
          <div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words font-semibold">{item.word}</p><span className="shrink-0 text-sm text-stone-500">{item.detail ? `${item.detail.attempts} 次 · ${item.recordedMistakes} 次未通过` : '明细未记录'}</span></div>
          <p className="mt-1 text-sm text-stone-600">{item.meaning}</p>
          <p className="mt-1 text-xs text-stone-500">{item.firstAnswer ? `首答${item.firstAnswer.mode === 'assisted' ? '提示作答' : ['self', 'recall', 'usage'].includes(item.firstAnswer.mode) ? '自评' : ''}：${item.firstAnswer.correct ? '通过' : '未通过'}` : '首答未记录'}{item.detail ? ` · 最近一次：${item.detail.lastCorrect ? '通过' : '未通过'}` : ''}</p>
        </li>)}</ul>
      </details>}
      {grammar.results.length > 0 && <details className="border-b border-stone-200 pb-4" open>
        <summary className="min-h-11 cursor-pointer font-semibold">语法明细 · {grammar.results.length} 题</summary>
        <ul className="divide-y divide-stone-200">{grammar.results.map((item) => <li key={item.questionId} className="space-y-2 py-3">
          <div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{item.topic}</span><span className="shrink-0 text-stone-500">{item.record.attempts} 次 · 错 {item.record.attempts - item.record.correct} 次</span></div>
          <p className="break-words text-sm" lang="en">{item.sentence}</p>
          {item.wrongAnswers.map((wrong) => <p key={wrong.answer} className="break-words text-sm text-rose-700">误选：{wrong.answer}（{wrong.count} 次）</p>)}
          <p className="break-words text-sm text-emerald-700">正确答案：{item.correctAnswer}</p>
        </li>)}</ul>
      </details>}
    </>}
  </section>
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="min-w-0"><dt className="text-xs text-stone-500">{label}</dt><dd className="mt-1 break-words text-2xl font-semibold">{value}</dd></div>
}
