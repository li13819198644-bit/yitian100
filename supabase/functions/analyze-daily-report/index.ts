import { createDraftWriter, createHandler, createRestStore } from './worker.ts'

const url = Deno.env.get('SUPABASE_URL') ?? ''
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const secret = Deno.env.get('ANALYSIS_WEBHOOK_SECRET') ?? ''
const modelKey = Deno.env.get('OPENAI_API_KEY')
const model = Deno.env.get('DAILY_ANALYSIS_MODEL')

Deno.serve(createHandler(secret, createRestStore(url, key), modelKey && model ? createDraftWriter(modelKey, model) : undefined))
