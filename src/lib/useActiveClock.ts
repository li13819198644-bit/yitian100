import { useEffect, useRef, useState } from 'react'

export function useActiveClock(running: boolean, initialMs = 0) {
  const [elapsedMs, setElapsedMs] = useState(initialMs)
  const elapsed = useRef(initialMs)
  useEffect(() => {
    let last = Date.now(), visible = document.visibilityState !== 'hidden'
    const tick = () => {
      const now = Date.now()
      if (running && visible) elapsed.current += Math.max(0, now - last)
      last = now; visible = document.visibilityState !== 'hidden'
      setElapsedMs(elapsed.current)
    }
    const timer = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => { tick(); window.clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [running])
  return { elapsedMs, read: () => elapsed.current }
}
