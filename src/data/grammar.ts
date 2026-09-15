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

const foundationGrammarTopics: GrammarTopic[] = [
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

export const advancedGrammarTopics: GrammarTopic[] = [
  topic('reported-speech', '间接引语', '转述别人说的话和提出的问题', [
    'say 后可直接接说的话；tell 通常先接人：She told me that ...。',
    '过去转述时，时态常向过去移动；内容仍然成立时不一定后移。',
    '转述问题用陈述语序：asked where I lived，不是 where did I live。请求可用 ask someone to do。',
  ], 'He asked me where I worked. 他问我在哪里工作。', [
    ['Maya ___ me that the meeting had been cancelled.', ['said', 'told', 'spoke', 'talked'], 1, '空格后直接跟人 me，再跟 that 从句，符合 told me that。say 若接人，需要说 said to me。', '玛雅告诉我，会议已经取消了。'],
    ['The receptionist asked where ___.', ['did I live', 'do I live', 'I lived', 'was I live'], 2, '间接疑问句用陈述语序：主语 I 在动词 lived 前。不要保留直接问句的 did I live。', '接待员问我住在哪里。'],
    ['He asked me ___ I had received the email.', ['whether', 'what', 'which', 'that'], 0, '这是转述一个“是否收到”的一般疑问句，用 whether 或 if。其余选项不能表达这里的是否。', '他问我是否收到了邮件。'],
    ['The guide asked us ___ near the entrance.', ['waiting', 'waited', 'wait', 'to wait'], 3, '请求某人做事用 ask someone to do。us 是被请求的人，后面接 to wait。', '导游让我们在入口附近等候。'],
    ['In her message yesterday, Anna said that she ___ call me the following day.', ['will to', 'would', 'was', 'had'], 1, '这里转述过去说的将来安排，will 常后移为 would；would 后直接接 call。was call 和 had call 都不成立。', '安娜在昨天的留言里说，她会在第二天给我打电话。'],
  ]),
  topic('past-modals', '过去推测与遗憾', '可能做过、本该做、没必要做', [
    '情态动词 + have + 过去分词，用来讨论过去：might have left 表示可能已经离开。',
    'should have done 常表示本来应该做；should not have done 表示做了不该做的事。',
    'need not have done 表示做了但没必要；cannot have done 表示推测过去不可能发生。',
  ], 'I should have checked the address. 我本该核对地址的。', [
    ['I forgot to save the file. I should ___ a backup.', ['make', 'made', 'have made', 'had made'], 2, '后悔过去没有备份，用 should have made。情态动词后这里用 have，不用 had。', '我忘了保存文件。我本该做个备份的。'],
    ['I sent the private message to the whole team by mistake. I ___ done that.', ['should not have', 'must have', 'need to have', 'should'], 0, '信息确实发出去了，但不该这样做，所以用 should not have done，表达对已发生行为的遗憾。', '我误把私人消息发给了整个团队。我本不该那样做。'],
    ['We bought tickets, then discovered entry was free. We ___ bought them.', ['must have', 'should have', 'cannot have', 'need not have'], 3, '已经买票，但其实免费，因此是“做了却没必要”，用 need not have bought。', '我们买了票才发现可以免费入场。其实没必要买票。'],
    ['I am not sure where my keys are. I might ___ them at the office.', ['left', 'have left', 'has left', 'leaving'], 1, '对过去的可能情况作推测，用 might have left。might 后不能用 has，left 也不能直接接在 might 后。', '我不确定钥匙在哪儿，可能把它们落在办公室了。'],
    ['That cannot have been Sam at the meeting: he ___ abroad at the time.', ['is', 'has', 'was', 'will'], 2, 'at the time 指开会时那个过去时间点，用 was abroad。cannot have been 表示根据证据判断当时不可能是他。', '会上那个人不可能是萨姆，因为他当时在国外。'],
  ]),
  topic('habit-change', '过去习惯与适应', 'used to、be used to、get used to', [
    'used to + 动词原形：过去常做或过去处于某状态，现在已不同。',
    'be used to + 名词或 -ing：已经习惯；get used to 强调逐渐适应。这里的 to 是介词。',
    '过去习惯的疑问句通常用 Did ... use to ...?，did 后 use 不加 d。',
  ], 'I used to drive. Now I am used to walking. 我以前常开车，现在习惯步行了。', [
    ['I ___ live near the sea, but now I live inland.', ['am used to', 'used to', 'get used to', 'use'], 1, '前后对比过去和现在的居住状态，选 used to live。am used to 后不能接原形 live。', '我以前住在海边，现在住在内陆。'],
    ['I work night shifts, so I am used to ___ during the day.', ['sleep', 'slept', 'sleeping', 'have slept'], 2, 'am used to 表示已经习惯，to 是介词，后接 sleeping，不是原形 sleep。', '我上夜班，所以习惯白天睡觉。'],
    ['It took me a month to get used to ___ on the left.', ['driving', 'drive', 'drove', 'be drive'], 0, 'get used to 表示适应的过程，后接名词或 -ing，所以用 driving。', '我花了一个月才适应靠左行驶。'],
    ['Did you ___ play the piano when you were a child?', ['used to', 'are used to', 'using to', 'use to'], 3, '已经有助动词 Did，后面的 use 用原形。这里问的是小时候是否有某个习惯。', '你小时候常弹钢琴吗？'],
    ['The noise no longer bothers me. I ___ used to it now.', ['did', 'am', 'have', 'do'], 1, 'no longer bothers me 表示已经适应，现在的状态用 am used to it。it 在这里是介词 to 的宾语。', '噪声不再困扰我。我现在已经习惯了。'],
  ]),
  topic('comparison', '比较与程度', '更好、一样好、太多和足够', [
    '比较级可以用 much、far、a little 修饰；通常不说 very better。',
    '同等比较用 as + 原级 + as；the + 比较级，the + 比较级表示越…越…。',
    'too + 形容词 + to do 表示太…而不能；形容词 + enough + to do 表示足够…能做。',
  ], 'This route is much shorter. 这条路线短得多。', [
    ['The new battery lasts ___ longer than the old one.', ['very', 'many', 'much', 'most'], 2, 'longer 是比较级，用 much 表示“长得多”。very 通常修饰原级，不能直接放在 longer 前。', '新电池的续航时间比旧电池长得多。'],
    ['This task is not as difficult ___ I expected.', ['as', 'than', 'that', 'so'], 0, 'as ... as 是固定比较结构，否定形式 not as ... as 表示不如预想的那么…。', '这项任务没有我预想的那么难。'],
    ['The more carefully you check, ___ mistakes you will miss.', ['fewer', 'the fewest', 'few', 'the fewer'], 3, '“越…越…”两边都用 the 加比较级；mistakes 是可数复数，因此用 the fewer。', '你检查得越仔细，漏掉的错误就越少。'],
    ['The box is too heavy ___ on my own.', ['lift', 'to lift', 'lifting', 'lifted'], 1, 'too heavy to lift 表示重得无法搬动。too + 形容词后用不定式表达无法完成的动作。', '箱子太重，我一个人搬不动。'],
    ['The instructions are clear ___ for a beginner to follow.', ['too', 'very', 'enough', 'many'], 2, 'enough 修饰形容词时放在后面：clear enough。这里表示清楚到初学者也能照着做。', '说明足够清楚，初学者也能照着操作。'],
  ]),
  topic('quantifiers', '数量词与名词', 'few、little、each 与 a number of', [
    'few/a few 修饰可数复数；little/a little 修饰不可数名词。带 a 通常表示还有一些，不带 a 强调很少。',
    'each、every 后通常接单数名词；much 修饰不可数名词，many 修饰可数复数。',
    'a number of + 复数名词作主语，谓语用复数；the number of ... 强调数量本身，谓语用单数。',
  ], 'There is a little time left. 还剩一点时间。', [
    ['We have ___ time left, so please be quick.', ['few', 'little', 'many', 'a few'], 1, 'time 表示时间时不可数，且后句催促快点，选强调剩余很少的 little。few 和 many 用于可数名词。', '我们没剩多少时间了，请快一点。'],
    ['There are ___ chairs by the door; please take one.', ['a little', 'much', 'a few', 'little'], 2, 'chairs 是可数复数，且确实有一些可以拿，用 a few。a little 用于不可数名词。', '门边有几把椅子，请拿一把。'],
    ['Every ___ must show an identity card.', ['visitor', 'visitors', 'people', 'guests'], 0, 'every 后直接接单数可数名词，所以选 visitor；visitors、people 和 guests 都是复数形式。', '每位访客都必须出示身份证件。'],
    ['A number of students ___ waiting outside.', ['is', 'was', 'has', 'are'], 3, 'a number of students 表示若干学生，主语按复数处理，因此用 are waiting。', '有一些学生正在外面等候。'],
    ['The number of applicants ___ increased this year.', ['have', 'has', 'are', 'were'], 1, '主语中心是单数 the number，讨论申请者的数量，用 has increased；不要受复数 applicants 干扰。', '今年申请者的数量增加了。'],
  ]),
  topic('wishes', '愿望与遗憾', 'wish、if only 与 would rather', [
    'wish/if only + 过去式可表示与现在事实不同的愿望；表示对过去的遗憾用 had + 过去分词。',
    'wish + could 表示希望具有目前没有的能力；不是所有愿望都要用 would。',
    'would rather + 动词原形表示宁愿；would rather + 主语 + 过去式可表达希望对方现在或将来怎样做。',
  ], 'I wish I had more time. 我希望现在有更多时间。', [
    ['I cannot swim. I wish I ___ swim.', ['can', 'will', 'could', 'have'], 2, '现在不会游泳，希望自己有这种能力，选 could。这里过去形式表达非现实愿望，不表示过去时间。', '我不会游泳。我真希望自己会。'],
    ['I forgot the appointment yesterday. I wish I ___ written it down.', ['had', 'have', 'will have', 'would'], 0, '对昨天已发生的事感到遗憾，用 wish + had + 过去分词，因此填 had。', '我昨天忘了预约。我真希望当时把它记下来了。'],
    ['I am busy right now. If only I ___ more free time!', ['have', 'will have', 'having', 'had'], 3, '现在很忙，希望现在有更多时间，用 If only I had。这里 had 与现在事实相反，不是过去完成时。', '我现在很忙。要是有更多空闲时间就好了！'],
    ['I would rather ___ at home tonight.', ['staying', 'stay', 'to stay', 'stayed'], 1, 'would rather 后直接接动词原形 stay，不加 to，也不用 -ing。', '今晚我宁愿待在家里。'],
    ['I would rather you ___ me before making a decision next time.', ['asks', 'asking', 'asked', 'to ask'], 2, '这里用过去式 asked 表达希望对方下次怎样做；next time 明确指将来。you 不能搭配 asks，asking 和 to ask 也不能独立作这个从句的谓语。', '我希望你下次作决定前先问问我。'],
  ]),
  topic('inversion', '倒装与强调', '否定词放句首时的语序', [
    'never、rarely、not until 等否定或限制成分放句首时，主句常把助动词放在主语前。',
    '普通过去时若没有助动词，可借 did，并把主要动词还原；不是整句话所有从句都倒装。',
    'only after 后接的从句保持正常语序，倒装发生在后面的主句。no sooner 常与 than 搭配。',
  ], 'Never have I seen such a view. 我从未见过这样的景色。', [
    ['Never ___ such a quiet city.', ['I have visited', 'have I visited', 'I visited have', 'have visited I'], 1, 'Never 放句首触发倒装，将助动词 have 放到主语 I 前，visited 仍在主语后。', '我从未到过这么安静的城市。'],
    ['Only after I read the instructions ___ how the device worked.', ['I understood', 'understood I', 'did I understand', 'I did understood'], 2, 'only after 引出的从句 I read ... 不倒装；主句用 did I understand，did 后 understand 用原形。', '读完说明后，我才明白设备是怎么工作的。'],
    ['Not until the rain stopped ___ the building.', ['did we leave', 'we left', 'left we', 'we did left'], 0, 'Not until ... 放句首，后面的主句要倒装。普通过去时借 did，leave 还原。', '直到雨停了，我们才离开大楼。'],
    ['No sooner had I sat down ___ the phone rang.', ['when', 'then', 'that', 'than'], 3, 'No sooner ... than ... 表示刚…就…。这里已有 had I sat down 的倒装，后面连接词用 than。', '我刚坐下，电话就响了。'],
    ['Rarely ___ such detailed feedback these days.', ['we receive', 'do we receive', 'receive we', 'we do receives'], 1, 'Rarely 放句首触发倒装；一般现在时复数主语 we 借 do，形成 do we receive。', '如今我们很少收到如此详细的反馈。'],
  ]),
  topic('participles', '分词与省略', '主动、被动与先后关系', [
    '现在分词 -ing 常表达主动关系；过去分词常表达被动关系，不能只根据中文的“了”来选。',
    '分词状语的逻辑主语通常要与主句主语一致，避免出现“走路的是报告”这类悬垂结构。',
    'having + 过去分词强调动作先于主句完成；名词后的分词短语可缩减定语从句。',
  ], 'Written in plain English, the guide is easy to follow. 指南用浅白英语写成，很容易读懂。', [
    ['___ from recycled paper, these notebooks are environmentally friendly.', ['Making', 'Make', 'Made', 'To making'], 2, '笔记本是被制成的，与 make 是被动关系，选过去分词 Made。Making 会把笔记本当成制造者。', '这些笔记本用再生纸制成，很环保。'],
    ['The woman ___ by the window is our new manager.', ['standing', 'stood', 'stands', 'is standing'], 0, 'woman 主动站在窗边，standing 短语修饰 woman，相当于 who is standing。直接填 is standing 会造成两个没有连接的谓语。', '站在窗边的女士是我们的新经理。'],
    ['The report ___ yesterday contains several useful charts.', ['publishing', 'publishes', 'was publishing', 'published'], 3, 'report 与 publish 是被动关系，published yesterday 相当于 that was published yesterday，修饰报告。', '昨天发表的报告包含几张有用的图表。'],
    ['Having ___ the application, she checked every answer before submitting it.', ['complete', 'completed', 'completing', 'completes'], 1, 'Having 后接过去分词 completed，表示先填完申请，再检查答案。两个动作的执行者都是 she。', '填完申请后，她在提交前检查了每个答案。'],
    ['Walking home, ___ noticed a new café.', ['a new café', 'the street', 'I', 'the weather'], 2, 'Walking home 的逻辑主语应是主句中走路的人。I 既能走路也能 noticed，避免让街道或天气成为走路者。', '走路回家时，我发现了一家新咖啡馆。'],
  ]),
]

export const grammarTopics = [...foundationGrammarTopics, ...advancedGrammarTopics]

export const grammarQuestions = grammarTopics.flatMap((item) => item.questions)
