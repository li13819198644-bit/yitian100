import type { Question, Skill, IssueType } from './types'

export const categories = { grammar: '语法', vocabulary: '词汇', logic: '逻辑', writing: '写作' }
export const issueLabels = { grammar: '语法错误', vocabulary: '词汇错误', naturalness: '表达自然度', meaning: '语义准确性' }
export const skills: Skill[] = [
  { id: 'passive', title: '情态动词与被动语态', category: 'grammar', priority: 3, initial: '复杂句中容易遗漏 be', explanation: '情态动词 + be + 过去分词：may be replaced。现在完成时被动：have/has been used。增加从句不会改变这个结构。' },
  { id: 'count', title: 'work / staff / production', category: 'grammar', priority: 3, initial: '不可数名词与集合名词需重点复习', explanation: 'work 表示工作量时不可数；task 可数。staff 表示员工整体，英式英语中可接单数或复数谓语；数人数宜用 employees / staff members。production 是生产过程，products 是产品。works 也有作品、工厂等其他含义，不能一概判错。' },
  { id: 'forms', title: '词性与动词形式', category: 'vocabulary', priority: 3, initial: '词性和搭配不稳定', explanation: 'accurate / convenient 是形容词，accuracy / convenience 是名词。become 后可接形容词。continue to do 和 continue doing 都可能正确。' },
  { id: 'collocation', title: '固定搭配', category: 'vocabulary', priority: 3, initial: 'demand for 初步掌握，其他搭配需加强', explanation: 'demand for + 名词；be based on + 依据；rely on + 依赖对象。介词是搭配的一部分。' },
  { id: 'with', title: 'With + 名词 + V-ing', category: 'grammar', priority: 2, initial: '结构应用尚不稳定', explanation: 'With demand increasing, ... 中 demand 是 increasing 的逻辑主语。与 As demand increases, ... 的完整从句结构不同。' },
  { id: 'articles', title: '冠词与单复数', category: 'grammar', priority: 2, initial: '冠词及复数形式需要巩固', explanation: '单数可数名词通常需要限定词；a/an 看后面词的读音，不看首字母。泛指复数名词或不可数名词常用零冠词；the 通常指可识别的特定对象。' },
  { id: 'agreement', title: '主谓一致', category: 'grammar', priority: 2, initial: '句子变长后需检查主语', explanation: '谓语与主语的数一致，不与距离最近的名词机械一致。情态动词后用动词原形。' },
  { id: 'distinction', title: '近义词辨析', category: 'vocabulary', priority: 2, initial: '词义相近但使用场景不同', explanation: 'technology 偏技术系统或应用，technique 偏具体方法。continuously 强调连续不中断，continually 常强调反复发生；具体语境中用法可能重叠。' },
  { id: 'clauses', title: 'As / while 与复杂句', category: 'grammar', priority: 1, initial: '已初步掌握，仍需跨天检查', explanation: 'As 后接完整从句。while doing 的省略主语通常必须与主句主语一致。定语从句修饰名词；although 表示让步，because 表示原因。' },
  { id: 'logic', title: '因果机制与例证', category: 'logic', priority: 3, initial: '技术描述缺少完整因果链', explanation: '观点 → 原因 → 机制 → 例子 → 结果。机制要说明变化如何发生，而不只是重复“更有效”。例子可以是假设情境，但不能编造研究数据作为事实。' },
  { id: 'writing', title: '段落与 Task 2', category: 'writing', priority: 2, initial: '待收集独立写作样本', explanation: '主体段落练习目标 60–100 词；Task 2 至少 250 词。单句或段落表现不是完整 IELTS Writing 分数。' },
]

type Seed = [string, string, string[], number, string, string, string, string]
// Each skill has one recognition item and two unseen production contexts.
const seeds: Seed[] = [
  ['passive', 'As automation expands, some jobs may ___ by machines.', ['replaced', 'be replaced', 'be replacing'], 1, '随着技术进步，一些工作可能被机器取代。', 'As technology advances, some jobs may be replaced by machines.', '这些工具已经被工程师使用多年。', 'These tools have been used by engineers for years.'],
  ['count', 'The manager assigned three ___ to each employee.', ['works', 'tasks', 'work'], 1, '这些员工每天完成许多任务。', 'These employees complete many tasks every day.', '这家工厂增加了生产，但没有推出新产品。', 'The factory increased production but did not introduce new products.'],
  ['forms', 'The new system has improved the ___ of measurements.', ['accurate', 'accuracy', 'accurately'], 1, '这个系统变得更加准确。', 'The system has become more accurate.', '网上购物为消费者提供了便利。', 'Online shopping offers convenience to consumers.'],
  ['collocation', 'The company relies ___ accurate data.', ['for', 'on', 'at'], 1, '这项决定基于可靠的数据。', 'This decision is based on reliable data.', '对电动汽车的需求正在增长。', 'Demand for electric cars is growing.'],
  ['with', '___ costs rising, small firms need to save money.', ['With', 'As', 'Because'], 0, '随着成本上升，企业需要减少浪费。（使用 With）', 'With costs rising, companies need to reduce waste.', '随着需求增加，工厂正在雇用更多工人。（使用 With）', 'With demand increasing, factories are hiring more workers.'],
  ['articles', 'She works as ___ engineer.', ['a', 'an', 'the'], 1, '一名工程师开发了一个新系统。', 'An engineer developed a new system.', '教育对社会很重要。（泛指教育）', 'Education is important to society.'],
  ['agreement', 'The use of automated tools ___ productivity.', ['improve', 'improves', 'improving'], 1, '使用机器人提高了安全性。（用现在时）', 'The use of robots improves safety.', '这些机器可以减少浪费。', 'These machines can reduce waste.'],
  ['distinction', 'The machine runs 24 hours a day without stopping. It operates ___.', ['continually', 'continuously', 'occasional'], 1, '这项技术可以帮助医生诊断疾病。', 'This technology can help doctors diagnose diseases.', '这位艺术家使用一种新的绘画技法。', 'The artist uses a new painting technique.'],
  ['clauses', 'Choose the sentence without a dangling modifier.', ['While using the tool, errors were reduced.', 'While using the tool, workers made fewer errors.', 'While use the tool, workers made fewer errors.'], 1, '尽管自动化成本很高，它仍可以提高安全性。', 'Although automation is expensive, it can improve safety.', '工人们在使用新工具时节省了时间。', 'While using the new tools, workers saved time.'],
  ['logic', 'Which sentence explains a mechanism, rather than repeating a benefit?', ['Automation is useful because it is beneficial.', 'Sensors detect defects early, allowing workers to remove faulty items before packaging.', 'Technology is very modern and important.'], 1, '传感器能及早发现缺陷，因此工人可以在包装前移除有问题的产品。', 'Sensors can detect defects early, so workers can remove faulty products before packaging.', '自动检查减少了错误，这使工人能够花更多时间处理复杂任务。', 'Automatic checks reduce errors, which allows workers to spend more time on complex tasks.'],
]

const traps: Record<string, NonNullable<Question['traps']>> = {
  passive: [{ pattern: '\\b(?:may|can|could|might|should)\\s+(?:replaced|used)\\b', type: 'grammar', message: '此处是被动：情态动词后补 be，再接过去分词。' }, { pattern: '\\b(?:have|has)\\s+used\\s+by\\b', type: 'grammar', message: '此处需要完成时被动 have/has been used by。' }],
  count: [{ pattern: '\\b(?:many|three|several)\\s+works\\b', type: 'vocabulary', message: '本题说的是任务，不是艺术作品或工厂；请用 tasks。' }],
  forms: [{ pattern: '\\bbecome\\s+(?:more\\s+)?accuracy\\b', type: 'grammar', message: 'become 后描述状态用形容词 accurate，不用名词 accuracy。' }, { pattern: '\\boffers?\\s+convenient\\b', type: 'vocabulary', message: 'offer 后此处需要名词 convenience。' }],
  collocation: [{ pattern: '\\bbased\\s+(?:in|at|for)\\b', type: 'vocabulary', message: '“以数据为依据”用 be based on。' }, { pattern: '\\bdemand\\s+(?:of|on)\\s+(?:electric|cars)', type: 'vocabulary', message: '本题“对汽车的需求”用 demand for。' }],
  with: [{ pattern: '^with\\s+(?:costs|demand)\\s+(?:rises|increases)\\b', type: 'grammar', message: 'With 不是引导完整从句的连词；这里用 costs rising / demand increasing。' }],
  articles: [{ pattern: '\\ba\\s+engineer\\b', type: 'grammar', message: 'engineer 以元音音素开头，前面用 an。' }],
  agreement: [{ pattern: '\\bmachines\\s+can\\s+reduces\\b', type: 'grammar', message: 'can 后接动词原形 reduce。' }, { pattern: '\\buse of robots improve\\b', type: 'grammar', message: '主语中心词 use 是单数，这里用 improves。' }],
}

export const questions: Question[] = seeds.flatMap(([skillId, prompt, options, correct, p1, a1, p2, a2]) => {
  const skill = skills.find(item => item.id === skillId)!
  const checks: Question['checks'] = [{ type: (skill.category === 'vocabulary' ? 'vocabulary' : 'grammar') as IssueType, label: skill.explanation }, { type: 'meaning', label: '核对人物、动作、时态和因果是否保持原意。' }, { type: 'naturalness', label: '核对搭配与表达是否自然；未匹配的合理改写需人工确认。' }]
  return [
    { id: `${skillId}-choice`, skillId, mode: 'recognition' as const, prompt, options, answer: options[correct], explanation: skill.explanation, checks },
    ...[[p1, a1], [p2, a2]].map(([p, a], i) => ({ id: `${skillId}-write-${i + 1}`, skillId, mode: 'independent' as const, prompt: p, answer: a, explanation: skill.explanation, checks, traps: traps[skillId] })),
  ]
})

const variants: Record<string, string[]> = {
  'passive-write-1': ['As technology progresses, some jobs may be replaced by machines.'],
  'collocation-write-2': ['The demand for electric cars is increasing.', 'Demand for electric cars is increasing.'],
  'clauses-write-1': ['Although automation is costly, it can improve safety.', 'Though automation is expensive, it can improve safety.'],
  'clauses-write-2': ['Workers saved time while using the new tools.'],
}
questions.forEach(question => { question.alternatives = variants[question.id] })

const extra: [string, string, string, string[]?][] = [
  ['clauses', '随着需求增长，公司需要更多员工。（使用 As）', 'As demand grows, companies need more employees.', ['As demand increases, companies need more employees.']],
  ['clauses', '能提供培训的公司更容易留住员工。（使用定语从句）', 'Companies that provide training can retain employees more easily.', ['Companies which provide training can retain employees more easily.']],
  ['clauses', '因为新系统减少了错误，它可以节省时间。', 'Because the new system reduces errors, it can save time.'],
  ['forms', '工程师们继续测试这台机器。（用现在时）', 'The engineers continue to test the machine.', ['The engineers continue testing the machine.']],
  ['count', '我们需要更多员工来完成这项工作。', 'We need more employees to complete this work.', ['We need more staff to complete this work.', 'We need more staff members to complete this work.']],
  ['agreement', '这家公司雇用了两名工程师。（用现在时）', 'The company employs two engineers.'],
  ['passive', '随着需求增长，这些机器可以生产更多产品。（主动语态）', 'As demand grows, these machines can produce more products.'],
  ['collocation', '工程师依赖准确的数据。', 'Engineers rely on accurate data.'],
  ['distinction', '这台机器连续运行，没有停机。', 'The machine runs continuously without stopping.'],
  ['logic', '由于机器人处理危险物料，工人接触有毒化学品的机会更少。', 'Because robots handle hazardous materials, workers have less exposure to toxic chemicals.'],
]
extra.forEach(([skillId, prompt, answer, alternatives], index) => {
  const template = questions.find(question => question.skillId === skillId && question.mode === 'independent')!
  questions.push({ ...template, id: `${skillId}-transfer-${index}`, prompt, answer, alternatives, difficulty: 2, traps: [] })
})

export const writingPrompts = {
  paragraph: '写一个 60–100 词的主体段落，说明自动化如何提高工作场所的安全性。解释具体机制，并用一个明确的情境例子支持观点。',
  task2: 'Some people believe that advances in technology improve the quality of life, while others think they create more problems than they solve. Discuss both views and give your own opinion. Write at least 250 words.',
}
export const rubric = [
  ['Task Response', '回应题目各部分；立场清楚；主要观点有解释和支持，而非只有结论。'],
  ['Coherence and Cohesion', '信息顺序清晰；段落中心明确；连接与指代帮助读者理解，避免堆砌连接词。'],
  ['Lexical Resource', '用词准确、贴切；注意搭配、词性和拼写，不为高级词牺牲意思。'],
  ['Grammatical Range and Accuracy', '灵活使用简单句和复杂句；检查主谓、冠词、动词形式及标点。'],
]
