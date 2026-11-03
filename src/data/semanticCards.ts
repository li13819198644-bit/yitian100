import type { VocabWord } from '../types'

export interface SemanticCard {
  id: string
  word: string
  partOfSpeech: string
  meaning: string
  aliases: string[]
  collocation: string
  collocationMeaning: string
  example: string
  translation: string
  exampleSense?: string
  contexts: Array<{ text: string; translation: string; senseId?: string }>
  problem?: 'unretrieved' | 'confusion' | 'context-dependent' | 'meaning-boundary' | 'sense-check'
  correction?: string
  contrast?: Array<{ word: string; meaning: string; phrase: string }>
  image?: 'hinge' | 'latch' | 'shard'
  otherSenses?: Array<{ partOfSpeech: string; meaning: string }>
}

// Original teaching examples. The problem labels describe this conversation,
// not verified app test scores or a diagnosis of the learner's memory.
export const semanticCards: SemanticCard[] = [
  { id: 'discern', word: 'discern', partOfSpeech: '动词', meaning: '辨别、察觉、看出', aliases: ['辨别', '察觉', '看出', '分辨'], collocation: 'discern a difference', collocationMeaning: '辨出差别', example: 'I could discern a difference between the two pictures.', translation: '我能辨出这两张图之间的一处差别。', contexts: [{ text: 'She could discern a pattern in the data.', translation: '她能看出数据中的规律。' }], problem: 'unretrieved', correction: '核心动作是从不明显的信息中辨出来。' },
  { id: 'reluctant', word: 'reluctant', partOfSpeech: '形容词', meaning: '不情愿的、勉强的', aliases: ['不情愿', '不情愿的', '勉强', '勉强的', '不愿意', '不太愿意'], collocation: 'reluctant to do something', collocationMeaning: '不情愿做某事', example: 'The operator was reluctant to restart the pump.', translation: '操作员不情愿重新启动这台泵。', contexts: [{ text: 'He was reluctant to accept the proposal.', translation: '他不太愿意接受这个提议。' }], problem: 'unretrieved' },
  { id: 'compensate', word: 'compensate', partOfSpeech: '动词', meaning: '补偿、弥补', aliases: ['补偿', '弥补', '赔偿'], collocation: 'compensate for a loss', collocationMeaning: '弥补损失', example: 'The hotel compensated me for the extra cost.', translation: '酒店补偿了我额外的费用。', contexts: [{ text: 'The company will compensate employees for overtime.', translation: '公司会补偿员工加班付出的劳动。' }], problem: 'confusion', correction: '之前答成“竞争”。把补偿损失与参与竞争分开。', contrast: [{ word: 'compensate', meaning: '补偿、弥补', phrase: 'compensate for a loss' }, { word: 'compete', meaning: '竞争', phrase: 'compete with another company' }] },
  { id: 'oversight', word: 'oversight', partOfSpeech: '名词', meaning: '疏漏；监督（两个常用义）', aliases: ['疏漏', '疏忽', '监督'], collocation: 'an oversight', collocationMeaning: '一次疏漏', example: 'Leaving out the attachment was an oversight.', translation: '漏掉附件是一次疏漏。', contexts: [{ text: 'The project needs independent oversight.', translation: '这个项目需要独立监督。' }], problem: 'confusion', correction: '“远见”对应 foresight。oversight 的疏漏和监督两义需要看语境。', contrast: [{ word: 'oversight', meaning: '疏漏；监督', phrase: 'an oversight / independent oversight' }, { word: 'foresight', meaning: '远见、预见能力', phrase: 'have the foresight to plan ahead' }] },
  { id: 'viable', word: 'viable', partOfSpeech: '形容词', meaning: '可行的；能存活的', aliases: ['可行', '可行的', '能存活', '能存活的', '有生存能力的'], collocation: 'a viable plan', collocationMeaning: '一个可行的方案', example: 'This is a viable plan.', translation: '这是一个可行的方案。', contexts: [{ text: 'Is this solution viable?', translation: '这个解决办法可行吗？' }], problem: 'meaning-boundary', correction: '在 plan、solution 等搭配中是“可行的”。生物义强调能存活，不能把所有用法理解为鲜活。' },
  { id: 'coherent', word: 'coherent', partOfSpeech: '形容词', meaning: '连贯的、有条理的', aliases: ['连贯', '连贯的', '有条理', '有条理的', '条理清楚', '条理清楚的'], collocation: 'a coherent explanation', collocationMeaning: '一个有条理的解释', example: 'His story is coherent.', translation: '他的叙述是连贯的。', contexts: [{ text: 'She presented a coherent argument.', translation: '她提出了一个有条理的论证。' }], problem: 'context-dependent', correction: '上次句中回答正确。继续检查单独看到单词时能否说准。' },
  { id: 'concrete', word: 'concrete', partOfSpeech: '形容词／名词', meaning: '形容词：具体的、明确的；名词：混凝土', aliases: ['混凝土', '具体', '具体的', '明确', '明确的'], collocation: 'a concrete plan', collocationMeaning: '一个具体的计划', example: 'We need a concrete plan.', translation: '我们需要一个具体的计划。', exampleSense: 'adjective', contexts: [{ text: 'They gave a concrete example.', translation: '他们给出了一个具体的例子。', senseId: 'adjective' }, { text: 'The floor is made of concrete.', translation: '地板是用混凝土做的。', senseId: 'noun' }], problem: 'sense-check', correction: '“混凝土”已在聊天测试中回答正确。形容词义尚需检查，不能由一次名词回答判定已经掌握或不会其他义项。' },
  { id: 'nuance', word: 'nuance', partOfSpeech: '名词', meaning: '细微差别、微妙之处', aliases: ['细微差别', '微妙之处', '微妙差别', '细微区别'], collocation: 'a nuance of tone', collocationMeaning: '语气上的细微差别', example: 'She noticed a nuance in his voice.', translation: '她察觉到他声音中的微妙变化。', contexts: [{ text: 'The translation preserves every nuance of meaning.', translation: '这篇译文保留了每一处细微的含义差别。' }], problem: 'meaning-boundary', correction: '细微差别可能很重要。“微不足道”不是这个词的核心含义。' },
  { id: 'mandate', word: 'mandate', partOfSpeech: '动词／名词', meaning: '动词：正式要求、强制要求；名词：命令、授权', aliases: ['正式要求', '强制要求', '命令', '授权'], collocation: 'mandate safety training', collocationMeaning: '强制要求安全培训', example: 'The company mandates training.', translation: '公司强制要求进行培训。', contexts: [{ text: 'The law mandates annual inspections.', translation: '法律强制要求每年进行检查。' }], problem: 'meaning-boundary', correction: 'mandatory 是形容词“必须的”；mandates 在当前例句中是动词“强制要求”。' },
  { id: 'sustain', word: 'sustain', partOfSpeech: '动词', meaning: '维持、支撑', aliases: ['维持', '支撑', '保持'], collocation: 'sustain progress', collocationMeaning: '维持进展', example: 'Regular practice helps sustain progress.', translation: '规律练习有助于维持进展。', contexts: [{ text: 'The support can sustain the team through the winter.', translation: '这些支持可以帮助团队撑过冬天。' }] },
  { id: 'inherent', word: 'inherent', partOfSpeech: '形容词', meaning: '固有的、内在的', aliases: ['固有', '固有的', '内在', '内在的'], collocation: 'an inherent risk', collocationMeaning: '一种固有风险', example: 'Every investment has inherent risks.', translation: '每项投资都有固有风险。', contexts: [{ text: 'The problem is inherent in the design.', translation: '这个问题是设计本身固有的。' }] },
  { id: 'explicit', word: 'explicit', partOfSpeech: '形容词', meaning: '明确的、直白的', aliases: ['明确', '明确的', '直白', '直白的'], collocation: 'explicit instructions', collocationMeaning: '明确的指示', example: 'Please give explicit instructions.', translation: '请给出明确的指示。', contexts: [{ text: 'The agreement needs explicit permission.', translation: '这项协议需要明确许可。' }] },
  { id: 'inventory', word: 'inventory', partOfSpeech: '名词', meaning: '库存、存货清单', aliases: ['库存', '存货', '存货清单', '库存清单'], collocation: 'check inventory', collocationMeaning: '检查库存', example: 'We check inventory every Friday.', translation: '我们每周五检查库存。', contexts: [{ text: 'The store keeps an inventory of spare parts.', translation: '商店保存着一份备件库存清单。' }] },
  { id: 'bolster', word: 'bolster', partOfSpeech: '动词', meaning: '支持、加强', aliases: ['支持', '加强', '增强'], collocation: 'bolster confidence', collocationMeaning: '增强信心', example: 'Clear evidence can bolster confidence.', translation: '清晰的证据可以增强信心。', contexts: [{ text: 'The new funding will bolster the project.', translation: '新增资金将为项目提供支持。' }] },
  { id: 'alleviate', word: 'alleviate', partOfSpeech: '动词', meaning: '减轻、缓解', aliases: ['减轻', '缓解'], collocation: 'alleviate pressure', collocationMeaning: '缓解压力', example: 'The new schedule helped alleviate pressure.', translation: '新安排有助于缓解压力。', contexts: [{ text: 'This medicine can alleviate pain.', translation: '这种药可以减轻疼痛。' }] },
  { id: 'articulate', word: 'articulate', partOfSpeech: '动词', meaning: '清楚表达', aliases: ['清楚表达', '清晰表达', '表达清楚'], collocation: 'articulate an idea', collocationMeaning: '清楚表达一个想法', example: 'She can articulate her ideas clearly.', translation: '她能清晰地表达自己的想法。', contexts: [{ text: 'He struggled to articulate his concerns.', translation: '他难以清楚地表达自己的担忧。' }] },
]

// Separate experiment material: these do not change the 605 seed IDs or SRS progress.
export const imagePilotCards: SemanticCard[] = [
  { id: 'pilot:hinge', word: 'hinge', partOfSpeech: '名词', meaning: '合页、铰链', aliases: ['合页', '铰链', '门铰'], collocation: 'a door hinge', collocationMeaning: '门合页', example: 'The door turns on its hinges.', translation: '门绕着合页转动。', contexts: [], image: 'hinge' },
  { id: 'pilot:latch', word: 'latch', partOfSpeech: '名词', meaning: '插销、门闩、搭扣等扣合装置', aliases: ['插销', '门闩', '门栓', '搭扣', '扣合装置'], collocation: 'close the latch', collocationMeaning: '扣上门闩', example: 'Please close the latch on the gate.', translation: '请扣上大门的门闩。', contexts: [], image: 'latch' },
  { id: 'pilot:shard', word: 'shard', partOfSpeech: '名词', meaning: '玻璃、陶瓷等材料的尖锐碎片', aliases: ['碎片', '尖锐碎片', '玻璃碎片', '陶瓷碎片'], collocation: 'a shard of glass', collocationMeaning: '一片玻璃碎片', example: 'A shard of glass lay on the floor.', translation: '地板上有一片玻璃碎片。', contexts: [], image: 'shard' },
]

export function semanticCardFor(word: VocabWord): SemanticCard {
  const reviewed = semanticCards.find(card => card.id === word.id)
  if (reviewed) return { ...reviewed, otherSenses: word.senses }
  const sense = word.senses?.[0]
  return { id: word.id, word: word.word, partOfSpeech: sense?.partOfSpeech ?? '', meaning: sense?.meaning ?? word.meaning, aliases: [], collocation: word.collocation, collocationMeaning: '', example: word.example, translation: word.personalExampleTranslation ?? (sense?.example === word.example ? sense.translation : '') ?? '', contexts: [], otherSenses: word.senses }
}

export function variedContext(card: SemanticCard, previousContextAttempts: number) {
  const choices = [{ text: card.example, translation: card.translation, senseId: card.exampleSense }, ...card.contexts]
  return choices[(previousContextAttempts + 1) % choices.length]
}

// Reserved for the final transfer check, never used as A/B study examples.
export const transferContexts: Record<string, { text: string; translation: string }> = {
  discern: { text: 'At dusk, I could barely discern the path.', translation: '暮色中，我几乎辨不清小路。' },
  reluctant: { text: 'They were reluctant to share the room.', translation: '他们不情愿共用这个房间。' },
  compensate: { text: 'Extra practice can compensate for a lack of experience.', translation: '额外练习可以弥补经验不足。' },
  oversight: { text: 'One small oversight delayed the delivery.', translation: '一处小疏漏耽搁了交付。' },
  viable: { text: 'The repair is no longer a viable option.', translation: '修复已不再是可行的选择。' },
  coherent: { text: 'The notes form a coherent account of the trip.', translation: '这些笔记构成了对这次旅程的连贯记述。' },
  concrete: { text: 'Give me a concrete answer.', translation: '给我一个明确的回答。' },
  nuance: { text: 'The actor captured a nuance of sadness.', translation: '演员捕捉到了一丝微妙的悲伤。' },
  mandate: { text: 'The policy mandates a written receipt.', translation: '这项规定强制要求出具书面收据。' },
  sustain: { text: 'This income cannot sustain the family.', translation: '这份收入无法维持全家的生计。' },
  inherent: { text: 'There are inherent limits to this method.', translation: '这种方法有固有的局限。' },
  explicit: { text: 'She made an explicit request for help.', translation: '她明确提出了求助请求。' },
  inventory: { text: 'The clinic keeps a small inventory of supplies.', translation: '诊所备有少量物资库存。' },
  bolster: { text: 'Good lighting can bolster safety.', translation: '良好的照明可以提升安全性。' },
  alleviate: { text: 'A short break may alleviate stress.', translation: '短暂休息可能缓解压力。' },
  articulate: { text: 'He could not articulate what he needed.', translation: '他无法清楚表达自己的需求。' },
}
