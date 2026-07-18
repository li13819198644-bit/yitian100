import type { VocabWord } from '../types'
import { antigravityHooks } from './antigravityHooks'
import { wordOrigins } from './wordOrigins'

const specialHooks: Record<string, NonNullable<VocabWord['memoryHook']>> = {
  facilitate: {
    core: '不是“促进”这么空，是“让别人做起来更容易”。',
    image: '你把复杂流程改成三步，别人立刻能开始做。',
    breakdown: '别和 promote 混：promote 偏推动发展，facilitate 偏降低阻力。',
    cue: 'facilitate communication / learning / growth',
    personalPrompt: '造句：A good app facilitates ___.',
  },
  constrain: {
    core: '外部条件把选择变少。',
    image: '预算只有 100 块，本来想买 5 样东西，现在只能买 1 样。',
    breakdown: '别只记“限制”。constrain 常指预算、规则、时间让你没法自由做。',
    cue: 'constrain growth / choices / budget',
    personalPrompt: '造句：Limited time constrains my ___.',
  },
  derive: {
    core: '从某个来源得到。',
    image: '你从一本书里提取出一个观点，那个观点是从书里来的。',
    breakdown: '别和 receive 混：receive 是收到，derive 强调“来源”。',
    cue: 'derive value / meaning / benefit from',
    personalPrompt: '造句：I derive value from ___.',
  },
  coherent: {
    core: '每句话都接得上，整体说得通。',
    image: '一篇文章从原因到结果一路顺下来，你不用倒回去猜作者想说什么。',
    breakdown: '别只记“连贯”。coherent 常形容 argument / explanation / plan。',
    cue: 'coherent argument / explanation / plan',
    personalPrompt: '造句：This explanation is coherent because ___.',
  },
  substantial: {
    core: '数量或影响够大，不是小打小闹。',
    image: '不是加 1 分，而是成绩明显提高一截。',
    breakdown: '别和 important 完全等同：substantial 更强调“分量足”。',
    cue: 'substantial evidence / increase / progress',
    personalPrompt: '造句：I made substantial progress in ___.',
  },
  subsequent: {
    core: '某事之后发生的。',
    image: '先发布版本，后面的修复、更新、反馈都叫 subsequent changes。',
    breakdown: '别和 following 混得太松：subsequent 更正式，强调时间顺序。',
    cue: 'subsequent changes / events / studies',
    personalPrompt: '造句：Subsequent changes made ___ better.',
  },
  allocate: {
    core: '把有限资源分给不同地方。',
    image: '一天只有 3 小时学习，你决定英语 1 小时、健身 1 小时、工作 1 小时。',
    breakdown: '别只记“分配”。allocate 常跟 time / money / resources。',
    cue: 'allocate time / money / resources',
    personalPrompt: '造句：I allocate ___ minutes to English.',
  },
  reinforce: {
    core: '把已经有的东西再加固。',
    image: '学过一个词，第二天再用一次，记忆像螺丝被拧紧。',
    breakdown: '不是第一次学习，是让原来的印象更强。',
    cue: 'reinforce memory / learning / belief',
    personalPrompt: '造句：Reviewing examples reinforces ___.',
  },
  undergo: {
    core: '经历一个过程，通常有点正式或不轻松。',
    image: '病人 undergo treatment；员工 undergo training。',
    breakdown: '别和 experience 随便替换：undergo 常接 treatment / training / change。',
    cue: 'undergo training / treatment / change',
    personalPrompt: '造句：I underwent ___ when I started ___.',
  },
  attribute: {
    core: '把原因归到某件事上。',
    image: '成绩提高了，你说原因是每天复习，而不是运气。',
    breakdown: '常用结构：attribute A to B，把 A 归因于 B。',
    cue: 'attribute success to effort',
    personalPrompt: '造句：I attribute my progress to ___.',
  },
  encompass: {
    core: '范围大到把很多东西都包括进去。',
    image: '一个课程不只教单词，还包括听力、阅读、写作。',
    breakdown: '比 include 更正式、更有“覆盖范围”的感觉。',
    cue: 'encompass areas / topics / skills',
    personalPrompt: '造句：English learning encompasses ___.',
  },
  sustain: {
    core: '让某种状态继续下去。',
    image: '不是冲刺一天，而是把每天学习维持三个月。',
    breakdown: '别只记“支持”。sustain progress / momentum 强调持续。',
    cue: 'sustain progress / growth / effort',
    personalPrompt: '造句：To sustain progress, I need ___.',
  },
  eliminate: {
    core: '彻底拿掉，不只是减少。',
    image: '错题本不是让错误少一点，而是把某类错误清零。',
    breakdown: 'reduce 是减少，eliminate 是消除。',
    cue: 'eliminate errors / risk / waste',
    personalPrompt: '造句：I want to eliminate ___ from my routine.',
  },
  assess: {
    core: '看清情况后做判断。',
    image: '医生先检查，再判断严重不严重。',
    breakdown: '比 think 更正式；assess 常指评估风险、水平、影响。',
    cue: 'assess risk / level / impact',
    personalPrompt: '造句：I need to assess my ___.',
  },
  comply: {
    core: '按规则做，不一定是自愿喜欢。',
    image: '公司要求填表，你照做，因为规则就是这样。',
    breakdown: '常用结构：comply with rules / law / requirements。',
    cue: 'comply with rules / law / requirements',
    personalPrompt: '造句：I have to comply with ___.',
  },
  anticipate: {
    core: '提前预判可能发生什么，并做准备。',
    image: '你看天气预报说下雨，所以提前带伞。这不是“希望下雨”，是提前预判。',
    breakdown: '别和 expect 混：expect 偏“觉得会发生”，anticipate 更常带“提前准备/应对”。',
    cue: 'anticipate problems / demand / changes',
    personalPrompt: '造句：I anticipate ___, so I ___.',
  },
  explicit: {
    core: '话说清楚，不让别人猜。',
    image: '不是“你自己看着办”，而是写明几点、做什么、交给谁。',
    breakdown: 'explicit = 明说；implicit = 暗含。',
    cue: 'explicit instruction / rule / statement',
    personalPrompt: '造句：The instruction should be explicit about ___.',
  },
  reluctant: {
    core: '心里不愿意，但可能还是会做。',
    image: '别人让你发言，你站起来了，但心里很抗拒。',
    breakdown: '常用 reluctant to do：不太愿意做某事。',
    cue: 'reluctant to agree / admit / leave',
    personalPrompt: '造句：I am reluctant to ___ because ___.',
  },
  inherent: {
    core: '东西本身自带的，不是后来加的。',
    image: '开车本身就有风险，不是因为某一次开得差才有风险。',
    breakdown: 'inherent risk = 内在风险；重点是“自带”。',
    cue: 'inherent risk / value / weakness',
    personalPrompt: '造句：There is inherent risk in ___.',
  },
  viable: {
    core: '现实中能行得通。',
    image: '一个计划听起来漂亮，但有钱、有人、时间够，才算 viable。',
    breakdown: 'possible 是可能，viable 是可实行、撑得住。',
    cue: 'viable option / solution / plan',
    personalPrompt: '造句：___ is a viable option for me.',
  },
}

const actionWords: Record<string, string> = {
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
  const antigravity = antigravityHooks[word.word.toLowerCase()]
  const origin = wordOrigins[word.word.toLowerCase()]
  if (antigravity) {
    return {
      ...antigravity,
      breakdown: origin ?? antigravity.breakdown,
    }
  }

  const exact = specialHooks[word.word.toLowerCase()]
  if (exact) {
    return {
      ...exact,
      breakdown: origin ?? exact.breakdown,
    }
  }

  const core = actionWords[word.word.toLowerCase()] ?? `先抓它的使用场景：${word.meaning.split('；')[0]}。`
  return {
    core,
    image: `真实例句：${word.example}`,
    breakdown: origin ?? `词源暂缺；先绑定搭配：${word.collocation}。`,
    cue: word.collocation,
    personalPrompt: `自己造句：用 ${word.word} 写一句和你生活有关的话。`,
  }
}
