import type { VocabWord } from '../types'

// Selected everyday senses, checked against the linked dictionary; not an exhaustive dictionary.
export const wordSenses: Record<string, NonNullable<VocabWord['senses']>> = {
  concrete: [
    { partOfSpeech: '形容词 adj.', meaning: '具体的、明确的；实在的', collocation: 'concrete evidence：明确的证据', example: 'We need a concrete plan.', translation: '我们需要一个具体的计划。' },
    { partOfSpeech: '不可数名词 n. [U]', meaning: '混凝土', collocation: 'pour concrete：浇筑混凝土', note: '作建筑材料名词时通常不可数。', example: 'The floor is made of concrete.', translation: '地板是用混凝土做的。' },
    { partOfSpeech: '及物动词 v. [T]', meaning: '用混凝土覆盖或铺设', lessCommon: true, example: 'They concreted the yard.', translation: '他们用混凝土铺了院子。' },
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
  const senses = wordSenses[word.word]
  return senses ? { ...word, senses, definitionSource: `https://dictionary.cambridge.org/dictionary/english/${word.word}` } : word
}
