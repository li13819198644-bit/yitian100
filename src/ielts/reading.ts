export interface ReadingLesson {
  id: string
  title: string
  focus: string
  sections: { title: string; body: string[] }[]
  examples: { en: string; zh: string; note: string }[]
  takeaway: string
  source?: { title: string; url: string }
}

export const readingLessons: ReadingLesson[] = [
  {
    id: 'passive-chain', title: '01 · 被动语态：再长的句子，也别丢 be', focus: 'may be replaced / have been used',
    sections: [
      { title: '先决定谁做动作', body: ['Workers use machines. 工人使用机器，workers 是动作执行者。Machines are used by workers. 机器被使用，machines 是动作承受者。两句基本事实相同，但强调对象不同。', '写技术类作文时，先问主语是在做动作，还是被操作。jobs 不会自己 replace 其他东西；如果说工作被机器取代，就需要被动结构。不要因为中文没有“被”字，就默认英语用主动。'] },
      { title: '把动词结构当作一个整体', body: ['may + be + replaced：may 表示可能，be 建立被动，replaced 表示取代这个动作。may 后要求原形，所以用 be，不用 is。', 'have + been + used：have 表示现在完成时，been 是 be 的过去分词，used 才是主要动作。“已经被使用”不能压缩成 have used by。', '先写核心句 Some jobs may be replaced. 再在前面加 As technology advances。添加从句不会让核心句里的 be 消失。'] },
    ],
    examples: [
      { en: 'As technology advances, routine tasks may be automated.', zh: '随着技术进步，常规任务可能实现自动化。', note: 'tasks 是被自动化的对象；may be automated 整组保留。' },
      { en: 'These systems have been used in factories for years.', zh: '这些系统已经在工厂里使用多年。', note: '强调持续到现在的使用经历；不需要知道具体是谁使用，by 短语可以省略。' },
    ],
    takeaway: '看到“情态动词 + 过去分词”，先检查是不是漏了 be；不是所有过去分词前都要机械补 be。',
    source: { title: 'Cambridge · 被动语态', url: 'https://dictionary.cambridge.org/grammar/british-grammar/passives-with-and-' },
  },
  {
    id: 'noun-meaning', title: '02 · work、staff、production：数的是哪一种东西', focus: '工作量 ≠ 一项任务；生产 ≠ 产品',
    sections: [
      { title: 'work 与 task', body: ['work 表示工作活动或工作量时，通常不可数：much work / a lot of work。想数“一项、三项”，可以换成 a task / three tasks。不能把“很多工作”直接写成 many works。', '但 works 并非永远错误：艺术作品可以是 works of art。真正要记的是“这个词在当前义项下能不能数”，不是永远不能加 s。'] },
      { title: 'staff 与 employee', body: ['staff 通常表示一个组织的员工整体。数具体人数时，three employees 或 three staff members 更清楚。不同组织的员工团队也可能用 staffs，因此不要脱离语境一律判错。', '英式英语中，staff 可按整体用单数谓语，也可强调成员用复数谓语。为了减少自己的主谓一致错误，初期写明确的人数时优先用 employees。'] },
      { title: 'production 与 product', body: ['production 强调生产活动或产量：increase production。product 是制造或销售出来的产品：launch new products。同一家公司可以增加生产，却不增加产品种类。', '相似地，equipment 通常不可数，可用 pieces of equipment 计数；information 通常不可数，可用 pieces of information 表示信息条目。'] },
    ],
    examples: [
      { en: 'The company hired three employees to handle the extra work.', zh: '公司雇用了三名员工来处理额外的工作。', note: '员工按人计数；work 是需要完成的工作量。' },
      { en: 'Automation increased production without changing the range of products.', zh: '自动化提高了产量，但没有改变产品种类。', note: '同一句中区分生产规模与产品种类。' },
    ],
    takeaway: '先确定含义，再决定可数性；把抽象工作量改成可数任务，往往比硬加 s 更准确。',
    source: { title: 'Cambridge · 可数与不可数名词', url: 'https://dictionary.cambridge.org/grammar/british-grammar/countable-and-uncountable-nouns' },
  },
  {
    id: 'articles', title: '03 · 冠词和主谓一致：先找名词中心', focus: 'an engineer / the use of robots improves',
    sections: [
      { title: '每个单数可数名词都检查一下', body: ['第一次引入一个不特定对象：an engineer、a system。已经提到或读者能识别的特定对象：the engineer、the system。my / this / each 等也可以作限定词，不是每个单数名词都必须加 a 或 the。', 'a/an 取决于紧接着的发音：an engineer、an efficient system，但 a university，因为 university 开头是 /j/ 音，不是元音。', '泛指时可以用复数或不可数名词：Engineers need training. Education matters. 加 the 往往意味着某个具体群体或某种已限定的教育。'] },
      { title: '找到真正控制谓语的主语', body: ['The use of robots improves safety. 中心词是 use，不是 robots。先把 of robots 临时拿掉，你会看到 The use improves safety。', 'Employees can reduce waste. can 后用原形 reduce，不论主语是单数还是复数。不要把主谓一致规则套到情态动词后，写成 can reduces。'] },
    ],
    examples: [
      { en: 'An engineer designed a system. The system detects faults automatically.', zh: '一名工程师设计了一个系统。这个系统会自动检测故障。', note: '第二句的 the system 指回刚引入的同一个系统。' },
      { en: 'The cost of these machines is high, but they can reduce waste.', zh: '这些机器的成本很高，但它们能减少浪费。', note: 'cost 对应 is；they 指 machines；can 后保持 reduce 原形。' },
    ],
    takeaway: '检查顺序：单数可数名词有没有限定词 → 主语中心词是什么 → 情态动词后是不是原形。',
  },
  {
    id: 'word-forms', title: '04 · accurate 还是 accuracy：看句子留了什么位置', focus: '形容词、名词与动词搭配',
    sections: [
      { title: '不要只翻译中文意思', body: ['accurate 和 accuracy 都与“准确”有关，但工作不同。形容词 accurate 描述事物：accurate measurements / the system is accurate。名词 accuracy 表示性质：improve accuracy。', '同样，convenient 描述事物方便，convenience 表示便利：Online shopping is convenient. / Online shopping offers convenience。中文都能说“方便”，英语要看句子位置。'] },
      { title: 'become 后面接什么', body: ['become 可以接形容词，表达状态改变：become accurate / become more efficient；也可以接名词身份：become an engineer。它不是只能接形容词。', 'continue to test 与 continue testing 都可能正确。初期可以选择一种稳定用法，但不要把另一种正确表达误判为错误。'] },
      { title: '从句法位置倒推词性', body: ['冠词或形容词后面通常需要名词中心；be / become 后描述性质时常用形容词；修饰动作方式常用副词。它们是检查线索，不是见到某个词就机械套用的绝对规则。'] },
    ],
    examples: [
      { en: 'The new system provides more accurate measurements and improves overall accuracy.', zh: '新系统提供更准确的测量结果，并提高整体准确性。', note: 'accurate 修饰 measurements；accuracy 是 improves 的宾语。' },
      { en: 'Although the service is convenient, its convenience does not justify the high cost.', zh: '虽然这项服务很方便，但这种便利不足以证明高费用是合理的。', note: '把形容词描述改写成名词讨论，不改变核心意思。' },
    ],
    takeaway: '先判断句子需要“描述性质”还是“讨论某种性质”，再在 accurate / accuracy 之间选择。',
  },
  {
    id: 'collocations', title: '05 · 固定搭配：把介词一起记', focus: 'demand for / be based on / rely on',
    sections: [
      { title: '三个与你写作相关的句子骨架', body: ['There is growing demand for electric cars. 这里 demand 是名词，for 引出需求对象。不要把“对……的”逐字翻译成 of。', 'The decision is based on reliable evidence. be based on 表示建立在某种依据上。A company is based in Perth 是公司位于珀斯，含义不同，不能说 based in 永远错误。', 'Factories rely on a stable power supply. rely on 引出依赖对象，后面可以是人、物或资源。'] },
      { title: '区分词义相近的词', body: ['technology 常指技术系统、知识或应用；technique 常指执行某项活动的具体方法。学习一个绘画技巧通常是 learn a painting technique，而不是为了高级感随意换成 technology。', 'continuously 强调连续不中断；continually 常强调反复发生。它们在真实用法中可能有重叠。想表达机器不停运行，可写 operates continuously；想表达反复被打断，可写 is continually interrupted。'] },
    ],
    examples: [
      { en: 'As demand for electric cars grows, manufacturers rely on reliable battery supplies.', zh: '随着电动汽车需求增长，制造商依赖可靠的电池供应。', note: '这里可靠的不是“需求”，而是供应；搭配要和实际意思一起核对。' },
      { en: 'The safety assessment is based on data collected during normal operation.', zh: '安全评估依据正常运行期间收集的数据。', note: 'collected 修饰 data；不要把评估依据写成没有来源的结论。' },
    ],
    takeaway: '记整组 demand for something、be based on evidence、rely on resources，而不是孤立记介词。',
  },
  {
    id: 'as-with-while', title: '06 · As、With、while：三种结构不要混装', focus: '完整从句 / 名词 + V-ing / 同主语省略',
    sections: [
      { title: 'As + 主语 + 谓语', body: ['As demand increases, factories expand production. demand 是主语，increases 是带时态的谓语。As 后面这部分本身是完整从句。As 有时间、原因等多种含义，语境应让关系清楚。'] },
      { title: 'With + 名词 + V-ing', body: ['With demand increasing, factories are expanding production. demand 是 increasing 的逻辑主语，但 increasing 不是独立的带时态谓语。不要写 With demand increases。', 'With 结构还有名词 + 形容词、过去分词等形式，例如 with the doors closed。V-ing 是你当前练习的重点，不是 With 后唯一合法的结构。'] },
      { title: 'while + V-ing 的主语必须对得上', body: ['While using the tool, workers made fewer errors. 使用工具的是 workers，因此省略成立。While using the tool, errors were reduced. 会让 errors 像是在使用工具，容易形成悬垂修饰。', '不确定时恢复完整从句：While workers were using the tool, they made fewer errors。句子更长，但主语关系明确。'] },
    ],
    examples: [
      { en: 'As costs rise, companies look for ways to reduce waste.', zh: '随着成本上升，公司寻找减少浪费的方法。', note: 'As 后需要完整的 costs rise。' },
      { en: 'With costs rising, companies are looking for ways to reduce waste.', zh: '在成本上升的情况下，公司正在寻找减少浪费的方法。', note: 'With 后用 costs rising；主句仍然需要自己的谓语。' },
      { en: 'While testing the system, engineers discovered a fault.', zh: '工程师在测试系统时发现了一个故障。', note: 'testing 和 discovered 的动作执行者都是 engineers。' },
    ],
    takeaway: 'As demand increases；With demand increasing；while doing 的动作执行者要能在主句里找到。',
  },
  {
    id: 'complex-control', title: '07 · 复杂句的价值是关系清楚，不是长度', focus: '定语从句、原因、让步与标点',
    sections: [
      { title: '每次只增加一种关系', body: ['先写 Companies offer training. 再问是哪类公司：Companies that use advanced equipment offer training。定语从句限定 companies。', '原因：Because workers need new skills, companies offer training。让步：Although training is expensive, it can reduce errors。前者解释为什么，后者承认不利因素后维持观点。'] },
      { title: '不要给句子装两个主连接词', body: ['通常不写 Although training is expensive, but it is useful。although 已经建立让步关系，主句直接写 it is useful。也不要写 Because costs increased, so prices rose。选一种结构即可。', '两个完整句子不能只靠一个逗号连接。可以用句号，也可以用合适的连词：Costs increased, so prices rose。分号可以连接相关的独立分句，但不是为了显得高级就必须使用。'] },
      { title: '控制指代', body: ['This、it、they 必须能指向清楚的对象。如果上句同时提到政府、公司和工人，下句突然写 they，读者可能不知道指谁。重复一个明确名词，有时比换代词更清楚。'] },
    ],
    examples: [
      { en: 'Companies that provide practical training may reduce errors because employees understand the equipment better.', zh: '提供实操培训的公司可能减少错误，因为员工更了解设备。', note: 'that 从句限定公司；because 从句解释错误减少的原因。' },
      { en: 'Although automation can improve efficiency, firms still need workers who can handle unexpected problems.', zh: '虽然自动化能提高效率，企业仍然需要能够处理意外问题的工人。', note: '让步不是自我否定，而是给结论加上合理边界。' },
    ],
    takeaway: '先有明确关系，再选从句；一句表达不清时，拆成两句通常优于继续加长。',
  },
  {
    id: 'causal-chain', title: '08 · 从“有好处”写到“为什么有好处”', focus: '观点 → 原因 → 机制 → 例子 → 结果',
    sections: [
      { title: '描述不等于解释', body: ['Automation is useful because it improves efficiency. 这句话给出了好处，但 efficiency 到底怎样提高，还没有说。继续追问：哪个步骤改变了？谁少做了什么？省下的资源去了哪里？', '可以展开成：自动检查逐个扫描产品 → 更早发现缺陷 → 有问题的产品在包装前被移除 → 避免后续返工 → 工人有时间处理复杂任务。每个箭头都应有能说明的因果关系。'] },
      { title: '例子要证明机制，而不是换一个口号', body: ['弱例子：For example, many companies use technology。它只说明技术存在，没证明效率如何变化。', '更具体的例子：一条包装线上的传感器识别破损容器，使工作人员能在装箱前移除它们。这个场景把“提前发现”和“减少返工”接起来。它是说明性情境，不需要伪造某大学调查或百分比。'] },
      { title: '给因果关系留边界', body: ['如果效果依赖培训或维护，就说明条件：provided that workers are trained / if the equipment is maintained。不要把“有可能降低错误”写成“彻底消除所有错误”。', '这条五步链是练习工具，不要求每段机械写五句，也不是官方固定模板。真正目标是让读者知道结论如何从前提产生。'] },
    ],
    examples: [
      { en: 'Automated checks can reduce waste by detecting defects before products reach the packaging stage.', zh: '自动检查可以在产品进入包装阶段前发现缺陷，从而减少浪费。', note: 'by detecting 回答“通过什么机制”，before 明确发生顺序。' },
      { en: 'This allows workers to remove faulty items early, reducing the need for later rework.', zh: '这使工人能够提前移除有问题的产品，减少后续返工的需要。', note: '结果连接到上句机制，而不是突然转到另一个好处。' },
    ],
    takeaway: '每写一个“提高、改善、促进”，继续问一句“具体通过什么过程”。',
    source: { title: 'IELTS · 理解 Task 2 题目', url: 'https://ielts.org/news-and-insights/ielts-writing-task-2-how-to-understand-ielts-question-prompts' },
  },
  {
    id: 'paragraph', title: '09 · 一个主体段落，逐句看它在做什么', focus: '安全主题 · 原创示例，不是官方评分范文',
    sections: [
      { title: '完整段落', body: ['Automation can improve workplace safety by reducing direct contact with dangerous machinery. When robots handle heavy or hazardous materials, employees can supervise the process from a safer location. For example, in a metal-processing plant, a robotic arm can move hot components while workers monitor the equipment behind a protective barrier. This arrangement reduces exposure to heat and moving parts, rather than merely making the task faster. However, regular maintenance and staff training remain necessary, since a poorly managed automated system can introduce new risks.'] },
      { title: '逐句拆解', body: ['第一句：提出有限观点 can improve，不承诺“永远安全”；by 后马上给出机制。', '第二句：解释机制中的行为变化，工人从直接接触变成在安全位置监督。第三句：用金属加工的具体场景体现这种变化。', '第四句：把例子收回安全这一论点，而不是跑去讨论速度。第五句：指出维护和培训的条件，使观点更准确。'] },
      { title: '可以迁移到什么话题', body: ['写远程医疗时，可以沿用“减少不必要出行 → 降低时间成本 → 偏远地区复诊场景 → 更容易持续获得建议”的关系，但不能原封不动换几个名词。', '复述时先想清楚中文因果，再用你稳定掌握的英文结构表达。结构迁移比逐字背诵这段更重要。'] },
    ],
    examples: [], takeaway: '一个段落围绕一个明确主张展开；例子和限制条件都应该服务于同一个主张。',
  },
  {
    id: 'task2-plan', title: '10 · Task 2：先回应题目，再组织语言', focus: '双方观点 + 个人立场',
    sections: [
      { title: '题目', body: ['Some people believe that advances in technology improve the quality of life, while others think they create more problems than they solve. Discuss both views and give your own opinion.', '这题要求讨论两方并给出你的观点。只写技术好处，即使语言流畅，也没有完整回应任务。讨论两方不代表最后必须赞成各一半。'] },
      { title: '一个可行提纲', body: ['引言：概括争议，并表明有条件的立场，例如技术总体有益，但收益依赖培训和管理。不要开头宣称完全赞成，结尾突然说双方一样。', '主体一：技术如何改善生活，选择一个能充分展开的机制，例如更容易获得医疗服务。主体二：技术怎样造成问题，例如自动化对缺乏转岗支持的员工造成冲击，并解释为什么这些风险可以或不可以控制。', '结尾：回答题目并概括权衡，不再引入全新的重大理由。这只是可选组织方式，不是所有题型通用的四段模板。'] },
      { title: '四项自检', body: ['任务回应：两方和你的立场都清楚吗？连贯与衔接：段落是否按读者能跟上的顺序发展？词汇：用词是否准确、自然，而不是一味替换成生僻词？语法：有没有灵活且准确的句型，错误是否妨碍理解？', 'Task 2 至少 250 词。篇幅达到要求不等于论证充分；也没有“越长越高分”的规则。单篇 Task 2 的模拟评价也不是完整 Writing 成绩。'] },
    ],
    examples: [
      { en: 'In my view, technology generally improves living standards, provided that its risks are actively managed.', zh: '我认为，只要主动管理风险，技术总体上能够提高生活水平。', note: '明确立场，同时提出需要在正文解释的条件；不能只写这句话而不落实。' },
    ],
    takeaway: '动笔前列出题目要求的每个部分，再为每个主张配一个机制和一个支持它的情境。',
    source: { title: 'IELTS · Academic Writing 格式', url: 'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing' },
  },
  {
    id: 'task2-example', title: '11 · 完整作文阅读：技术与生活质量', focus: '原创学习示例 · 不标注 Band 分数',
    sections: [
      { title: '引言：争议与立场', body: ['Technological progress has changed how people work, communicate and obtain essential services. Some regard these changes as improvements to everyday life, while others are concerned about their social costs. In my view, technology generally raises living standards, but its benefits depend on how effectively governments and employers manage the risks.'] },
      { title: '主体一：获取医疗服务的机制', body: ['One important benefit is that technology can make essential services more accessible. Remote medical consultations, for example, allow some patients to receive advice without travelling long distances. For a person living far from a hospital, this can reduce both transport costs and time away from work. Digital records can also help clinicians review previous treatments before recommending further care. These improvements do not mean that online appointments can replace every physical examination. Rather, technology can remove unnecessary journeys and help medical staff reserve face-to-face appointments for cases that require them.'] },
      { title: '主体二：就业风险与应对条件', body: ['However, new technology can also create serious difficulties, particularly when it is introduced without adequate support. Automation may replace routine tasks more quickly than workers can learn alternative skills. An employee whose role disappears may struggle to find another job if affordable training is unavailable. The problem is therefore not simply the existence of machines, but the gap between changing labour demand and opportunities to adapt. Employers can reduce this gap by offering practical retraining before new systems are installed, while governments can help people access courses that lead to realistic employment opportunities. Such measures cannot prevent every job loss, but they can make the transition less damaging.'] },
      { title: '结论：回到权衡', body: ['Overall, technological advances can improve quality of life by widening access to services and changing how work is performed. Nevertheless, these gains should not be assumed to occur automatically. Investment in training and careful implementation are necessary if the benefits are to be shared more widely.'] },
      { title: '阅读时抓住这四点', body: ['全文不声称所有线上问诊都适用，而是明确了面对面检查的边界。例子是可理解的情境，没有借用虚构研究数据来撑场面。', '就业段落没有停在“机器人抢工作”，而是解释技能转换速度与培训机会之间的缺口。应对措施对应的正是这个缺口。', '结尾回应引言的条件性立场，没有引入与正文无关的新论点。它是一种写法，不是必须背诵的模板，也没有经过官方考官评分。'] },
    ],
    examples: [], takeaway: '学习这篇的“关系”：主张如何被解释、限制和支持，不要把整篇当成可套用到任何题目的答案。',
  },
  {
    id: 'editing', title: '12 · 落笔后的检查顺序：先意思，再语法', focus: '用自己的常见错误做最后一轮检查',
    sections: [
      { title: '第一轮：检查有没有答题', body: ['把每段压缩成一句中文：它在回答题目的哪一部分？如果一段只说“科技发展很快”，却没有解释生活如何变好或变差，就需要补机制，而不是再加一个高级词。', '把每个结论前面的 because 或 by 内容读一遍。如果原因只是换一种方式重复结论，说明论证还没有前进。'] },
      { title: '第二轮：检查动作结构', body: ['圈出 may、can、should、have、has。检查情态动词后是否用原形；主语若是动作承受者，检查是否需要 be；完成时被动检查 been。', '划出每个主语中心词，暂时跳过 of 短语和定语从句，再核对主谓。遇到 while doing，确认主句主语确实在做这个动作。'] },
      { title: '第三轮：检查名词和搭配', body: ['单数可数名词是否缺少限定词？work、equipment、information 是否被误当可数名词？production 到底是生产还是产品？', '检查 based on、rely on、demand for 是否符合当前含义。描述性质用 accurate / convenient，讨论性质本身用 accuracy / convenience。'] },
      { title: '最后一轮：检查强度和指代', body: ['把 always、never、all、completely 逐个检查。有依据才用绝对表达；否则根据实际含义考虑 can、may、some，不能为了保守而把所有论点都写得含糊。', '确认 this、it、they 指谁。发现句子控制不住，优先拆句。修改的目标是让表达更准确，不是让每一句看起来更复杂。'] },
    ],
    examples: [
      { en: 'As technology develops, some routine tasks may be automated, allowing employees to focus on work that requires judgement.', zh: '随着技术发展，一些常规任务可能实现自动化，使员工能够专注于需要判断力的工作。', note: '检查 As 完整从句、may be automated、不可数 work，以及限定 work 的定语从句。' },
    ],
    takeaway: '这次只牢牢记住三件事也可以：被动别漏 be；名词先辨含义；好处必须说明具体机制。',
  },
]
