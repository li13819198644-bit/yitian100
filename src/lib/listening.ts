export interface AudioEntry { file: string; duration: number }
export const spellingRates = Array.from({ length: 10 }, (_, index) => ((index + 1) / 10).toFixed(1))
export interface SpellingManifest {
  version: 2
  words: Record<string, { intro: AudioEntry; meaning: AudioEntry; letters: string[] }>
  letters: Record<string, Record<string, AudioEntry>>
}
export function spellingParts(manifest: SpellingManifest, wordId: string, rate: string): AudioEntry[] {
  if (!spellingRates.includes(rate)) throw new Error('拼写速度必须在 0.1 到 1.0 之间。')
  const word = manifest.words[wordId]
  if (!word) throw new Error('这个词暂无音频。')
  return [word.intro, ...word.letters.map(letter => {
    const entry = manifest.letters[letter]?.[rate]
    if (!entry) throw new Error('拼写音频不完整，请更新后重试。')
    return entry
  }), word.meaning]
}
export function trackStarts(durations: number[]): number[] {
  let total = 0
  return durations.map(duration => { const start = total; total += duration; return start })
}
export function trackAt(starts: number[], time: number): number {
  // Media seek positions may round a fraction of a millisecond below a chapter boundary.
  const position = time + 0.001
  return Math.max(0, starts.findIndex((start, index) => position >= start && (index === starts.length - 1 || position < starts[index + 1])))
}
export async function cachedAudio(url: string, signal: AbortSignal): Promise<Blob> {
  let cache: Cache | undefined
  try { cache = await caches.open('yitian-listening-v1') } catch { /* Playback still works without cache permission. */ }
  const saved = await cache?.match(url)
  if (saved) return saved.blob()
  const response = await fetch(url, { signal })
  if (!response.ok || !(response.headers.get('content-type') ?? '').includes('audio')) throw new Error('音频下载失败，请联网后重试。')
  try { await cache?.put(url, response.clone()) } catch { /* Storage quota must not block playback. */ }
  return response.blob()
}
