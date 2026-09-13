export interface GrammarQuestion {
  id: string
  topicId: string
  sentence: string
  options: string[]
  answer: number
  explanation: string
  translation: string
}
export interface GrammarTopic {
  id: string
  title: string
  subtitle: string
  rules: string[]
  example: string
  questions: GrammarQuestion[]
}
type QuestionInput = [string, string[], number, string, string]
function topic(id: string, title: string, subtitle: string, rules: string[], example: string, inputs: QuestionInput[]): GrammarTopic {
  return { id, title, subtitle, rules, example, questions: inputs.map(([sentence, options, answer, explanation, translation], i) => ({ id: `${id}-${i + 1}`, topicId: id, sentence, options, answer, explanation, translation })) }
}

export const grammarTopics: GrammarTopic[] = [
  topic('tense', '时态与时间线', '习惯、正在发生、过去与现在', [
    'every day 等表示习惯，通常用一般现在时；正在发生的动作用 be + -ing。',
    '明确结束的过去时间用一般过去时；从过去持续到现在常用现在完成时。',
    '过去某个时间点之前已经完成，用 had + 过去分词。',
  ], 'I have lived here since 2020. 我从 2020 年起一直住在这里。', [
    ['She usually ___ to work by bus.', ['go', 'goes', 'is go', 'going'], 1, 'usually 表示习惯。主语 she 是第三人称单数，因此 go 变成 goes。', '她通常乘公交车上班。'],
    ['Look! The children ___ in the garden.', ['play', 'plays', 'are playing', 'has played'], 2, 'Look! 把注意力引向正在发生的动作。复数主语用 are playing。', '看！孩子们正在花园里玩。'],
    ['We ___ the museum yesterday.', ['visited', 'have visited', 'visit', 'had visit'], 0, 'yesterday 是已经结束的过去时间，用一般过去时 visited，不用现在完成时。', '我们昨天参观了博物馆。'],
    ['I ___ Maya since we were children, and we are still close friends.', ['know', 'am knowing', 'knew', 'have known'], 3, 'since 引出过去的起点，认识的状态持续到现在，用 have known。know 通常不用进行时。', '我从小就认识玛雅，我们现在仍是好朋友。'],
    ['By the time I arrived yesterday, the film ___ already ___.', ['has / started', 'had / started', 'is / starting', 'will / start'], 1, '电影开始早于我昨天到达，即“过去的过去”，用 had started。', '我昨天到的时候，电影已经开始了。'],
  ]),
  topic('modal', '情态动词', '必须、可以、不必与推测', [
    'can、must、should 等后接动词原形，不加 to，也不加第三人称单数 -s。',
    'must not 是“不准”；do not have to 是“没有必要”，不是禁止。',
    'must have + 过去分词可表示对过去的有把握推测。',
  ], 'You do not have to drive. 你不必开车（但可以开）。', [
    ['Visitors ___ touch the paintings. It is forbidden.', ['must not', 'do not have to', 'might', 'can'], 0, 'forbidden 表示禁止，选 must not。do not have to 只表示不必，仍然允许。', '参观者禁止触摸画作。'],
    ['You ___ bring lunch; food is provided, but you may bring your own.', ['must not', 'cannot', 'do not have to', 'must'], 2, '已经提供食物，也允许自带，所以是“不必带”，不是“不准带”。', '你不必带午饭；这里提供食物，但也可以自带。'],
    ['Leo can ___ very well.', ['swims', 'swim', 'to swim', 'swimming'], 1, 'can 后面直接接动词原形 swim，主语是 Leo 也不用 swims。', '利奥游泳游得很好。'],
    ['You look exhausted. You ___ take a break.', ['should to', 'should taking', 'should takes', 'should'], 3, '提出建议用 should + 动词原形。这里后面已经有 take，所以只填 should。', '你看起来累极了，应该休息一下。'],
    ['Her coat is gone and her office is empty. She must ___ already.', ['leave', 'have left', 'has left', 'leaving'], 1, '根据当前迹象推测她已经离开，用 must have left；must 后不能接 has。', '她的外套不在，办公室也空了。她一定已经离开了。'],
  ]),
  topic('conditional', '条件句', '真实可能与假设', [
    '一般规律：if + 一般现在时，主句一般现在时。',
    '未来真实可能：if + 一般现在时，主句 will + 原形。',
    '现在的非真实假设：if + 过去式，would + 原形；过去的反事实：had + 过去分词，would have + 过去分词。',
  ], 'If I had more time, I would travel. 如果时间更多，我就会去旅行。', [
    ['If water reaches 100°C at sea level, it ___.', ['boil', 'boils', 'boiling', 'would boiled'], 1, '描述一般规律，主句用一般现在时。water 是不可数名词，动词用 boils。', '在海平面上，水达到 100 摄氏度就会沸腾。'],
    ['If it ___ tomorrow, we will stay at home.', ['will rain', 'raining', 'rains', 'would rain'], 2, '在这个未来条件句中，if 从句用一般现在时 rains，主句才用 will。', '如果明天下雨，我们就待在家里。'],
    ['If I ___ you, I would apologise.', ['were', 'am', 'will be', 'have been'], 0, 'If I were you 是“假如我是你”的非真实假设，主句配 would。', '如果我是你，我会道歉。'],
    ['I cannot afford it. If I had more money, I ___ that laptop.', ['will buy', 'buy', 'had bought', 'would buy'], 3, '现在没有足够的钱，假设与现实不同；if 从句用 had，主句用 would buy。', '我买不起。如果钱更多，我就会买那台笔记本电脑。'],
    ['We missed the train. If we had left earlier, we ___ it.', ['will catch', 'would have caught', 'would catch', 'have caught'], 1, '错过列车已成事实。对过去作相反假设，用 would have caught，而非表示现在假设的 would catch。', '我们错过了火车。如果早点出发，就赶上了。'],
  ]),
  topic('relative', '定语从句', '说明是哪一个人或事物', [
    'who 指人；which 指物；that 可在限定性定语从句中指人或物。',
    'whose 后接名词，表示“谁的”；where 在从句中表示地点。',
    '关系词作宾语时，限定性从句中常可省略；作主语时不可省略。',
  ], 'The woman who lives next door is a doctor. 住在隔壁的女士是医生。', [
    ['The man ___ called you is my uncle.', ['which', 'where', 'who', 'whose'], 2, '先行词 man 是人，空格在从句中作 called 的主语，用 who。whose 后面需要接名词。', '给你打电话的那位男士是我叔叔。'],
    ['This is the laptop ___ I bought yesterday.', ['which', 'who', 'where', 'whose'], 0, 'laptop 是物，which 在从句中作 bought 的宾语。这里也可以省略 which。', '这就是我昨天买的笔记本电脑。'],
    ['I know a designer ___ work has won several awards.', ['who', 'which', 'whom', 'whose'], 3, '空格后有名词 work，要表达“这位设计师的作品”，所以用表示所属的 whose。', '我认识一位设计师，其作品获得过多个奖项。'],
    ['This is the café ___ we first met.', ['which', 'where', 'whose', 'who'], 1, 'we first met 已有主语和谓语，缺少“在这家咖啡馆”的地点信息，where 相当于 in which。', '这就是我们第一次见面的咖啡馆。'],
    ['My car, ___ is ten years old, still runs well.', ['that', 'who', 'which', 'what'], 2, '逗号隔开的是补充说明用的非限定性定语从句，指物用 which，不能用 that。', '我的车已有十年车龄，但仍开得很好。'],
  ]),
  topic('verb-pattern', '动词搭配', '什么时候用 -ing 或 to do', [
    'enjoy、avoid、finish 后常接 -ing；decide、hope、plan 后常接 to + 原形。',
    '介词后用名词或 -ing。look forward to 里的 to 是介词。',
    'stop doing 是停止正在做的事；stop to do 是停下别的事去做。',
  ], 'I enjoy reading. 我喜欢阅读。 / I decided to leave. 我决定离开。', [
    ['She enjoys ___ detective novels.', ['read', 'to read', 'reads', 'reading'], 3, 'enjoy 后接动词时用 -ing，所以是 enjoys reading，不是 enjoys to read。', '她喜欢读侦探小说。'],
    ['We decided ___ the meeting until Friday.', ['postponing', 'to postpone', 'postpone', 'postponed'], 1, 'decide 后用 to + 动词原形，表示决定做某事。', '我们决定把会议推迟到周五。'],
    ['I am looking forward to ___ you.', ['seeing', 'see', 'saw', 'seen'], 0, 'look forward to 中的 to 是介词，后接 seeing，不是动词不定式的 to see。', '我期待见到你。'],
    ['He left without ___ goodbye.', ['say', 'to say', 'saying', 'said'], 2, 'without 是介词，后面的动词用 -ing：without saying goodbye。', '他没有告别就离开了。'],
    ['After two hours of driving, we stopped ___ some coffee before continuing.', ['buy', 'buying', 'bought', 'to buy'], 3, '这里是停下开车去买咖啡，用 stopped to buy；stopped buying 是“不再买”。', '开车两小时后，我们停下来买了咖啡，然后继续赶路。'],
  ]),
  topic('passive', '被动语态', '把重点放在承受动作的一方', [
    '基本结构是 be + 过去分词，时态变化体现在 be 上。',
    '正在被做：is/are being + 过去分词；已经被做：has/have been + 过去分词。',
    '未来被做：will be + 过去分词。动作执行者可用 by 引出。',
  ], 'The bridge was built in 1998. 这座桥建于 1998 年。', [
    ['English ___ in many countries.', ['is spoken', 'speaks', 'is speaking', 'has speaking'], 0, 'English 是被使用的语言，不是执行“说”这个动作的人；一般现在时被动用 is spoken。', '许多国家使用英语。'],
    ['The bridge ___ in 1998.', ['built', 'is building', 'was built', 'has build'], 2, '桥是被建造的，1998 是过去时间，所以用 was built。', '这座桥建于 1998 年。'],
    ['My car ___ right now, so I am taking the bus.', ['repairs', 'is being repaired', 'has repairing', 'is repaired yesterday'], 1, 'right now 表示正在进行，汽车承受维修动作，因此用 is being repaired。', '我的车现在正在维修，所以我乘公交车。'],
    ['The emails have already ___ to all participants.', ['send', 'sending', 'being sent', 'been sent'], 3, '现在完成时被动结构是 have been sent。句中已有 have，空格填 been sent。', '邮件已经发送给所有参与者。'],
    ['The results will ___ online tomorrow.', ['be published', 'published', 'be publishing', 'have publish'], 0, '结果将被公布，用 will be published。will 后接原形 be，再接过去分词 published。', '结果将于明天在网上公布。'],
  ]),
  topic('agreement', '冠词与主谓一致', 'a、an、the，以及单复数', [
    'a/an 按后面单词开头的发音选择，不是按字母：an hour，a university。',
    '第一次提到不特定的单数可数名词常用 a/an；再次提到同一个对象常用 the。',
    'each + 单数名词作主语时用单数谓语；information 是不可数名词。',
  ], 'Each student has a book. 每位学生都有一本书。', [
    ['We waited for ___ hour.', ['a', 'an', 'the an', 'two'], 1, 'hour 的 h 不发音，开头是元音音素，所以用 an hour。', '我们等了一个小时。'],
    ['She works at ___ university in Perth.', ['an', 'two', 'a', 'many'], 2, 'university 开头发音是 /j/，属于辅音音素，所以是 a university。', '她在珀斯的一所大学工作。'],
    ['I bought a book yesterday. ___ book is about space.', ['The', 'A', 'An', 'Any'], 0, '第二句指的是刚提到的同一本书，双方已能确定对象，因此用 The。', '我昨天买了一本书。这本书讲的是太空。'],
    ['Each student ___ a personal locker.', ['have', 'having', 'are having', 'has'], 3, '主语是 each student，按单数处理，因此用 has，而不是 have。', '每位学生都有一个个人储物柜。'],
    ['The information in these reports ___ useful.', ['are', 'is', 'have', 'were'], 1, '真正的主语是不可数名词 information，不是介词短语里的 reports，因此用 is。', '这些报告中的信息很有用。'],
  ]),
  topic('connector', '连接与逻辑', '原因、让步、对比与结果', [
    'because 后接完整句子；because of 后接名词或 -ing。',
    'although 后接句子；despite 后接名词或 -ing，不能直接写 despite + 主语 + 谓语。',
    'so + 形容词 + that；such + (a/an) + 形容词 + 名词 + that。',
  ], 'Although it rained, we went out. 尽管下雨，我们还是出门了。', [
    ['We stayed indoors ___ it was raining.', ['because of', 'despite', 'because', 'due to'], 2, 'it was raining 是完整句子，要用 because。because of 和 due to 后不能直接接这个句子。', '因为下雨，我们待在室内。'],
    ['The match was cancelled ___ the heavy rain.', ['because of', 'because', 'although', 'even though'], 0, 'the heavy rain 是名词短语，用 because of。because 后通常要有主语和谓语。', '比赛因大雨取消了。'],
    ['___ she was tired, she finished the report.', ['Despite', 'Because of', 'In spite of', 'Although'], 3, 'she was tired 是句子，且与“完成报告”形成让步关系，用 Although。', '虽然她很累，她还是完成了报告。'],
    ['___ feeling nervous, he gave a clear presentation.', ['Although', 'Despite', 'Even though', 'Because of he'], 1, 'feeling nervous 是 -ing 短语，不是带主语的完整句子，因此用 Despite 表示“尽管”。', '尽管紧张，他的展示还是很清楚。'],
    ['It was ___ a useful explanation that I finally understood the rule.', ['so', 'very', 'such', 'too'], 2, '空格后是 a useful explanation 这个名词短语，结构为 such a ... that；so 通常直接修饰形容词。', '这个解释如此有用，我终于理解了这条规则。'],
  ]),
]

export const grammarQuestions = grammarTopics.flatMap((item) => item.questions)
