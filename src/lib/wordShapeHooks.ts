import type { VocabWord } from '../types'

type HookInput = Pick<VocabWord, 'word' | 'meaning'>

const specialHooks: Record<string, string> = {
  emotional: 'emotional先抓emo：人一emo，情绪化上脸。',
  ethical: 'ethical听“诶think哦”：先想该不该做，才合伦理。',
  feasible: 'feasible借possible尾巴：不只可能，是方案能落地。',
  eligible: 'eligible看e-lig-ible：能被选进名单，才有资格。',
  articulate: 'articulate抓article：话像文章分段，表达清楚。',
  procurement: 'procurement抓pro和cure：为公司把物资搞到手。',
  precedent: 'precedent抓pre在前：前面的案例，后面照着判。',
  sanction: 'sanction借section看条款：allow批准，ban制裁。',
  substantiate: 'substantiate抓substance：证据让空话有实体。',
  explicit: 'explicit抓ex往外：话全说到外面，明确。',
  implicit: 'implicit抓im往里：意思藏里面，暗含。',
  imply: 'imply抓in心里：话不说破，只暗示。',
}

const moduleRules: Array<{
  pattern: RegExp
  hook: (word: string, meaning: string) => string
}> = [
  { pattern: /tional$/, hook: (word, meaning) => `${word}抓tional尾：状态变形容词，指${meaning}。` },
  { pattern: /able$/, hook: (word, meaning) => `${word}抓able尾：able是能，指${meaning}。` },
  { pattern: /ible$/, hook: (word, meaning) => `${word}抓ible尾：能被这样处理，指${meaning}。` },
  { pattern: /ment$/, hook: (word, meaning) => `${word}抓ment尾：动作变成事物，指${meaning}。` },
  { pattern: /tion$/, hook: (word, meaning) => `${word}抓tion尾：动作变成名词，指${meaning}。` },
  { pattern: /sion$/, hook: (word, meaning) => `${word}抓sion尾：动作变成结果，指${meaning}。` },
  { pattern: /ity$/, hook: (word, meaning) => `${word}抓ity尾：性质状态，指${meaning}。` },
  { pattern: /ive$/, hook: (word, meaning) => `${word}抓ive尾：带这种倾向，指${meaning}。` },
  { pattern: /al$/, hook: (word, meaning) => `${word}抓al尾：变成形容词，指${meaning}。` },
  { pattern: /ize$/, hook: (word, meaning) => `${word}抓ize尾：把事做成，指${meaning}。` },
  { pattern: /fy$/, hook: (word, meaning) => `${word}抓fy尾：让它变成，指${meaning}。` },
  { pattern: /^re/, hook: (word, meaning) => `${word}抓re开头：再做一次，带到${meaning}。` },
  { pattern: /^pre/, hook: (word, meaning) => `${word}抓pre开头：事情在前，带到${meaning}。` },
  { pattern: /^pro/, hook: (word, meaning) => `${word}抓pro开头：往前推进，带到${meaning}。` },
  { pattern: /^sub/, hook: (word, meaning) => `${word}抓sub开头：压在下面，带到${meaning}。` },
  { pattern: /^trans/, hook: (word, meaning) => `${word}抓trans开头：跨过去，带到${meaning}。` },
  { pattern: /form/, hook: (word, meaning) => `${word}抓form：形态被处理，带到${meaning}。` },
  { pattern: /port/, hook: (word, meaning) => `${word}抓port：东西被带走，带到${meaning}。` },
  { pattern: /press/, hook: (word, meaning) => `${word}抓press：压力压出来，带到${meaning}。` },
  { pattern: /sign/, hook: (word, meaning) => `${word}抓sign：信号或标记，带到${meaning}。` },
  { pattern: /dict/, hook: (word, meaning) => `${word}抓dict：说出来判断，带到${meaning}。` },
  { pattern: /spect|scrut/, hook: (word, meaning) => `${word}抓看这个动作：盯住看，带到${meaning}。` },
  { pattern: /serve/, hook: (word, meaning) => `${word}抓serve：保住或服务，带到${meaning}。` },
  { pattern: /value|valid/, hook: (word, meaning) => `${word}抓value/valid：判断价值，带到${meaning}。` },
]

function firstMeaning(meaning: string): string {
  return meaning
    .split(/[；;，,]/)[0]
    .replace(/[。.!！]/g, '')
    .trim()
    .slice(0, 10)
}

function trimHook(hook: string): string {
  return hook.length <= 56 ? hook : `${hook.slice(0, 55)}。`
}

function hasWordShapeBridge(word: string, hook: string): boolean {
  const lower = hook.toLowerCase()
  const normalized = word.toLowerCase()
  return lower.includes(normalized)
    || lower.includes(normalized.slice(0, 4))
    || /抓|借|看|听/.test(hook)
}

export function buildWordShapeHook(input: HookInput, fallback?: string): string {
  const word = input.word.toLowerCase()
  const meaning = firstMeaning(input.meaning)
  const special = specialHooks[word]
  if (special) return special

  const rule = moduleRules.find((item) => item.pattern.test(word))
  if (rule) return trimHook(rule.hook(input.word, meaning))

  if (fallback && hasWordShapeBridge(word, fallback)) {
    return trimHook(fallback)
  }

  const head = input.word.slice(0, Math.min(5, input.word.length))
  return trimHook(`${input.word}先认${head}：把声音钉住，再接${meaning}。`)
}
