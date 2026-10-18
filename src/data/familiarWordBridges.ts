import type { VocabWord } from '../types'

// Learner-approved illustrative events, not claims about the learner's own history.
export const familiarWordBridges: Record<string, Pick<VocabWord, 'example' | 'collocation' | 'usageNote'>> = {
  mandate: {
    collocation: 'mandate safety training',
    example: 'The company mandates safety training.',
    usageNote: '熟词桥梁：mandatory → mandate，共有 mandat-。假设公司发来培训邮件：Safety training is mandatory.（安全培训是必须参加的。）换成公司作主语：The company mandates safety training.（公司强制要求进行安全培训。）mandatory 是形容词“必须做的”，mandate 在此是动词“正式要求”。mandate 还可作名词表示命令或授权，不能把所有用法都理解为强制。回想：公司正式要求培训，动词用哪个？',
  },
  entail: {
    collocation: 'entail weekly travel',
    example: 'This job entails weekly travel.',
    usageNote: '熟词桥梁：require → entail，是意义关联，不是构词拆解。假设你接下一份工作，发现每周都得出差：This job entails weekly travel.（这份工作意味着每周都要出差。）require 侧重要求或需要；entail 侧重某事必然涉及或需要什么，两者并非处处可换。回想：接下工作，随之必须出差，用哪个动词？',
  },
  compensate: {
    collocation: 'compensate someone for the extra cost',
    example: 'The hotel compensated me for the extra cost.',
    usageNote: '熟词桥梁：refund → compensate，是事件中的对比，不是同词根。假设酒店取消预订：退回原房费是 refund；补偿你另订酒店多花的钱是 compensate。The hotel compensated me for the extra cost.（酒店补偿了我额外的费用。）记 compensate someone for something；也能说 compensate for a loss（弥补损失），补偿不限于金钱。回想：退原款之外，再弥补损失，用哪个词？',
  },
  fiscal: {
    collocation: 'fiscal policy',
    example: 'The government changed its fiscal policy.',
    usageNote: '熟词桥梁：budget → fiscal，是场景关联，不是构词拆解。假设你看政府预算新闻：收多少税、花多少钱修路建医院，属于财政议题。budget 是名词“预算”；fiscal 是形容词“财政的”，常见 fiscal policy（财政政策）。The government changed its fiscal policy.（政府调整了财政政策。）fiscal 也用于其他财务语境，如 fiscal year（财政年度／会计年度）。回想：政府预算中的收税与支出政策，是什么 policy？',
  },
  nuance: {
    collocation: 'a nuance of tone',
    example: 'There is a nuance of tone between the two requests.',
    usageNote: '熟词桥梁：distinction → nuance，是意义关联，不是同词根。假设两封邮件分别写 Send it today.（今天发过来。）和 Could you send it today?（能今天发给我吗？）要求相近，语气一个直接、一个委婉。distinction 指区别；nuance 指意义、语气、感情等细微的差别，不是所有明显区别都适合用 nuance。回想：同样在催交，细微的语气差别叫什么？',
  },
}

export function withFamiliarWordBridge(word: VocabWord): VocabWord {
  const bridge = familiarWordBridges[word.word]
  return bridge ? { ...word, ...bridge } : word
}
