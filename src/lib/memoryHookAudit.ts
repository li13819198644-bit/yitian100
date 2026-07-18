import type { VocabWord } from '../types'

type MemoryHook = NonNullable<VocabWord['memoryHook']>

const bannedFragments = [
  '想一个真实场景',
  '抓住动作',
  '不要孤立背',
  '不瞎拆词',
  '写一句和你生活有关的话',
  '这个词就是',
]

const usageSignals = [
  '常搭',
  '固定搭配',
  '结构',
  '比 ',
  '不是',
  '别',
  '强调',
  '可表示',
  '也可',
  '介词',
  '反义',
]

export function auditMemoryHook(word: string, hook: MemoryHook): string[] {
  const issues: string[] = []
  const combined = [hook.core, hook.image, hook.breakdown, hook.cue, hook.personalPrompt].join(' ')

  for (const fragment of bannedFragments) {
    if (combined.includes(fragment)) {
      issues.push(`${word}: banned generic fragment "${fragment}"`)
    }
  }

  if (!hook.personalPrompt.includes('___')) {
    issues.push(`${word}: personalPrompt must force active recall with ___`)
  }

  if (!hook.cue.toLowerCase().includes(word.toLowerCase())) {
    issues.push(`${word}: cue should include the word itself in a usable collocation`)
  }

  if (!usageSignals.some((signal) => hook.breakdown.includes(signal))) {
    issues.push(`${word}: breakdown must include usage, contrast, or structure`)
  }

  if (hook.core.length < 6 || hook.image.length < 8) {
    issues.push(`${word}: core/image too thin to be useful`)
  }

  if (hook.core === hook.image || hook.image === hook.breakdown) {
    issues.push(`${word}: fields should not duplicate each other`)
  }

  return issues
}
