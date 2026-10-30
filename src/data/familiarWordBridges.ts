import type { VocabWord } from '../types'

// Learner-approved illustrative events, not claims about the learner's own history.
export const familiarWordBridges: Record<string, Pick<VocabWord, 'example' | 'collocation' | 'usageNote'>> = {
  volatile: {
    collocation: 'volatile prices',
    example: 'Prices were volatile throughout the week.',
    usageNote: '事件记忆，不做硬拆词。假设同一商品上午涨价，下午跌价，第二天又猛涨：Prices were volatile throughout the week.（这一周价格波动很大。）volatile 强调容易突然变化、不稳定，不等于昂贵，也不只是下降。还可以形容情绪或局势易变，以及物质易挥发；先固定 volatile prices。回想：价格不是一直高，而是突然涨跌，用哪个形容词？',
  },
  relinquish: {
    collocation: 'relinquish control',
    example: 'She relinquished control of the project.',
    usageNote: '熟词候选：give up（放弃）；若不熟，直接记交出控制权的事件，不把它当已掌握词。假设你原本有项目审批权，交接后不再拥有：She relinquished control of the project.（她交出了项目的控制权。）relinquish 常搭权利、控制权、职位，表示不再保有；可以自愿，也可以被迫，不只是暂时交别人代管。与 concede 的承认事实不同：这里交出的是原来拥有的东西。回想：不再握有审批权，交出控制权，用哪个动词？',
  },
  concurrent: {
    collocation: 'concurrent meetings',
    example: 'The two meetings are concurrent.',
    usageNote: '事件记忆：假设两个会议都安排在九点，你没法同时参加：The two meetings are concurrent.（这两个会议同时进行。）concurrent 侧重时间重叠、同时发生或存在，不要求起止时刻完全一样；不是先后相接。不要把 current 的“当前的”直接当成整个词的含义。回想：两个会议撞在同一时段，是先后进行，还是怎样进行？说出那个形容词。',
  },
  beforehand: {
    collocation: 'read the report beforehand',
    example: 'Please read the report beforehand.',
    usageNote: '熟词候选：before（之前）→ beforehand（事先），先确认你认识 before，不给 hand 编造含义。假设明天开会，对方希望你在开会前读完报告：Please read the report beforehand.（请事先读一下报告。）before the meeting 后面有明确时间事件；beforehand 可以独立表示在约定事件之前，不说 beforehand the meeting。回想：不是会上才读，而是事先读，用哪个副词？',
  },
  outperform: {
    collocation: 'outperform the older model',
    example: 'The new machine outperformed the older model.',
    usageNote: '熟词候选：perform（表现）→ out + perform；out- 在这里表示超过，不是向外。假设两台机器处理同一任务，新机器更快且出错更少：The new machine outperformed the older model.（新机器的表现优于旧型号。）perform well 是表现好；outperform someone/something 是表现比对方更好，有比较对象，不用再加 than。回想：不是只说新机器好，而是胜过旧机器，用哪个动词？',
  },
  misconduct: {
    collocation: 'professional misconduct',
    example: 'The employee was dismissed for misconduct.',
    usageNote: '熟词候选：conduct 在这里是名词“行为”，不是动词“实施”；mis- 表示错误、不当。假设员工故意把私人消费作为公务费用报销：The employee was dismissed for misconduct.（这名员工因不当行为被解雇。）misconduct 常指违反职业或行为规范的行为，不是普通工作做得不够好。回想：不是能力不足，而是行为违规，用哪个名词？',
  },
  concede: {
    collocation: 'concede that someone is right',
    example: 'After checking the receipt, he conceded that I was right.',
    usageNote: '先记一句回应：“好，这点你对。”假设对方本来不相信你按时交材料，查完回执后终于承认：After checking the receipt, he conceded that I was right.（查过回执后，他承认我是对的。）固定 concede that + 承认的事实。这个义项常带不情愿，但不要求此前一定争吵；也可表示让步、让出或承认失败。若你认识 refute，可对比：我举证驳斥，他承认；不认识也不影响这个事件。回想：嘴硬之后说“这点你对”，承认的是他，他做了什么？',
  },
  pervasive: {
    collocation: 'a pervasive smell of smoke',
    example: 'The smell of smoke was pervasive throughout the house.',
    usageNote: '事件记忆，不做伪拆词。假设有人在屋里抽烟，后来卧室、走廊、衣服上都能闻到。The smell of smoke was pervasive throughout the house.（烟味弥漫整间屋子。）pervasive 侧重遍布、渗透到各处，不只是数量很多；也能形容影响或问题。prevalent 侧重某地某时很普遍，两者有重叠，但不必把另一个未记牢的词当基础。这个场景帮助理解，不保证能独立想起英文。回想：不是只有一处有烟，而是走到哪里都有，这种分布用哪个形容词？',
  },
  adverse: {
    collocation: 'adverse weather',
    example: 'Adverse weather delayed the trip.',
    usageNote: '熟词候选：bad（坏的）先帮助理解，再缩小到“对事情不利、有害”，不是同词根，也不是所有 bad 都能换成 adverse。假设你准备出海，大风迫使行程推迟：Adverse weather delayed the trip.（不利的天气耽误了行程。）固定 adverse weather；再迁移到 adverse effects（不良影响）。重点是阻碍或损害，不是自己讨厌天气。场景不能代替拼写练习。回想：看到 adverse weather，先说“天气对出海有利还是不利”；遮住 adverse，再尝试说出完整搭配。',
  },
  ascertain: {
    collocation: 'ascertain who approved the change',
    example: 'We need to ascertain who approved the change.',
    usageNote: '熟词桥梁：如果认识 certain（确定的），把 ascertain 按 as + certain 识别字形；这是助记分块，不把 as 硬解释成词根，也不按两个词分别读音。假设你不知道谁批准了变更，去查邮件、协议和签字记录：We need to ascertain who approved the change.（我们需要查明是谁批准了这项变更。）certain 表示确定的状态；ascertain 是查明事实、弄确定的动作，常接 who、whether、how 等。回想：不是猜负责人，而是查记录弄清楚，用哪个动词？',
  },
  discern: {
    collocation: 'discern a difference',
    example: 'I could discern a difference between the two pictures.',
    usageNote: '场景记忆：假设你在玩找不同，两张图乍看一样，仔细看后辨出一处差别。I could discern a difference between the two pictures.（我能辨出这两张图之间的一处差别。）discern 是动词，表示辨别、察觉、看出，常用于不容易发现的事物；也可说 discern a pattern（看出规律），不限于用眼睛看。回想：原本不明显，后来辨出来了，用哪个动词？',
  },
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
