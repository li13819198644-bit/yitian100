import { CloudUpload } from 'lucide-react'
import type { AnalysisJob, PersonalWordCard } from '../lib/dailyAnalysis'

export function DailyAnalysisPanel({ date, ready, signedIn, configured, job, previousJob, cards, busy, message, onUpload, onLogin, onRefresh, onAccept, onRestore }: {
  date: string; ready: boolean; signedIn: boolean; configured: boolean; job?: AnalysisJob
  previousJob?: AnalysisJob
  cards: PersonalWordCard[]; busy: boolean; message: string
  onUpload: () => void; onLogin: () => void; onRefresh: () => void
  onAccept: (jobId: string, wordId: string) => void; onRestore: (wordId: string) => void
}) {
  const resultJob = job?.status === 'completed' ? job : previousJob
  const result = resultJob?.status === 'completed' ? resultJob.result : null
  const status = job ? ({ pending: '已上传，等待分析', processing: '后台分析中', completed: '分析已完成', failed: '分析失败，可重试', superseded: '已有更新的记录' })[job.status] : '当天记录尚未上传'
  return <div className="space-y-3 rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100" aria-label="云端每日分析">
    <h3 className="font-semibold">上传与每日分析</h3>
    <button disabled={!ready || busy || !configured} onClick={signedIn ? onUpload : onLogin} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-3 font-semibold text-white disabled:opacity-50"><CloudUpload size={19} />{busy ? '正在处理…' : !signedIn ? '登录并上传今日记录' : job?.status === 'failed' ? '重新上传并重试分析' : '上传今日记录'}</button>
    {!configured ? <p className="text-sm text-stone-600">请先在云同步设置中配置服务。</p> : <p role="status" className="text-sm text-stone-700">{status}{job ? ` · ${date}，第${job.revision}版` : ''}</p>}
    {job && <p className="text-xs text-stone-500">保存时间：{new Date(job.created_at).toLocaleString()}。同一天重复上传会更新日报，不增加学习次数。</p>}
    {message && <p role="status" className="text-sm text-stone-700">{message}</p>}
    {signedIn && job && job.status !== 'completed' && <button disabled={busy} className="min-h-11 text-sm font-semibold underline" onClick={onRefresh}>刷新分析状态</button>}
    {result && <>
      {result.sourceDate !== date && <p className="text-xs text-stone-600">最近分析来自 {result.sourceDate} 的记录。</p>}
      <p className="font-semibold">{result.planDate} 建议：{result.reviewWords}个旧词 · {result.newWords}个新词</p>
      <p className="text-sm leading-6">{result.reason}</p>
      <p className="text-xs leading-5 text-stone-600">已分析{result.analyzedDays}个学习日；首次自评会 {result.evidence.self.known}/{result.evidence.self.count}，辨认类首答 {result.evidence.recognition.known}/{result.evidence.recognition.count}。{result.measurement}</p>
      {result.focusWords.length > 0 && <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">优先关注的词</summary><ul className="space-y-2 text-sm">{result.focusWords.map(word => <li key={word.id}><strong>{word.word}</strong>：{word.reason}</li>)}</ul></details>}
      {result.cardDrafts.length > 0 && <div className="space-y-3"><p className="text-sm font-semibold">个人助记草稿 · 采用后生效</p>{result.cardDrafts.map(draft => {
        const active = cards.some(card => card.word_id === draft.wordId && card.content.hook === draft.hook)
        return <div key={draft.wordId} className="space-y-2 rounded-lg bg-white p-3"><strong>{draft.word}</strong><p className="text-sm leading-6">{draft.hook}</p><p className="text-sm" lang="en">{draft.example}</p><p className="text-sm text-stone-600">{draft.translation}</p><button disabled={busy} className="min-h-11 text-sm font-semibold underline" onClick={() => active ? onRestore(draft.wordId) : onAccept(resultJob!.id, draft.wordId)}>{active ? '恢复原词卡' : '采用这张词卡'}</button></div>
      })}</div>}
      {result.draftStatus === 'unavailable' && <p className="text-sm text-stone-600">助记草稿暂时生成失败，学习安排已完成。</p>}
      {result.draftStatus === 'disabled' && <p className="text-sm text-stone-600">本次生成了学习安排，助记草稿功能尚未启用。</p>}
    </>}
  </div>
}
