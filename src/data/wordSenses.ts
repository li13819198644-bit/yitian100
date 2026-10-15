import type { VocabWord } from '../types'
import dictionary from './dictionarySenses.json'
import { curatedPos } from './curatedPos'

// Selected everyday senses, checked against the linked dictionary; not an exhaustive dictionary.
export const wordSenses: Record<string, NonNullable<VocabWord['senses']>> = {
  leverage: [
    { partOfSpeech: '名词 n.', meaning: '影响力；杠杆作用；（金融）杠杆融资' },
    { partOfSpeech: '动词 v.', meaning: '利用已有资源或优势；运用杠杆融资' },
  ],
  blunt: [
    { partOfSpeech: '形容词 adj.', meaning: '钝的；直言不讳的（有时显得不客气）' },
    { partOfSpeech: '动词 v.', meaning: '使变钝；削弱' },
  ],
  foreground: [
    { partOfSpeech: '名词 n.', meaning: '前景；显著位置；关注的中心' },
    { partOfSpeech: '动词 v.', meaning: '突出；强调' },
  ],
  regardless: [
    { partOfSpeech: '副词 adv.', meaning: '不顾；不加理会；无论如何（regardless of：不管；不论）' },
  ],
  worldwide: [
    { partOfSpeech: '形容词 adj.', meaning: '全世界的；遍及全球的' },
    { partOfSpeech: '副词 adv.', meaning: '在全世界；遍及全球地' },
  ],
  affordable: [
    { partOfSpeech: '形容词 adj.', meaning: '负担得起的；价格合理的' },
  ],
  benchmark: [
    { partOfSpeech: '名词 n.', meaning: '基准；衡量标准' },
    { partOfSpeech: '动词 v.', meaning: '以基准衡量；对标；做基准测试' },
    { partOfSpeech: '形容词 adj.', meaning: '基准的；作为衡量标准的' },
  ],
  concrete: [
    { partOfSpeech: '形容词 adj.', meaning: '具体的；明确的；实在的', example: 'We need a concrete plan.', translation: '我们需要一个具体的计划。' },
    { partOfSpeech: '不可数名词 n. [U]', meaning: '混凝土', example: 'The floor is made of concrete.', translation: '地板是用混凝土做的。' },
    { partOfSpeech: '及物动词 v. [T]', meaning: '用混凝土覆盖或铺设', example: 'They concreted the yard.', translation: '他们用混凝土铺了院子。' },
  ],
  abstract: [
    { partOfSpeech: '形容词 adj.', meaning: '抽象的；（艺术）抽象派的', example: 'Freedom is an abstract idea.', translation: '自由是一个抽象的概念。' },
    { partOfSpeech: '可数名词 n. [C]', meaning: '摘要；概要', example: 'Read the abstract before the full paper.', translation: '阅读论文全文之前，先读摘要。' },
  ],
  attribute: [
    { partOfSpeech: '及物动词 v. [T]', phonetic: '/əˈtrɪbjuːt/', meaning: '把……归因于；认为……出自', example: 'I attribute the delay to the rain.', translation: '我把延误归因于下雨。' },
    { partOfSpeech: '可数名词 n. [C]', phonetic: '/ˈætrɪbjuːt/', meaning: '特征；属性', example: 'Patience is a useful attribute.', translation: '耐心是一种有用的品质。' },
  ],
  potential: [
    { partOfSpeech: '形容词 adj.（用于名词前）', meaning: '潜在的；可能的', example: 'We discussed a potential risk.', translation: '我们讨论了一个潜在风险。' },
    { partOfSpeech: '不可数名词 n. [U]', meaning: '潜力；可能性', example: 'This idea has real potential.', translation: '这个想法确实有潜力。' },
  ],
  moderate: [
    { partOfSpeech: '形容词 adj.', phonetic: '/ˈmɒdərət/', meaning: '适度的；中等的；温和的', example: 'Keep a moderate pace.', translation: '保持适中的速度。' },
    { partOfSpeech: '动词 v.', phonetic: '/ˈmɒdəreɪt/', meaning: '（使）缓和、减轻；主持讨论', example: 'Can you moderate the discussion?', translation: '你能主持这次讨论吗？' },
    { partOfSpeech: '可数名词 n. [C]', phonetic: '/ˈmɒdərət/', meaning: '温和派人士', example: 'She is a moderate in the party.', translation: '她是党内的温和派人士。' },
  ],
}

export function withWordSenses(word: VocabWord): VocabWord {
  const reviewed = wordSenses[word.word]
  if (reviewed) return { ...word, senses: reviewed, definitionSource: `https://dictionary.cambridge.org/dictionary/english/${word.word}`, definitionSourceLabel: 'Cambridge' }
  const entries: Record<string, NonNullable<VocabWord['senses']>> = dictionary.entries
  const senses = curatedPos[word.word] ?? entries[word.word]
  return senses ? { ...word, senses, definitionSource: dictionary.source, definitionSourceLabel: 'ECDICT 开源英汉词典' } : word
}
