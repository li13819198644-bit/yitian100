import type { VocabWord } from '../types'

const specialHooks: Record<string, NonNullable<VocabWord['memoryHook']>> = {
  anticipate: {
    core: '还没发生，先想到，并提前准备。',
    image: '明天要堵车，你今晚就把出门时间提前。事情还没来，你脑子已经先演了一遍。',
    breakdown: 'anti/ante 有“前面、提前”的感觉；anticipate 就抓“提前想到”。',
    cue: 'anticipate problems / demand / changes',
    personalPrompt: '造句：I anticipate ___, so I ___.',
  },
  facilitate: {
    core: '让一件事更容易发生。',
    image: '你把复杂说明画成图，大家一下就懂了，沟通被你“铺平”。',
    breakdown: 'facile 有“容易”的感觉；facilitate = make it easier。',
    cue: 'facilitate communication / learning / growth',
    personalPrompt: '想一件你能让它变容易的事：I can facilitate ___.',
  },
  constrain: {
    core: '被边界卡住，不能自由发展。',
    image: '植物想长大，但花盆太小，根被限制住。',
    breakdown: 'strain 有拉紧的感觉；constrain = 被规则、资源或条件拉住。',
    cue: 'constrain growth / options / freedom',
    personalPrompt: '最近什么限制了你？___ constrains my ___.',
  },
  coherent: {
    core: '前后连得上，逻辑顺。',
    image: '一串珠子被线穿起来，每颗想法都接得上。',
    breakdown: 'co- 一起；here/hes 有黏住的感觉；coherent = 黏成整体。',
    cue: 'coherent argument / plan / explanation',
    personalPrompt: '描述一个清楚的计划：The plan is coherent because ___.',
  },
  reluctant: {
    core: '心里不太愿意，勉强做。',
    image: '朋友叫你出门，你一边穿鞋一边叹气。',
    breakdown: '记情绪，不记翻译：想象“脚往前走，心往后退”。',
    cue: 'reluctant to agree / admit / leave',
    personalPrompt: 'I am reluctant to ___ because ___.',
  },
}

const actionWords: Record<string, string> = {
  assess: '看清情况，再做判断。',
  evaluate: '按标准打分、判断好坏。',
  interpret: '把信息翻译成你能理解的意思。',
  establish: '把一件事立起来，变成稳定存在。',
  maintain: '让状态继续保持，不掉下去。',
  resolve: '把卡住的问题解开。',
  clarify: '把模糊的东西擦亮。',
  acquire: '把新东西拿到手，变成自己的。',
  retain: '留住，不让它从脑子里漏走。',
  indicate: '像路牌一样指向一个结论。',
  imply: '不明说，但暗暗指向。',
  reveal: '把藏起来的东西露出来。',
  ensure: '提前安排，保证它发生。',
  distinguish: '把两个像的东西分开看。',
  emphasize: '把重点加粗、加亮。',
  predict: '根据线索猜未来。',
  estimate: '不知道精确数，但给出合理范围。',
  investigate: '顺着线索往里查。',
  prioritize: '把最重要的放前面。',
  implement: '把计划落到行动。',
}

export function buildMemoryHook(word: VocabWord): NonNullable<VocabWord['memoryHook']> {
  const exact = specialHooks[word.word.toLowerCase()]
  if (exact) return exact

  const core = actionWords[word.word.toLowerCase()] ?? `抓住动作：${word.meaning.split('；')[0]}。`
  return {
    core,
    image: `想一个真实场景：你正在 ${word.collocation}，这个词就是那一瞬间的动作。`,
    breakdown: `不要孤立背中文。把它和搭配绑定：${word.collocation}。`,
    cue: word.collocation,
    personalPrompt: `用自己的生活造句：I ${word.word} ___ because ___.`,
  }
}
