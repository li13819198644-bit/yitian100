import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { LearningSnapshot } from '../types'
import type { AnalysisJob, DailyUpload, PersonalWordCard } from './dailyAnalysis'
import { getProgress, getSettings, getStats, saveProgress, saveSettings, saveStats, getGrammarProgress, saveGrammarProgress } from './db'

type SnapshotRow = {
  payload: LearningSnapshot
  updated_at: string
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | undefined

export function isCloudSyncConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

async function getClient() {
  if (!isCloudSyncConfigured()) {
    throw new Error('云同步还没配置 Supabase 环境变量')
  }
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  }
  return client
}

export function normalizeLoginName(value: string) {
  const loginName = value.trim()
  if (!loginName) return loginName
  return loginName.includes('@') ? loginName : `${loginName}@yitian100.local`
}

export async function getCloudUser(): Promise<User | null> {
  if (!isCloudSyncConfigured()) return null
  const { data, error } = await (await getClient()).auth.getUser()
  if (error) return null
  return data.user
}

export async function signUpToCloud(loginName: string, password: string) {
  const email = normalizeLoginName(loginName)
  const { data, error } = await (await getClient()).auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signInToCloud(loginName: string, password: string) {
  const email = normalizeLoginName(loginName)
  const { data, error } = await (await getClient()).auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOutFromCloud() {
  if (!isCloudSyncConfigured()) return
  const { error } = await (await getClient()).auth.signOut()
  if (error) throw error
}

export async function buildLocalSnapshot(): Promise<LearningSnapshot> {
  const [progress, settings, stats, grammar] = await Promise.all([getProgress(), getSettings(), getStats(), getGrammarProgress()])
  return {
    schemaVersion: 1,
    updatedAt: Date.now(),
    progress,
    settings,
    stats,
    grammar,
  }
}

export async function uploadLocalSnapshot() {
  const supabase = await getClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('请先登录再同步')

  const snapshot = await buildLocalSnapshot()
  const { error } = await supabase
    .from('learning_snapshots')
    .upsert({
      user_id: user.id,
      payload: snapshot,
      updated_at: new Date(snapshot.updatedAt).toISOString(),
    })
  if (error) throw error
  return snapshot
}

export async function downloadCloudSnapshot() {
  const supabase = await getClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('请先登录再恢复')

  const { data, error } = await supabase
    .from('learning_snapshots')
    .select('payload, updated_at')
    .eq('user_id', user.id)
    .maybeSingle<SnapshotRow>()
  if (error) throw error
  return data?.payload ?? null
}

export async function restoreCloudSnapshot() {
  const snapshot = await downloadCloudSnapshot()
  if (!snapshot) return null

  for (const item of snapshot.progress) {
    await saveProgress(item)
  }
  await saveSettings(snapshot.settings)
  await saveStats(snapshot.stats)
  if (snapshot.grammar) await saveGrammarProgress(snapshot.grammar)
  return snapshot
}

export async function uploadDailyLearningReport(payload: DailyUpload): Promise<AnalysisJob> {
  const { data, error } = await (await getClient()).rpc('upload_daily_learning_report', { p_payload: payload }).single<AnalysisJob>()
  if (error) throw error
  return data
}

export async function getDailyLearningState(): Promise<{ jobs: AnalysisJob[]; cards: PersonalWordCard[] }> {
  const supabase = await getClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('请先登录再读取分析')
  const [jobs, cards] = await Promise.all([
    supabase.from('latest_daily_analysis_jobs').select('id,report_date,revision,status,result,created_at,updated_at').eq('user_id', user.id).order('report_date', { ascending: false }).limit(14),
    supabase.from('personal_word_card_versions').select('word_id,content').eq('user_id', user.id).eq('is_active', true),
  ])
  if (jobs.error) throw jobs.error
  if (cards.error) throw cards.error
  return { jobs: jobs.data as AnalysisJob[], cards: cards.data as PersonalWordCard[] }
}

export async function acceptDailyWordCard(jobId: string, wordId: string) {
  const { error } = await (await getClient()).rpc('accept_daily_word_card', { p_job_id: jobId, p_word_id: wordId })
  if (error) throw error
}

export async function restoreOriginalWordCard(wordId: string) {
  const { error } = await (await getClient()).rpc('restore_original_word_card', { p_word_id: wordId })
  if (error) throw error
}
