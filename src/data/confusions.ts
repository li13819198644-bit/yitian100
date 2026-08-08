import type { VocabWord } from '../types'

export const confusionNotes: Record<string, NonNullable<VocabWord['confusions']>> = {
  articulate: [
    {
      trap: 'agriculture / 农业',
      wrongPath: '看到 arti- 往 agriculture 跑，但 agriculture 的核心是 agri = 田地。',
      correction: 'articulate 来自 articulus = 小关节、小节；表达清楚就是把话一节一节接清楚。',
      cue: '不是 agri 田地，是 articul 关节/小节。',
    },
  ],
  sanction: [
    {
      trap: 'section / 部分',
      wrongPath: 'sanction 和 section 长得像，但 section 是 sec = cut，切成一段。',
      correction: 'sanction 的核心是 official act：官方盖章。绿章是批准，红章是制裁。',
      cue: 'sanction 看官方章，不看 section 的切块。',
    },
  ],
  substantiate: [
    {
      trap: 'substantial / 大量的',
      wrongPath: 'substantial 是“有分量的”；但 substantiate 是动词，不是形容数量。',
      correction: 'substantiate = 给说法加 substance，用证据把空话变成有实体的主张。',
      cue: 'substantiate 是“拿证据坐实”，不是“很多”。',
    },
  ],
  precedent: [
    {
      trap: 'procedure / process / 流程',
      wrongPath: 'pre- 容易让人想到流程的前后步骤，但 precedent 不是步骤。',
      correction: 'precedent = 先前发生过、可作为依据的案例；法律里就是“先例”。',
      cue: 'precedent 是前案，不是流程。',
    },
  ],
  procurement: [
    {
      trap: '去采购门',
      wrongPath: '“采购门”只能帮你想到采购，不能帮你想到正式企业流程。',
      correction: 'procurement = 公司/政府的正式采购流程，包括询价、供应商、审批和合同。',
      cue: 'procurement 是制度化采购，不是随手买。',
    },
  ],
  explicit: [
    {
      trap: 'implicit / imply',
      wrongPath: 'explicit 和 implicit 都有 -plicit，容易只记成一团“说话相关”。',
      correction: 'ex- = out，explicit 是摊开说明；im- = in，implicit 是藏在里面没明说。',
      cue: 'explicit 摊出来，implicit 藏里面。',
    },
  ],
  implicit: [
    {
      trap: 'imply',
      wrongPath: 'imply 是动作：暗示；implicit 是状态：含蓄的、未明说的。',
      correction: 'A implies B = A 暗示 B；an implicit rule = 一条没明说但存在的规则。',
      cue: 'imply 是“暗示这个动作”，implicit 是“暗含这个状态”。',
    },
  ],
  imply: [
    {
      trap: 'implicit',
      wrongPath: 'implicit 是形容词，描述信息藏在里面；imply 是动词。',
      correction: 'imply 后面常接意思或责任：This may imply responsibility.',
      cue: 'imply 要能做动作：暗示/意味着。',
    },
  ],
  refute: [
    {
      trap: 'refuse / 拒绝',
      wrongPath: 'refuse 只是拒绝接受或去做；它没有证明对方错误。',
      correction: 'refute 比 refuse 多走一步：拿证据或逻辑把一个说法驳倒。拼写上把 refuse 的 s 换成 t，得到 refute。',
      cue: 'refuse 是拒绝；refute 是用证据驳斥。',
    },
  ],
  resilient: [
    {
      trap: 'silent / 安静的',
      wrongPath: 'resilient 中间的字母看起来有点像 silent，容易误切成“重新安静”。但两者读音和词源都不同。',
      correction: 'resilient 来自拉丁语 resilire：re- 表示往回，salire 表示跳；核心画面是受压或受挫后“弹回来”。',
      cue: 'silent 是安静；resilient 是回弹恢复。听 /zɪl/，看弹簧。',
    },
  ],
  statute: [
    {
      trap: 'status / statue / 站着',
      wrongPath: 'stat- 会联想到站着、状态或雕像，但 statute 不是状态也不是雕像。',
      correction: 'statute = 站住的规则，被正式立起来的成文法规。',
      cue: 'statute 是立住的法条。',
    },
  ],
}
