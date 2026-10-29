import { randomBytes } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const ref = process.env.SUPABASE_PROJECT_REF ?? ''
const accessToken = process.env.SUPABASE_ACCESS_TOKEN ?? ''
if (!/^[a-z0-9]{10,40}$/.test(ref) || !accessToken) throw new Error('请配置 SUPABASE_PROJECT_REF 和 SUPABASE_ACCESS_TOKEN。')
if ((process.env.EXPECTED_SUPABASE_URL ?? '').replace(/\/$/, '') !== `https://${ref}.supabase.co`) throw new Error('请将 EXPECTED_SUPABASE_URL 配置为网页使用的 VITE_SUPABASE_URL，且必须与部署项目一致。')
const aiKey = process.env.OPENAI_API_KEY ?? ''
const model = process.env.DAILY_ANALYSIS_MODEL ?? ''
if (Boolean(aiKey) !== Boolean(model)) throw new Error('启用助记草稿时，请同时配置 OPENAI_API_KEY 与 DAILY_ANALYSIS_MODEL。')
const workerSecret = randomBytes(32).toString('hex')
const endpoint = `https://${ref}.supabase.co/functions/v1/analyze-daily-report`
const directory = await mkdtemp(join(tmpdir(), 'yitian-daily-analysis-'))
const envFile = join(directory, 'function.env')
const quote = value => `'${value.replaceAll("'", "''")}'`
function command(args) {
  const result = spawnSync('supabase', args, { stdio: 'inherit', env: process.env })
  if (result.status !== 0) throw new Error('Supabase 部署步骤失败，请检查项目配置。')
}
try {
  // Never pass service/model credentials in process arguments or browser VITE variables.
  for (const value of [aiKey, model]) if (/[\r\n]/.test(value)) throw new Error('服务配置不能包含换行。')
  await writeFile(envFile, `ANALYSIS_WEBHOOK_SECRET=${workerSecret}\nOPENAI_API_KEY=${aiKey}\nDAILY_ANALYSIS_MODEL=${model}\n`, { mode: 0o600 })
  command(['secrets', 'set', '--project-ref', ref, '--env-file', envFile])
  command(['functions', 'deploy', 'analyze-daily-report', '--project-ref', ref, '--use-api'])
  const query = `do $setup$ declare secret_id uuid; begin
    select id into secret_id from vault.secrets where name = 'daily_analysis_function_url' limit 1;
    if secret_id is null then perform vault.create_secret(${quote(endpoint)}, 'daily_analysis_function_url');
    else perform vault.update_secret(secret_id, ${quote(endpoint)}); end if;
    secret_id := null;
    select id into secret_id from vault.secrets where name = 'daily_analysis_worker_secret' limit 1;
    if secret_id is null then perform vault.create_secret(${quote(workerSecret)}, 'daily_analysis_worker_secret');
    else perform vault.update_secret(secret_id, ${quote(workerSecret)}); end if;
  end; $setup$;`
  const configured = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }), signal: AbortSignal.timeout(30_000),
  })
  if (!configured.ok) throw new Error(`后台通知配置失败（HTTP ${configured.status}），请重跑部署。`)
  const checked = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-analysis-secret': workerSecret }, body: JSON.stringify({ job_id: null }), signal: AbortSignal.timeout(120_000) })
  if (!checked.ok) throw new Error(`后台运行检查未通过（HTTP ${checked.status}）。`)
  const health = await checked.json()
  if (!Array.isArray(health.results) || !health.results.length || health.results.some(status => !['idle', 'completed', 'superseded'].includes(status))) throw new Error('后台入口已连接，但任务执行未通过，请检查任务和数据库。')
  console.log('每日分析已部署，数据库通知已连接，后台运行检查通过。')
} finally {
  await rm(directory, { recursive: true, force: true })
}
