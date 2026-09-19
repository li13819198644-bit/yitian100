export interface GrammarReadingSection {
  title: string
  explanation: string
  pattern: string
  english: string
  chinese: string
  note: string
}
export interface GrammarReading {
  id: string
  title: string
  category: '时间与假设' | '长句与结构' | '表达与语气'
  summary: string
  takeaway: string
  sections: GrammarReadingSection[]
  contrast: { first: string; second: string; explanation: string }
  pitfall: string
  source: { title: string; url: string }
}
const section = (title: string, explanation: string, pattern: string, english: string, chinese: string, note: string): GrammarReadingSection => ({ title, explanation, pattern, english, chinese, note })
const bc = (path: string) => ({ title: 'British Council 语法参考', url: `https://learnenglish.britishcouncil.org/free-resources/grammar/${path}` })

// Original Chinese teaching notes and examples; reference links are further reading.
export const grammarLibrary: GrammarReading[] = [
  {
    id: 'mixed-conditionals', title: '混合条件句：过去影响现在', category: '时间与假设',
    summary: '先分清条件和结果各在什么时间，再选择动词形式。',
    takeaway: '条件与结果不必在同一时间；不要整句机械套一种时态。',
    sections: [
      section('过去条件，过去结果', '设想过去本来可以不同。条件和结果都已经过去，常用于遗憾或复盘。', 'If + had + 过去分词, would/could/might have + 过去分词', 'If we had checked the invoice, we would have noticed the extra fee.', '如果我们当时检查了发票，就会发现那笔额外费用。', '实际没有检查；would 表示设想的结果，could 强调有可能做到。'),
      section('过去条件，现在结果', '改变的是过去的选择，但谈的是现在会怎样。结果部分不用完成式，因为结果位于现在。', 'If + had + 过去分词, would + 动词原形', 'If I had accepted that job, I would live closer to my family now.', '如果当时接受了那份工作，我现在就会住得离家人更近。', 'had accepted 指过去；would live 和 now 指现在。'),
      section('一般状态，过去结果', '假设某种一贯的状态不同，再设想它会怎样改变过去发生的事。这里过去式不一定表示过去时间。', 'If + 过去式, would have + 过去分词', 'If I were more organised, I would not have missed the deadline yesterday.', '如果我做事更有条理，昨天就不会错过截止时间。', 'were more organised 是对一贯状态的假设，不是特指昨天。'),
    ],
    contrast: { first: 'If I had saved more, I would have bought it last year.', second: 'If I had saved more, I could afford it now.', explanation: '第一句结果在去年，用完成式；第二句结果在现在，用 could afford。两个条件都指过去。' },
    pitfall: '常规反事实条件中，不要把 If I had known 写成 If I would have known。先画出“条件时间 → 结果时间”，再决定结构。',
    source: bc('b1-b2/conditionals-third-mixed'),
  },
  {
    id: 'negative-inversion', title: '倒装：把强调放在句首', category: '长句与结构',
    summary: '理解 Never、Only after、Not until 开头的正式表达。',
    takeaway: '否定或限制性状语前置时，常把助动词放到主语前；不是把所有动词搬走。',
    sections: [
      section('已有助动词，直接提前', 'Never、rarely、seldom 等位于句首并修饰整句时，常引出倒装。语气比普通语序更强调，常见于正式写作。', 'Never/Rarely + 助动词 + 主语 + 其余部分', 'Never have I seen such a detailed explanation.', '我从未见过如此详细的解释。', '普通语序是 I have never seen...，提前的是 have。'),
      section('没有助动词，借用 do', '一般现在时或一般过去时没有现成助动词时，用 do、does 或 did；实义动词恢复原形。', 'Seldom + do/does/did + 主语 + 动词原形', 'Seldom does the team miss a deadline.', '这个团队很少错过截止时间。', 'does 承担第三人称单数变化，所以后面是 miss，不是 misses。'),
      section('Only after / Not until：倒装主句', '句首先交代限制条件或时间；后面的主句倒装。after、until 内部的从句仍用正常语序。', 'Only after + 从句, 助动词 + 主语 + 动词', 'Only after I checked the figures did I understand the problem.', '直到核对了数字之后，我才理解问题。', 'I checked 不倒装；主句用 did I understand。'),
    ],
    contrast: { first: 'Only Mia understood the report.', second: 'Only then did Mia understand the report.', explanation: '第一句 only 修饰主语 Mia，不倒装；第二句 only then 是前置的时间状语，主句倒装。' },
    pitfall: 'Not until the meeting ended did we leave 中，不能写成 until did the meeting end。倒装位置在主句。',
    source: bc('c1/inversion-after-negative-adverbials'),
  },
  {
    id: 'participle-clauses', title: '分词结构：压缩长句不丢主语', category: '长句与结构',
    summary: '读懂 Having done、Given、Designed to 开头的句子。',
    takeaway: '先找是谁做动作，再看主动、被动与先后关系。',
    sections: [
      section('-ing：主动的背景动作', '句首分词结构通常和主句共用逻辑主语，可补充同时发生的动作或原因；分词本身不独立标明时态。', '-ing 分词结构, 主语 + 谓语', 'Reviewing the contract, Maya noticed an unusual clause.', '玛雅审阅合同时，注意到一条不寻常的条款。', '审阅合同和发现条款的都是 Maya。'),
      section('过去分词：被动或状态', '当主语是动作的承受者，常用过去分词。不能把过去分词简单理解为“事情一定发生在过去”。', '过去分词结构, 主语 + 谓语', 'Written in plain English, the guide is easy to follow.', '这份指南用浅显英语写成，很容易理解。', '被写的是 the guide；主句 is 表明当前的性质。'),
      section('Having done：明确先完成', '用完成分词突出一个动作先于主句动作完成；先看合同，再作决定。被动形式是 having been done。', 'Having + 过去分词, 主语 + 谓语', 'Having compared the offers, we chose the cheaper plan.', '比较完各项报价后，我们选择了更便宜的方案。', 'compare 先发生，choose 后发生。'),
    ],
    contrast: { first: 'Walking into the office, I noticed the broken window.', second: 'When I walked into the office, the broken window caught my attention.', explanation: '两句都明确是“我”走进办公室。不要写 Walking into the office, the window...，否则结构上仿佛窗户在走。' },
    pitfall: '普通句首状语型分词结构要检查逻辑主语。不要把这个检查机械扩展到所有 -ing 用法；名词后修饰语和独立主格属于不同结构。',
    source: bc('c1/participle-clauses'),
  },
  {
    id: 'advanced-relatives', title: '关系从句：逗号会改变范围', category: '长句与结构',
    summary: '区分限定信息、补充信息，以及 which 指代整件事。',
    takeaway: '先判断从句是在筛选“哪一个”，还是在补充已确定对象的信息。',
    sections: [
      section('限定：决定你说的是谁', '没有逗号的限定性关系从句帮助确定名词范围。关系代词作宾语时通常可以省略；作主语时不能随便省。', '名词 + who/which/that + 从句', 'The proposal that we discussed yesterday has been approved.', '我们昨天讨论的那份提案已经获批。', 'that 是 discussed 的宾语，可写 The proposal we discussed...。'),
      section('补充：对象已经明确', '非限定性从句用逗号隔开，提供额外信息。这里不能用 that，也不能直接省掉关系代词。', '名词, who/which + 从句, 主句其余部分', 'Our new manager, who previously worked abroad, speaks three languages.', '我们的新经理以前在国外工作过，会说三种语言。', '经理已经确定；从句不是从几位经理里筛选一位。'),
      section('which 可以指整件事', '逗号后的 which 有时指前面整句话，而不是最近那个名词。判断时看后面的评价针对什么。', '完整分句, which + 评价或结果', 'The supplier cancelled the order, which delayed the launch.', '供应商取消了订单，这件事推迟了上线。', '造成延迟的是取消订单这件事；不是说“订单”本身在推迟。'),
    ],
    contrast: { first: 'The employees who work remotely received laptops.', second: 'The employees, who work remotely, received laptops.', explanation: '第一句限定远程办公的那部分员工；第二句把远程办公作为这群员工的补充情况。实际所指范围仍依语境确定。' },
    pitfall: '不要同时写 the proposal that we discussed it：that 已经占据宾语位置，通常不再加 it。正式表达还可用 the colleague with whom I worked。',
    source: bc('english-grammar-reference/relative-pronouns-relative-clauses'),
  },
  {
    id: 'cleft-focus', title: '强调句：同一事实，焦点不同', category: '表达与语气',
    summary: '把“谁”“何时”“真正需要什么”放到读者眼前。',
    takeaway: '强调句主要重排信息焦点，不是给句子额外增加事实。',
    sections: [
      section('强调人', 'It-cleft 把被强调的成分放在 be 后，其余内容放到 who/that 后。适合纠正对方的猜测。', 'It is/was + 焦点 + who/that + 其余内容', 'It was Maya who approved the refund.', '批准退款的是玛雅。', '重点回答“谁批准”，不只是在报告有人批准了。'),
      section('强调时间或地点', '同样结构可突出动作在何时、何地发生。这里的 that 是强调结构的一部分，不是随意替换的时间关系副词。', 'It was + 时间/地点 + that + 主语 + 谓语', 'It was after the audit that we changed the policy.', '我们是在审计之后才修改政策的。', '把 after the audit 提为焦点，突出不是在审计之前。'),
      section('What-cleft：先留一个信息空位', 'What 引导的部分表示“所需要的东西”等，再用 be 给出焦点信息。这不是疑问句，内部不用疑问语序。', 'What + 主语 + 谓语 + is/was + 焦点', 'What we need is a clear deadline.', '我们需要的是一个明确的截止时间。', 'we need 用正常语序，不写 what do we need is...。'),
    ],
    contrast: { first: 'Maya sent the report on Monday.', second: 'It was on Monday that Maya sent the report.', explanation: '事实基本相同。第一句中性陈述；第二句把星期一突出出来，适合回应“她不是周二发的吗”。' },
    pitfall: 'It is useful to check the figures 不是这种强调句：useful 是评价，不是从原句中抽出的焦点成分。',
    source: { title: 'British Council：Cleft sentence', url: 'https://www.teachingenglish.org.uk/professional-development/teachers/teaching-knowledge-database/c/cleft-sentence' },
  },
  {
    id: 'past-modals', title: '过去推测：must have 不等于必须做', category: '时间与假设',
    summary: '区别确信、可能、不可能，以及“本来应该”。',
    takeaway: '先看是在推测事实，还是在评价本来该怎样做。',
    sections: [
      section('must have done：有把握的推测', '依据现在掌握的证据，推断过去很可能发生过某事。这里 must 表示推断把握，不是过去的义务。', 'must have + 过去分词', 'The account is empty. Someone must have withdrawn the money.', '账户空了，一定有人取走了钱。', '这仍是推测。表达过去必须做某事，通常用 had to。'),
      section('might / may have done：保留可能', '说明某种解释有可能，但不把它当成已确定的事实。could have 有时也表示这种可能，具体要看语境。', 'might/may/could have + 过去分词', 'She might have sent the invoice to the wrong address.', '她可能把发票寄到了错误地址。', '不知道她究竟有没有寄错，不应翻成她肯定寄错了。'),
      section('cannot have 与 should have', 'cannot have 表示认为过去不可能如此；should have 常用于事后评价，本来应该却未必做了，也能在别的语境中表示预期。', 'cannot have / should have + 过去分词', 'You should have checked the fee before signing.', '你签字前本来应该核对费用。', '这里是事后建议或批评，不是推测你一定核对了。'),
    ],
    contrast: { first: 'He must have paid the bill.', second: 'He had to pay the bill.', explanation: '第一句是“他一定付过账了”的推测；第二句是“他当时不得不付账”的义务。' },
    pitfall: '强否定推测通常用 cannot/could not have，不要把 must not have 机械当成所有语境下“一定没做”的唯一对应式。should have 的含义也要看上下文。',
    source: bc('b1-b2/modals-deductions-about-past'),
  },
  {
    id: 'perfect-viewpoint', title: '完成时：站在过去回头看', category: '时间与假设',
    summary: '过去完成式和完成进行式，分别突出结果与过程。',
    takeaway: '完成式需要一个参照点：先找“站在哪个时间回头看”。',
    sections: [
      section('had done：在过去参照点之前', '先设定一个过去时刻，再回看此前发生或完成的事。不是只因为一件事很久以前发生，就必须用过去完成时。', '过去参照点 + had + 过去分词', 'When the meeting began, I had already read the report.', '会议开始时，我已经读完报告了。', '参照点是会议开始，读完报告发生得更早。'),
      section('had been doing：突出持续过程', '关注某活动一直延续到过去某个时刻，或刚结束并留下当时可见的影响；不把“完成了多少”放在首位。', 'had been + -ing', 'By lunchtime, we had been discussing the contract for three hours.', '到午饭时，我们已经讨论合同三个小时了。', '重点是持续了多久，不保证合同已谈妥。'),
      section('状态动词通常不用进行式', 'know、believe 等表示状态时，通常用普通完成式；for 和 since 不会自动要求进行式。', 'had known / had believed + 时间范围', 'I had known the client for years before we worked together.', '合作之前，我已经认识这位客户很多年了。', '认识是状态，这里不用 had been knowing。'),
    ],
    contrast: { first: 'At six, I had written three emails.', second: 'At six, I had been writing emails for an hour.', explanation: '第一句看完成的数量；第二句看此前持续的活动。两句都从六点这个过去参照点回看。' },
    pitfall: '不要把一段过去叙事里的每个动词都变成 had done。时间顺序已经明确、只是接着讲下一件事时，一般过去时往往足够。',
    source: bc('english-grammar-reference/past-perfect'),
  },
  {
    id: 'hedging', title: '缓和表达：专业，但不把话说满', category: '表达与语气',
    summary: '在建议、讨论和报告中准确表达把握程度。',
    takeaway: '证据有多强，语气就有多强；委婉不等于含糊其辞。',
    sections: [
      section('把断言改为有依据的判断', 'seem、appear、suggest 等可以标记“这是根据现有信息作出的判断”，给进一步证据留余地。', 'The evidence suggests that ... / It appears that ...', 'The evidence suggests that the new schedule may reduce delays.', '现有证据表明，新安排可能减少延误。', 'suggests 标记证据支持的推断；may 保留可能性，没有声称效果已被彻底证明。'),
      section('提出建议而不是直接命令', 'could、might 等可让建议保留选择空间。它们不只表示过去时间，语用功能取决于语境。', 'We could ... / It might be worth + -ing', 'It might be worth reviewing the cancellation fee.', '或许值得重新审视一下取消费用。', '说话者在提出建议，不是在断言审查已经发生。'),
      section('限定范围，避免过度概括', 'often、tend to、in some cases 等限定频率或适用范围。范围限定要符合事实，不能靠堆修饰词掩盖不确定。', '主语 + tends to + 动词原形', 'This approach tends to work better with smaller teams.', '这种做法通常在较小团队中更有效。', 'tends to 不是 always；承认可能存在例外。'),
    ],
    contrast: { first: 'Your estimate is wrong.', second: 'There may be an error in the estimate.', explanation: '第二句聚焦估算本身，并保留核查余地。若错误已确认且涉及必须执行的要求，则应直接说明事实，不必一味弱化。' },
    pitfall: '不要把 might possibly perhaps 连续堆在一句里。选择一个准确表达把握程度的方式，再给出理由。',
    source: { title: 'Cambridge：Hedges', url: 'https://dictionary.cambridge.org/grammar/british-grammar/hedges-just' },
  },
  {
    id: 'ellipsis', title: '省略与替代：长句为什么少了词', category: '长句与结构',
    summary: '读懂 do so、so do I 和留下助动词的短回答。',
    takeaway: '能从上下文明确恢复的内容才适合省略；不是任意删词。',
    sections: [
      section('保留助动词，省略重复内容', '回答或并列句中，可以只保留与前面动词结构对应的助动词，省掉已经明确的部分。', '主语 + 助动词（省略重复的动词短语）', 'Maya has checked the figures, but I have not.', '玛雅核对了数字，但我还没有。', 'have not 后省掉的是 checked the figures。'),
      section('do so 替代前面的动作', 'do so 可以替代已经提过的动作，较常见于书面语。它通常指完整的相关动作，而不是随便替换一个名词。', 'do/does/did so', 'You can cancel the booking online. Please do so before Friday.', '你可以在线取消预订，请在周五之前取消。', 'do so 指 cancel the booking online；不需要再重复整段。'),
      section('so / neither 表示同样如此', '表示另一个人也有同样情况，使用 so + 助动词 + 主语；否定对应 neither 或 nor。', 'So + 助动词 + 主语 / Neither + 助动词 + 主语', 'Maya can attend, and so can I.', '玛雅能参加，我也能。', '助动词应与前面的结构匹配；这里是 can，不是 do。'),
    ],
    contrast: { first: 'Maya likes the plan. So do I.', second: 'Maya likes the plan. So she does.', explanation: 'So do I 表示“我也喜欢”；So she does 表示“她确实喜欢”，是在确认前述情况，语序和作用不同。' },
    pitfall: '省略后如果读者无法判断缺的是哪个动作，就应补回内容。完整正式书面句中，不要照聊天消息随意删去主语或必要的 be。',
    source: { title: 'Cambridge：Ellipsis', url: 'https://dictionary.cambridge.org/grammar/british-grammar/ellipsis' },
  },
  {
    id: 'reporting-passives', title: '被动转述：新闻中的 is said to', category: '表达与语气',
    summary: '区分“据称”与事实，以及被转述动作的时间。',
    takeaway: 'is believed 是转述框架；to do 或 to have done 负责交代相对时间。',
    sections: [
      section('把消息内容作为焦点', '用 It is reported/believed that 把消息放在前面，不必立刻说是谁报道的。省略消息来源不代表消息已经得到证实。', 'It is reported/believed that + 从句', 'It is reported that the supplier is seeking a buyer.', '据报道，这家供应商正在寻找买家。', '这是报道内容；reported 本身不保证内容一定准确。'),
      section('把被报道的人或事作主语', '主语换成消息里的对象，后接被动转述动词和不定式。若说的是当前状态，可用 to do；正在进行的事可用 to be doing。', '主语 + is said/believed + to do / to be doing', 'The company is believed to be negotiating a merger.', '据信，这家公司正在商谈合并。', 'is believed 是现在的看法；to be negotiating 表示当前进程。'),
      section('早于转述时点，用完成不定式', '如果被报道的动作早于报道或相信的时点，用 to have done。不要只看整句出现 is 就把所有动作理解为现在。', '主语 + is said/believed + to have + 过去分词', 'The company is said to have rejected the offer last week.', '据说，这家公司上周拒绝了报价。', '拒绝发生在上周；现在有人这样转述。'),
    ],
    contrast: { first: 'The director is believed to be abroad.', second: 'The director is believed to have left the country.', explanation: '第一句是对目前所在地的看法；第二句是对已经离境这一较早动作的看法。两句都不是说话者亲自担保的事实。' },
    pitfall: '主动的 say 不能直接照搬成 They say the company to...；可用 They say that...，或改为 The company is said to...。',
    source: bc('c1/advanced-passives-review'),
  },
]

export function searchGrammarLibrary(query: string, category = ''): GrammarReading[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return grammarLibrary.filter((article) => {
    if (category && article.category !== category) return false
    const content = [article.title, article.summary, article.takeaway, article.pitfall, ...article.sections.flatMap((s) => [s.title, s.explanation, s.pattern, s.english, s.chinese, s.note]), ...Object.values(article.contrast)].join(' ').toLocaleLowerCase()
    return terms.every((term) => content.includes(term))
  })
}
