import type { VocabWord } from '../types'

// Learner-approved illustrative events, not claims about the learner's own history.
export const familiarWordBridges: Record<string, Pick<VocabWord, 'example' | 'collocation' | 'usageNote'>> = {
  oversight: {
    collocation: 'an oversight',
    example: 'Leaving out the attachment was an oversight.',
    usageNote: '熟词桥梁：overlook → oversight，是意义关联，不是把 overlook 机械变成名词。假设邮件发出后，对方说没收到附件：你 overlooked the attachment（忽略了附件），这次疏漏是 an oversight。Leaving out the attachment was an oversight.（漏掉附件是一次疏忽。）另一个独立常用义是“监督”：oversight of the project 指对项目的监督，不是忽略项目。回想：邮件漏附件，承认这是一次什么？',
  },
  compelling: {
    collocation: 'compelling evidence',
    example: 'The timestamps provide compelling evidence.',
    usageNote: '熟词桥梁：credible → compelling，是意义对比，不是同词根。假设有人质疑你是否按时提交：一份来源可靠的回执是 credible（可信的）；提交时间、收件记录和邮件互相印证，让人难以否认，这组证据是 compelling（很有说服力的）。The timestamps provide compelling evidence.（这些时间戳提供了有力的证据。）可信侧重值得相信，有说服力侧重足以使人信服，不是严格的等级公式。compelling story 也可指引人入胜的故事。回想：不仅可靠，而且让人很难反驳的证据，用哪个形容词？',
  },
  dilemma: {
    collocation: 'face a dilemma',
    example: 'I face a dilemma: work late or miss the deadline.',
    usageNote: '熟词桥梁：alternative → dilemma，是事件关联，不是同词根。假设今晚有家宴，但工作还没完成：一个 alternative（可选方案）是加班，却会错过家宴；另一个是准时走，却会误了交付。I face a dilemma: work late or miss the deadline.（我面临两难：加班，还是错过截止时间。）有选项本身不等于 dilemma，难在各选项都有你不愿接受的代价。回想：不是没有选择，而是两边都难选，这是什么处境？',
  },
  fraud: {
    collocation: 'suspected fraud',
    example: 'I reported the fake payment request as suspected fraud.',
    usageNote: '熟词桥梁：genuine → fraud，是真假事件对比，不是同词根或词性相同的反义词。假设你收到银行催转账的邮件：你先核实它是否 genuine（真实的），发现发件人假冒银行，目的是骗钱；这涉嫌 fraud（欺诈）。I reported the fake payment request as suspected fraud.（我将这份虚假付款请求作为涉嫌诈骗的情况进行了举报。）fraud 不等于所有“不真实”：核心是欺骗；还可用 a fraud 指骗子或冒牌货。回想：不只是邮件有误，而是假冒身份骗钱，这是什么？',
  },
  exemption: {
    collocation: 'an exemption from training',
    example: 'My certificate qualified me for an exemption from training.',
    usageNote: '熟词桥梁：exclude → exemption，是场景关联，不是同词根。假设培训原本人人必修，但你提交了有效合格证，获准不必再参加：把你排除在“必须再培训”的要求之外，得到的是 exemption（豁免）。My certificate qualified me for an exemption from training.（我的证书使我符合免于培训的条件。）exclude 是一般的排除；exemption 是对通常义务或付款要求的获准免除，不是被拒绝参加。常用 exemption from。回想：不是逃课，而是获准不用参加，这项许可叫什么？',
  },
  compromise: {
    collocation: 'reach a compromise',
    example: 'We reached a compromise on the delivery date.',
    usageNote: '熟词桥梁：negotiate → compromise，是过程与结果的事件关联，不是同词根。假设你希望周五交货，对方只能周一；双方 negotiate（谈判），最后各退一步，同意周日。We reached a compromise on the delivery date.（我们就交货日期达成了折中方案。）negotiate 是谈的过程，不保证成功；compromise 在此是妥协或折中，也可作动词“妥协”。另一动词义“损害、危及”要另记，如 compromise safety（危及安全）。回想：双方各退一步达成的方案是什么？',
  },
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
