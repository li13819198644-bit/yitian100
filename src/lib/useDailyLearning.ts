import { useCallback, useEffect, useRef, useState } from 'react'
import { acceptDailyWordCard, getDailyLearningState, restoreOriginalWordCard, uploadDailyLearningReport } from './cloudSync'
import type { AnalysisJob, DailyUpload, PersonalWordCard } from './dailyAnalysis'

type State = { jobs: AnalysisJob[]; cards: PersonalWordCard[] }
const emptyState: State = { jobs: [], cards: [] }
function isCachedState(value: unknown): value is State {
  if (!value || typeof value !== 'object' || !('jobs' in value) || !('cards' in value) || !Array.isArray(value.jobs) || !Array.isArray(value.cards)) return false
  return value.jobs.every(job => job && typeof job.id === 'string' && typeof job.report_date === 'string' && typeof job.updated_at === 'string'
    && ['pending', 'processing', 'completed', 'failed', 'superseded'].includes(job.status)
    && (job.result === null || job.result?.schemaVersion === 1 && Array.isArray(job.result.focusWords) && Array.isArray(job.result.cardDrafts) && job.result.evidence?.self && job.result.evidence?.recognition))
    && value.cards.every(card => typeof card?.word_id === 'string' && card.content && ['wordId', 'word', 'hook', 'example', 'translation'].every(key => typeof card.content[key] === 'string'))
}
export function dailyLearningError(error: unknown): string {
  const code = typeof error === 'object' && error ? String((error as { code?: string }).code ?? '') : ''
  if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(code)) return '云端日报功能尚未部署，请先完成数据库和分析服务配置。'
  if (code === 'PGRST301' || code === '42501') return '登录已失效，请重新登录云同步。'
  return '云端操作未完成，请检查网络后重试。本机学习记录仍已保留。'
}

export function useDailyLearning(account: string) {
  const [state, setState] = useState<State>(emptyState)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const currentAccount = useRef(account)
  currentAccount.current = account
  const pollUntil = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state
  const actionInFlight = useRef(false)
  const requestVersion = useRef(0)
  const stateOwner = useRef(account)

  const save = useCallback((next: State, owner: string) => {
    if (currentAccount.current !== owner) return
    stateOwner.current = owner
    stateRef.current = next
    setState(next)
    try { localStorage.setItem(`yitian100:daily-learning:${owner}`, JSON.stringify(next)) } catch { /* Network result is still usable without a cache. */ }
  }, [])
  const refresh = useCallback(async (owner = account) => {
    if (!owner) return
    const version = ++requestVersion.current
    const next = await getDailyLearningState()
    if (version !== requestVersion.current || currentAccount.current !== owner) return
    const justCompleted = next.jobs.some(job => job.status === 'completed' && stateRef.current.jobs.some(previous => previous.id === job.id && ['pending', 'processing'].includes(previous.status)))
    save(next, owner)
    if (justCompleted) setMessage('后台分析已完成，可以查看次日建议。')
  }, [account, save])

  useEffect(() => {
    requestVersion.current++
    stateOwner.current = account
    stateRef.current = emptyState
    setState(emptyState); setMessage(''); setBusy(false)
    if (!account) return
    try {
      const cached = JSON.parse(localStorage.getItem(`yitian100:daily-learning:${account}`) ?? 'null')
      if (isCachedState(cached)) { setState(cached); stateRef.current = cached }
    } catch { /* A corrupt cache does not replace the server result. */ }
    pollUntil.current = Date.now() + 120_000
    const load = () => { if (!actionInFlight.current) void refresh(account).catch(() => { /* Keep the cached plan when offline. Upload reports explicit errors. */ }) }
    load()
    const focus = () => { pollUntil.current = Date.now() + 120_000; load() }
    const timer = window.setInterval(() => {
      if (Date.now() < pollUntil.current && stateRef.current.jobs.some(job => ['pending', 'processing'].includes(job.status))) load()
    }, 5000)
    window.addEventListener('focus', focus)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', focus) }
  }, [account, refresh])

  async function perform(action: (owner: string) => Promise<void>) {
    if (actionInFlight.current) return
    if (!account) { setMessage('请先登录云同步。'); return }
    actionInFlight.current = true
    const owner = account
    setBusy(true); setMessage('')
    try { await action(owner) }
    catch (error) { if (currentAccount.current === owner) setMessage(dailyLearningError(error)) }
    finally {
      actionInFlight.current = false
      if (currentAccount.current === owner) setBusy(false)
      else if (currentAccount.current) void refresh(currentAccount.current).catch(() => {})
    }
  }

  return {
    ...(stateOwner.current === account ? state : emptyState), busy, message,
    upload: (payload: DailyUpload) => perform(async owner => {
      requestVersion.current++
      const job = await uploadDailyLearningReport(payload)
      if (currentAccount.current !== owner) return
      requestVersion.current++
      save({ ...stateRef.current, jobs: [job, ...stateRef.current.jobs.filter(item => item.report_date !== job.report_date)] }, owner)
      pollUntil.current = Date.now() + 120_000
      setMessage(job.status === 'completed' ? '当天记录已保存，分析已完成。' : '当天记录已上传，后台正在分析。可以关闭页面，稍后回来查看。')
    }),
    accept: (jobId: string, wordId: string) => perform(async owner => { await acceptDailyWordCard(jobId, wordId); await refresh(owner); if (currentAccount.current === owner) setMessage('已采用这张个人词卡，原版仍可恢复。') }),
    restore: (wordId: string) => perform(async owner => { await restoreOriginalWordCard(wordId); await refresh(owner); if (currentAccount.current === owner) setMessage('已恢复原词卡，旧版本仍保存在云端。') }),
    reload: () => perform(async owner => { pollUntil.current = Date.now() + 120_000; await refresh(owner) }),
  }
}
