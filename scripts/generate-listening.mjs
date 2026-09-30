// Build-time only: macOS say voices and ffmpeg. No runtime credentials or TTS service.
import { createServer } from 'vite'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const { seedWords } = await server.ssrLoadModule('/src/data/seedWords.ts')
await server.close()
const folder = 'public/listening'
mkdirSync(folder, { recursive: true })
const manifest = existsSync(`${folder}/manifest.json`) ? JSON.parse(readFileSync(`${folder}/manifest.json`, 'utf8')) : {}
const temp = mkdtempSync(join(tmpdir(), 'yitian-audio-'))
const run = promisify(execFile)
try {
  const generate = async (word, index) => {
    const revision = createHash('sha256').update(`v1:${word.word}:${word.meaning}`).digest('hex').slice(0, 12)
    const file = `${word.id}-${revision}.mp3`
    if (manifest[word.id]?.file === file && existsSync(`${folder}/${file}`)) return
    const en = join(temp, `en-${index}.aiff`), zh = join(temp, `zh-${index}.aiff`)
    await run('say', ['-v', 'Samantha', '-r', '145', '-o', en, `${word.word}. [[slnc 600]] ${Array.from(word.word.toUpperCase()).filter(x => /[A-Z]/.test(x)).join('. ')}.`])
    await run('say', ['-v', 'Tingting', '-r', '155', '-o', zh, word.meaning])
    // Headerless constant-rate MP3 frames can be joined without decoding on the phone.
    await run('ffmpeg', ['-loglevel','error','-y','-i',en,'-i',zh,'-filter_complex','[0:a]apad=pad_dur=0.6[a];[1:a]apad=pad_dur=3[b];[a][b]concat=n=2:v=0:a=1[out]','-map','[out]','-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k','-write_xing','0','-id3v2_version','0','-write_id3v1','0',`${folder}/${file}`])
    const duration = Number((await run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',`${folder}/${file}`])).stdout.trim())
    manifest[word.id] = { file, duration }
    writeFileSync(`${folder}/manifest.json`, JSON.stringify(manifest))
    if (index % 20 === 0) console.log(`${index + 1}/${seedWords.length}`)
  }
  for (let index = 0; index < seedWords.length; index += 4) {
    await Promise.all(seedWords.slice(index, index + 4).map((word, offset) => generate(word, index + offset)))
  }
  console.log(`Generated ${Object.keys(manifest).length} listening tracks`)
} finally { rmSync(temp, { recursive: true, force: true }) }
