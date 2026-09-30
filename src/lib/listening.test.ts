import { afterEach, describe, expect, it, vi } from 'vitest'
import { cachedAudio, trackAt, trackStarts } from './listening'

describe('continuous listening chapters', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('computes chapter offsets without changing learning progress', () => {
    const durations = [10.5, 12, 8.25]
    expect(trackStarts(durations)).toEqual([0, 10.5, 22.5])
    expect(durations).toEqual([10.5, 12, 8.25])
  })
  it('selects the correct word at chapter boundaries and after seeking', () => {
    const starts = [0, 10.5, 22.5]
    expect(trackAt(starts, 0)).toBe(0)
    expect(trackAt(starts, 10.49)).toBe(0)
    expect(trackAt(starts, 10.5)).toBe(1)
    expect(trackAt(starts, 30)).toBe(2)
    expect(trackAt([], 0)).toBe(0)
  })
  it('reuses downloaded audio without a network request', async () => {
    vi.stubGlobal('caches', { open: async () => ({ match: async () => new Response('cached', { headers: { 'content-type': 'audio/mpeg' } }) }) })
    const network = vi.fn()
    vi.stubGlobal('fetch', network)
    const result = await cachedAudio('https://example.test/word.mp3', new AbortController().signal)
    expect(result.size).toBe(6)
    expect(network).not.toHaveBeenCalled()
  })
  it('rejects missing recordings rather than playing an HTML error page', async () => {
    vi.stubGlobal('caches', { open: async () => ({ match: async () => undefined }) })
    vi.stubGlobal('fetch', async () => new Response('<html>not found</html>', { headers: { 'content-type': 'text/html' } }))
    await expect(cachedAudio('https://example.test/word.mp3', new AbortController().signal)).rejects.toThrow('下载失败')
  })
  it('keeps online playback available when caching is denied', async () => {
    vi.stubGlobal('caches', { open: async () => { throw new Error('Denied') } })
    vi.stubGlobal('fetch', async () => new Response('mp3', { headers: { 'content-type': 'audio/mpeg' } }))
    expect((await cachedAudio('https://example.test/word.mp3', new AbortController().signal)).size).toBe(3)
  })
})
