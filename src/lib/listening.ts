export interface AudioEntry { file: string; duration: number }
export function trackStarts(durations: number[]): number[] {
  let total = 0
  return durations.map(duration => { const start = total; total += duration; return start })
}
export function trackAt(starts: number[], time: number): number {
  return Math.max(0, starts.findIndex((start, index) => time >= start && (index === starts.length - 1 || time < starts[index + 1])))
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
