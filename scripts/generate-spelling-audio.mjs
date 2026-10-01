// Independent MP3 segments keep pronunciation/meaning at 1x even during locked-screen playback.
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
const directory = 'public/listening'
mkdirSync(directory, { recursive: true })
const file = `${directory}/segments.json`
const manifest = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { version: 2, words: {}, letters: {} }
const temp = mkdtempSync(join(tmpdir(), 'yitian-spelling-'))
const run = promisify(execFile)
const save = () => writeFileSync(file, JSON.stringify(manifest))
async function encode(input, name, filter) {
  await run('ffmpeg', ['-loglevel','error','-y','-i',input,'-af',filter,'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k','-write_xing','0','-id3v2_version','0','-write_id3v1','0',`${directory}/${name}`])
  const duration = Number((await run('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',`${directory}/${name}`])).stdout.trim())
  return { file: name, duration }
}
function tempo(rate) {
  const filters = []
  while (rate < 0.5) { filters.push('atempo=0.5'); rate *= 2 }
  filters.push(`atempo=${rate.toFixed(4)}`)
  return filters.join(',')
}
try {
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i)
    manifest.letters[letter] ??= {}
    const input = join(temp, `${letter}.aiff`)
    await run('say', ['-v','Samantha','-r','145','-o',input, `${letter}.`])
    for (let tenth = 1; tenth <= 10; tenth++) {
      const rate = (tenth / 10).toFixed(1), name = `letter-v2-${letter.toLowerCase()}-${tenth}.mp3`
      if (manifest.letters[letter][rate]?.file === name && existsSync(`${directory}/${name}`)) continue
      manifest.letters[letter][rate] = await encode(input, name, `apad=pad_dur=0.12,${tempo(tenth / 10)}`)
      save()
    }
  }
  console.log('Alphabet: all ten spelling speeds ready')
  const generate = async (word, index) => {
    const hash = createHash('sha256').update(`v2:${word.word}:${word.meaning}`).digest('hex').slice(0,12)
    const introName = `intro-${word.id}-${hash}.mp3`, meaningName = `meaning-${word.id}-${hash}.mp3`
    if (manifest.words[word.id]?.intro.file === introName && existsSync(`${directory}/${introName}`) && existsSync(`${directory}/${meaningName}`)) return
    const en = join(temp, `en-${index}.aiff`), zh = join(temp, `zh-${index}.aiff`)
    await run('say', ['-v','Samantha','-r','145','-o',en,`${word.word}.`])
    await run('say', ['-v','Tingting','-r','155','-o',zh,word.meaning])
    const intro = await encode(en, introName, 'apad=pad_dur=0.6')
    const meaning = await encode(zh, meaningName, 'apad=pad_dur=3')
    manifest.words[word.id] = { intro, meaning, letters: word.word.toUpperCase().replace(/[^A-Z]/g, '').split('') }
    save()
    if (index % 40 === 0) console.log(`${index + 1}/${seedWords.length} words`)
  }
  for (let index = 0; index < seedWords.length; index += 4) {
    await Promise.all(seedWords.slice(index, index + 4).map((word, offset) => generate(word, index + offset)))
  }
  console.log(`Ready: ${Object.keys(manifest.words).length} words, 26 letters, ten speeds`)
} finally { rmSync(temp, { recursive: true, force: true }) }
