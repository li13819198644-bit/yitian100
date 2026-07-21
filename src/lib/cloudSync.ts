import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { LearningSnapshot } from '../types'
import { getProgress, getSettings, getStats, saveProgress, saveSettings, saveStats } from './db'

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
  const [progress, settings, stats] = await Promise.all([getProgress(), getSettings(), getStats()])
  return {
    schemaVersion: 1,
    updatedAt: Date.now(),
    progress,
    settings,
    stats,
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
  return snapshot
}
