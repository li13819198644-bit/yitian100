import { useEffect, useRef, useState } from 'react'
import type { StudyMode } from '../types'

export type AnswerHandler = (correct: boolean, mode: StudyMode) => void | boolean | Promise<void | boolean>

/** Show brief feedback, save once, then let the session advance automatically. */
export function useQuickAnswer(onAnswer: AnswerHandler, onAnswered?: () => void) {
  const [result, setResult] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const locked = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; clearTimeout(timer.current) }
  }, [])
  function submit(correct: boolean, mode: StudyMode) {
    if (locked.current) return
    locked.current = true
    setError('')
    setResult(correct)
    onAnswered?.()
    timer.current = setTimeout(async () => {
      try {
        const saved = await onAnswer(correct, mode)
        if (saved !== false) return
      } catch { /* Keep the current question available for retry. */ }
      if (!mounted.current) return
      locked.current = false
      setResult(null)
      setError('未能保存，请再点一次重试。')
    }, correct ? 450 : 1200)
  }
  return { result, error, submit }
}
