import type { PartOfSpeech, WordSense } from '../types'

// Explicitly reviewed for the current study meaning; never inferred from a suffix.
const primaryGroups: Record<PartOfSpeech, string> = {
  verb: `facilitate constrain derive allocate reinforce undergo attribute encompass sustain eliminate assess comply
    anticipate evaluate interpret establish maintain resolve illustrate clarify justify adapt adjust acquire
    retain expand decline emerge indicate imply reveal submit obtain permit prohibit require ensure involve
    affect impact benefit contribute promote generate identify recognize distinguish emphasize recommend suggest
    prefer compare contrast predict estimate measure monitor investigate respond confirm deny approve reject
    achieve pursue encourage discourage enable enhance reduce increase exclude include represent reflect
    transfer transform combine separate organize prioritize focus observe participate collaborate negotiate
    implement operate perform function occur vary range exceed restore preserve replace mitigate validate infer
    synthesize scrutinize formulate leverage align quantify mandate substantiate streamline consolidate
    articulate reconcile refine diversify disclose undermine offset convey elaborate underscore depict capture
    navigate cultivate deviate integrate perceive trigger contradict correlate refute annotate advocate
    alleviate amplify ascertain bolster circumvent contemplate concede deduce delineate deter discern
    disseminate distort endorse eradicate exacerbate exert foster hinder invoke manipulate relinquish render
    rectify suppress transcend uphold entail evoke corroborate rebut repudiate verify accommodate accumulate
    acknowledge administer alter attain authorize commence compensate complement comprise conceive conduct
    confront constitute consult overlook overcome overwhelm overestimate underestimate outweigh outnumber
    outperform mislead misinterpret misunderstand misuse rebuild repay reconsider dismiss dispute disrupt
    exploit expose impose suspend withdraw withstand undertake enforce assign appoint recruit resign waive
    reimburse compromise commit consent reassure intervene incorporate delegate jeopardize speculate`,
  noun: `revenue margin forecast liquidity procurement inventory stakeholder benchmark portfolio roadmap retention
    churn conversion pipeline capacity throughput backlog budget incentive compliance methodology framework
    variable hypothesis bias sample criterion literature citation thesis premise aggregate statute ordinance
    jurisdiction litigation precedent oversight accountability transparency enforcement sanction amendment
    referendum constituency bureaucracy governance protocol provision exemption allegation consensus discrepancy
    dilemma integrity intervention implication controversy deficit doctrine efficacy equity hierarchy
    infrastructure insight momentum nuance paradigm rationale recession scrutiny threshold trajectory adversity
    cohesion credibility outbreak outcome outlook drawback setback breakthrough breakdown deadline milestone
    landmark shortcoming shortage workload workforce ownership partnership leadership craftsmanship hardship
    livelihood likelihood feedback viewpoint standpoint foreground household welfare unemployment disbelief
    disagreement disadvantage misconduct refund discretion obligation entitlement concession acquisition merger
    surplus expenditure overhead turnover liability asset subsidy inflation transaction subscription installment
    mortgage collateral grievance harassment discrimination prejudice accusation suspicion deception fraud
    breach conviction custody autonomy competence empathy intuition assumption exception distinction tendency
    correlation prerequisite contingency paradox coincidence tolerance`,
  adverb: `whereby thereby henceforth beforehand otherwise regardless furthermore moreover nevertheless nonetheless
    overseas`,
  preposition: `throughout`,
  conjunction: `whereas`,
  adjective: `coherent substantial subsequent explicit reluctant inherent viable compelling ambiguous concise robust
    plausible tentative precise notable scalable empirical rigorous preliminary qualitative consistent impartial
    abundant scarce feasible adverse mutual relevant redundant accurate efficient flexible stable dynamic
    dominant complex diverse corporate regulatory strategic operational administrative financial fiscal monetary
    ethical technical digital virtual physical cognitive emotional cultural environmental sustainable renewable
    temporary permanent voluntary mandatory confidential transparent reliable crucial fundamental typical
    exceptional gradual rapid rare severe broad narrow visible capable eligible liable potential apparent
    evident comprehensive specific primary secondary initial overall parallel alternative compatible sufficient
    excessive moderate intense volatile resilient vulnerable practical theoretical abstract concrete rational
    logical neutral internal external adjacent equivalent concurrent persistent subordinate autonomous inclusive
    exclusive consecutive simultaneous prospective retrospective analytical conventional innovative arbitrary
    legitimate abrupt accountable adequate credible deficient detrimental diligent discreet distinctive durable
    elusive eminent fragile futile indispensable inevitable intricate negligible obsolete pervasive prevalent
    profound prone rigid skeptical outdated widespread upcoming ongoing outstanding straightforward worthwhile
    trustworthy thoughtful thorough underlying inland offshore worldwide affordable accessible applicable
    predictable measurable manageable acceptable questionable reasonable remarkable recognizable understandable
    unforgettable irreversible irresponsible irrelevant insufficient inaccurate inconsistent incompatible
    unaware uncertain unwilling unexpected uneven unnecessary awkward subtle sensible sensitive sympathetic
    cynical blunt assertive arrogant authentic genuine deliberate spontaneous habitual outspoken pragmatic
    convincing suspicious tangible intact imminent immense radical lucrative tedious cumbersome affluent
    reputable compulsory`,
}

export const primaryPartsOfSpeech: Readonly<Record<string, PartOfSpeech>> = Object.fromEntries(
  Object.entries(primaryGroups).flatMap(([part, words]) => words.trim().split(/\s+/).map((word) => [word, part as PartOfSpeech])),
)

type SenseRow = [PartOfSpeech, string, string?, string?, string?]
const rows: Array<[string, SenseRow[]]> = [
  ['concrete', [['adjective', '具体的、明确的', 'concrete evidence：明确的证据'], ['noun', '混凝土', 'pour concrete：浇筑混凝土', undefined, '作建筑材料名词时通常不可数。']]],
  ['abstract', [['adjective', '抽象的', 'abstract concept：抽象概念'], ['noun', '摘要', 'an abstract of a paper：论文摘要']]],
  ['permit', [['verb', '允许、准许', 'permit access：允许进入', '/pərˈmɪt/'], ['noun', '许可证', 'a work permit：工作许可证', '/ˈpɜːrmɪt/']]],
  ['refund', [['noun', '退款；退还的款项', 'a full refund：全额退款', '/ˈriːfʌnd/'], ['verb', '退还款项', 'refund the payment：退还付款', '/rɪˈfʌnd/']]],
  ['articulate', [['verb', '清楚表达、明确说明', 'articulate an idea：把想法说清楚', '/ɑːrˈtɪkjəleɪt/'], ['adjective', '善于表达的；表达清楚的', 'an articulate speaker：表达清楚的发言者', '/ɑːrˈtɪkjələt/']]],
  ['moderate', [['adjective', '适度的、中等的', 'moderate risk：中等风险', '/ˈmɑːdərət/'], ['verb', '缓和、调节；主持', 'moderate a discussion：主持讨论', '/ˈmɑːdəreɪt/']]],
  ['deliberate', [['adjective', '故意的；深思熟虑的', 'a deliberate choice：深思熟虑的选择', '/dɪˈlɪbərət/'], ['verb', '仔细考虑、商议', 'deliberate on a proposal：仔细考虑提议', '/dɪˈlɪbəreɪt/']]],
  ['separate', [['verb', '分开、区分', 'separate the tasks：分开各项任务', '/ˈsepəreɪt/'], ['adjective', '分开的、独立的', 'separate rooms：分开的房间', '/ˈsepərət/']]],
  ['elaborate', [['verb', '详述、详细说明', 'elaborate on the idea：详细说明想法', '/ɪˈlæbəreɪt/'], ['adjective', '精心制作的；复杂的', 'an elaborate plan：精心制定的计划', '/ɪˈlæbərət/']]],
  ['advocate', [['verb', '提倡、拥护', 'advocate reform：提倡改革', '/ˈædvəkeɪt/'], ['noun', '倡导者、拥护者', 'an advocate of reform：改革的倡导者', '/ˈædvəkət/']]],
  ['attribute', [['verb', '把……归因于', 'attribute success to effort：把成功归因于努力', '/əˈtrɪbjuːt/'], ['noun', '属性、特质', 'a key attribute：关键特质', '/ˈætrɪbjuːt/']]],
  ['conduct', [['verb', '实施、进行；引导、指挥', 'conduct a study：开展研究', '/kənˈdʌkt/'], ['noun', '行为、举止', 'professional conduct：职业行为', '/ˈkɑːndʌkt/']]],
  ['delegate', [['verb', '委派、授权', 'delegate a task：委派任务', '/ˈdelɪɡeɪt/'], ['noun', '代表', 'a conference delegate：会议代表', '/ˈdelɪɡət/']]],
  ['contrast', [['verb', '对比；形成对照', 'contrast the results：对比结果', '/kənˈtræst/'], ['noun', '对比、差异', 'a sharp contrast：鲜明对比', '/ˈkɑːntræst/']]],
  ['estimate', [['verb', '估计、估算', 'estimate the cost：估算费用', '/ˈestɪmeɪt/'], ['noun', '估计；估价', 'a cost estimate：费用估算', '/ˈestɪmət/']]],
  ['exploit', [['verb', '利用；剥削；利用漏洞', 'exploit a loophole：利用漏洞', '/ɪkˈsplɔɪt/'], ['noun', '壮举、功绩', 'a heroic exploit：英雄壮举', '/ˈeksplɔɪt/']]],
  ['sanction', [['noun', '制裁、处罚；正式批准', 'economic sanctions：经济制裁'], ['verb', '正式批准；对……实施制裁', 'sanction a proposal：正式批准提议', undefined, '批准还是制裁，要结合宾语与语境判断。']]],
  ['mandate', [['verb', '强制要求；授权', 'mandate disclosure：强制要求披露'], ['noun', '授权、正式命令', 'a clear mandate：明确授权']]],
  ['impact', [['noun', '影响、冲击', 'a major impact：重大影响'], ['verb', '影响；冲击', 'impact the results：影响结果']]],
  ['benefit', [['verb', '受益；有益于', 'benefit from practice：从练习中受益'], ['noun', '好处、益处', 'a clear benefit：明显的好处']]],
  ['decline', [['verb', '下降；婉拒', 'decline an invitation：婉拒邀请'], ['noun', '下降、衰退', 'a decline in sales：销量下降']]],
  ['increase', [['verb', '增加、增长', 'increase the price：提高价格', '/ɪnˈkriːs/'], ['noun', '增加、增长', 'an increase in price：价格上涨', '/ˈɪnkriːs/']]],
  ['measure', [['verb', '测量、衡量', 'measure progress：衡量进步'], ['noun', '措施；尺度；量', 'safety measures：安全措施']]],
  ['monitor', [['verb', '监测、监控', 'monitor progress：监测进展'], ['noun', '监视器、显示器；监督员', 'a computer monitor：电脑显示器']]],
  ['focus', [['verb', '集中、聚焦', 'focus on the task：专注任务'], ['noun', '焦点、重点', 'the main focus：主要重点']]],
  ['function', [['noun', '功能；作用', 'a useful function：有用的功能'], ['verb', '运作、起作用', 'function properly：正常运作']]],
  ['range', [['noun', '范围；一系列', 'a wide range：广泛的范围'], ['verb', '在一定范围内变化', 'range from low to high：从低到高不等']]],
  ['transfer', [['verb', '转移、转交、调动', 'transfer data：传输数据'], ['noun', '转移、调动；转账', 'a bank transfer：银行转账']]],
  ['leverage', [['verb', '利用、发挥优势', 'leverage experience：利用经验'], ['noun', '杠杆作用；影响力', 'financial leverage：财务杠杆']]],
  ['offset', [['verb', '抵消、弥补', 'offset the cost：抵消费用'], ['noun', '抵消物；偏移量', 'a carbon offset：碳抵消措施']]],
  ['trigger', [['verb', '触发、引发', 'trigger a reaction：引发反应'], ['noun', '扳机；触发因素', 'a trigger for change：变化的触发因素']]],
  ['forecast', [['noun', '预测、预报', 'a weather forecast：天气预报'], ['verb', '预测、预报', 'forecast demand：预测需求']]],
  ['inventory', [['noun', '库存；存货清单', 'an inventory list：库存清单'], ['verb', '清点、列清单', 'inventory the equipment：清点设备']]],
  ['benchmark', [['noun', '基准、参照标准', 'an industry benchmark：行业基准'], ['verb', '以基准衡量、比较', 'benchmark performance：对照基准比较表现']]],
  ['churn', [['noun', '客户流失；大量变动', 'customer churn：客户流失'], ['verb', '搅动；使剧烈翻腾', 'churn butter：搅制黄油']]],
  ['budget', [['noun', '预算', 'an annual budget：年度预算'], ['verb', '编制预算', 'budget for repairs：为维修安排预算']]],
  ['variable', [['noun', '变量', 'a key variable：关键变量'], ['adjective', '可变的、多变的', 'variable costs：变动成本']]],
  ['bias', [['noun', '偏见；偏差', 'selection bias：选择偏差'], ['verb', '使有偏向、使产生偏差', 'bias the results：使结果产生偏差']]],
  ['sample', [['noun', '样本、样品', 'a small sample：小样本'], ['verb', '取样；尝试', 'sample the water：对水取样']]],
  ['premise', [['noun', '前提', 'a basic premise：基本前提'], ['verb', '以……为前提', 'premise an argument on evidence：以证据为论证前提']]],
  ['aggregate', [['adjective', '总计的、合计的', 'aggregate demand：总需求', '/ˈæɡrɪɡət/'], ['noun', '总数、合计', 'in the aggregate：总体而言', '/ˈæɡrɪɡət/'], ['verb', '汇总、合计', 'aggregate the data：汇总数据', '/ˈæɡrɪɡeɪt/']]],
  ['provision', [['noun', '条款；提供、供应', 'a legal provision：法律条款'], ['verb', '向……供应必需品', 'provision a ship：为船供应物资']]],
  ['alternative', [['adjective', '替代的、可供选择的', 'an alternative route：另一条可选路线'], ['noun', '替代方案、选择', 'a better alternative：更好的替代方案']]],
  ['potential', [['adjective', '潜在的、可能的', 'potential risk：潜在风险'], ['noun', '潜力；可能性', 'great potential：巨大潜力']]],
  ['equivalent', [['adjective', '等同的、等值的', 'equivalent value：等值'], ['noun', '等同物；对应物', 'the English equivalent：对应的英语表达']]],
  ['parallel', [['adjective', '平行的；同时进行的', 'parallel lines：平行线'], ['noun', '相似之处；平行线', 'a close parallel：很相似的情况'], ['verb', '与……相似；与……平行', 'parallel earlier findings：与早先发现相似']]],
  ['subordinate', [['adjective', '下级的、次要的', 'a subordinate role：次要角色', '/səˈbɔːrdɪnət/'], ['noun', '下属、部属', 'a subordinate：一名下属', '/səˈbɔːrdɪnət/'], ['verb', '使服从、使处于次要地位', 'subordinate personal interests：把个人利益置于次要地位', '/səˈbɔːrdɪneɪt/']]],
  ['complement', [['verb', '补充、与……相辅相成', 'complement each other：相辅相成'], ['noun', '补充物；补语', 'a perfect complement：恰当的补充']]],
  ['dispute', [['noun', '争议、争执', 'a pay dispute：工资争议'], ['verb', '质疑、对……提出异议', 'dispute a claim：质疑一个说法']]],
  ['recruit', [['verb', '招募、招聘', 'recruit staff：招聘员工'], ['noun', '新成员、新兵', 'a new recruit：一名新成员']]],
  ['compromise', [['noun', '妥协、折中方案', 'reach a compromise：达成妥协'], ['verb', '妥协；损害、危及', 'compromise safety：危及安全']]],
  ['consent', [['noun', '同意、许可', 'give consent：给予许可'], ['verb', '同意、准许', 'consent to treatment：同意接受治疗']]],
  ['surplus', [['noun', '盈余、过剩', 'a budget surplus：预算盈余'], ['adjective', '多余的、过剩的', 'surplus stock：过剩库存']]],
  ['overhead', [['noun', '经营间接费用', 'reduce overheads：减少经营间接费用'], ['adjective', '头顶上方的', 'overhead wires：架空电线'], ['adverb', '在头顶上方', 'fly overhead：从头顶飞过']]],
  ['collateral', [['noun', '抵押品、担保品', 'provide collateral：提供抵押品'], ['adjective', '附带的、间接的', 'collateral damage：附带损害']]],
  ['prejudice', [['noun', '偏见；损害', 'racial prejudice：种族偏见'], ['verb', '使产生偏见；损害', 'prejudice a fair trial：妨碍公正审判']]],
  ['breach', [['noun', '违反、违约；缺口', 'a breach of contract：违约'], ['verb', '违反；突破', 'breach the contract：违反合同']]],
  ['mortgage', [['noun', '抵押贷款、房贷', 'a mortgage loan：抵押贷款'], ['verb', '抵押', 'mortgage a house：抵押房屋']]],
  ['stable', [['adjective', '稳定的、稳固的', 'stable prices：稳定的价格'], ['noun', '马厩', 'a horse stable：马厩']]],
  ['complex', [['adjective', '复杂的、复合的', 'a complex problem：复杂问题'], ['noun', '建筑群；情结', 'a shopping complex：综合购物建筑群']]],
  ['radical', [['adjective', '根本性的；激进的', 'a radical change：根本性改变'], ['noun', '激进分子；根式；自由基', 'a free radical：自由基']]],
  ['overall', [['adjective', '总体的、整体的', 'overall performance：整体表现'], ['adverb', '总体上、总的来说', 'improve overall：总体上改善']]],
  ['overseas', [['adverb', '在海外、往海外', 'work overseas：在海外工作'], ['adjective', '海外的', 'overseas markets：海外市场']]],
  ['inland', [['adjective', '内陆的', 'inland areas：内陆地区'], ['adverb', '向内陆、在内陆', 'travel inland：向内陆旅行']]],
  ['offshore', [['adjective', '近海的、离岸的', 'offshore wind：海上风电'], ['adverb', '离岸、在近海', 'move offshore：迁往离岸地区']]],
  ['worldwide', [['adjective', '遍及全球的', 'worldwide service：全球服务'], ['adverb', '在全世界', 'operate worldwide：在全球运营']]],
  ['throughout', [['preposition', '遍及；贯穿整个时期', 'throughout the year：全年'], ['adverb', '到处；自始至终', 'remain calm throughout：自始至终保持冷静']]],
  ['household', [['noun', '一家人；家庭、住户', 'household expenses：家庭开支'], ['adjective', '家庭的、家用的', 'household goods：家用物品']]],
]

// Common study senses, not an exhaustive dictionary of every technical usage.
export const reviewedWordSenses: Readonly<Record<string, WordSense[]>> = Object.fromEntries(
  rows.map(([word, senses]) => [word, senses.map(([partOfSpeech, meaning, collocation, phonetic, note]) => ({
    partOfSpeech, meaning, ...(collocation ? { collocation } : {}), ...(phonetic ? { phonetic } : {}), ...(note ? { note } : {}),
  }))]),
)
