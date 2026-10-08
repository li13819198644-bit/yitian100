# 拆解与记忆资料整理

2026-10-08 联网读取公开资料，并更新现有 605 词的详情展示。中文解释和搭配译文为本项目编写，不把拼写联想当历史词源。

## 采用的原则

1. 先看懂，再主动回忆。把词形和含义之间的连接说清楚，再移开目光在心里回忆一次，配合既有跨天复习。
2. 只突出少量信息。详情先给记忆块、含义连接和一组搭配；长例句、原词源和其他联想可以展开，默认不堆在一起。
3. 拆解有边界。现代构词、历史词干与拼写助记分别标注；历史词干不必是独立英语词，也不保证字面相加就能猜中现代意思。
4. 不改变默认词卡流程，不增加输入、选择题或核对步骤。浏览解释的结果仍是短时练习，保持沿用之前的观测规则。

## 本次实际读取的网络来源

- [Anki：主动回忆与间隔复习](https://github.com/ankitects/anki-manual/blob/91f7485236db2a89d2a8abaed618976caf971de2/src/background.md)。
- [Anki：保持卡片简短，先理解并在语境中学](https://github.com/ankitects/anki-manual/blob/91f7485236db2a89d2a8abaed618976caf971de2/src/editing.md#effective-learning)。
- [Anki：先思考答案，再揭示和自评](https://github.com/ankitects/anki-manual/blob/91f7485236db2a89d2a8abaed618976caf971de2/src/studying.md#questions)。
- [EtymDB 2.1](https://github.com/clefourrier/EtymDB/tree/878e5a55627048c6ed414a7b23739fe2385bd723)，读取词形、语言、释义及借用／派生关系数据；[数据声明](https://github.com/clefourrier/EtymDB/blob/878e5a55627048c6ed414a7b23739fe2385bd723/DATA_STATEMENT.md)说明资料来自 Wiktionary 的 2019 年数据快照，由自动解析整理，有覆盖与解析限制。
- [ety / Etymological Wordnet](https://github.com/jmsv/ety-python/tree/15ddf84b658bb1ccc91e793e2014d17fde80457b)，读取公开 `ety/data/etymologies.json` 关系数据。项目说明其数据主要来自 Wiktionary，词源并非只有一套无争议的答案。

Etymonline、Cambridge、Wiktionary 正文及部分研究网站在当前执行环境返回网络访问限制，本次没有直接重新读取这些网页。以项目已有词源笔记为基础，再与上述可访问资料交叉检查部分关系；不宣称 176 个词全部重新通过外部词典逐项核对。没有可靠构词依据时保留整词。

## 可复核的重点关系

| 词 | 本次公开数据中的关系或已有词条依据 | 新提示 |
| --- | --- | --- |
| repudiate | EtymDB：英语 repudiate → 拉丁 repudiātus → repudiō，释义 `to cast off, to reject` | repu / di / ate 只分拼写；正式拒绝认责 |
| refute | 两套公开数据都连接到拉丁 refūtō / refuto | 不拆成“再次”；保留 refuse 换字母的已认可助记，并明确不是词源 |
| exert | 两套公开数据都连接到拉丁 exsertus | ex / ert 只分拼写，记施加压力，不给 ert 造独立词义 |
| coherent | EtymDB：cohaērēns → co- + haereō；ety 同时列有 cohaereo 的 co- / haereo 关系 | 一起黏合 → 连贯 |
| eligible | EtymDB：eligibilis → ēligō，释义 `select, choose` | 能被选上 → 符合资格 |
| sustain | ety：sustenir → sustineo；既有词源笔记说明从下面撑住 | sus / tain → 维持下去 |
| reinforce | ety：inforce + re- | 再次加强；inforce 明确为旧词形 |
| predictable | ety：predict + -able | 能预测 → 可预测 |
| ownership | ety：owner + -ship | 所有者的权利／身份 → 所有权 |
| viable | 既有词源笔记：法语 vie / 拉丁 vita 为生命；ety 的法语 vie 记录同样连接 vita，但英语 viable 条目没有完整关系 | 用生命线索，不将 via“途径”当词源 |
| maintain / refund | 既有词源笔记分别说明法语手的词形、拉丁 refundere 倒回；数据不完整时不借现代 main / fund 推造历史 | 手托住状态；把付款退回 |

数据库关系是交叉检查线索，不能代替完整词典释义，也不能用“没有记录”证明某个词没有来源。原始大数据未打包进应用；仅发布人工整理的短中文记法，并在此注明来源。

## 更新范围与验证

- `src/data/wordBreakdowns.ts`：176 个现有词，其中 42 个历史词干、128 个构词、6 个拼写助记；其余 429 词整词绑定原搭配。
- `src/lib/wordBreakdown.ts`：只按明确词表选用拆解；不对未知词自动截取 re / pro / able 等字母。大小写查询与自定义导入词都有整词回退。
- `WordBreakdownPanel.tsx` / `App.tsx`：无需点开就显示短记法，长资料可选展开，初始词卡不泄露拆解或答案。
- `seedWords.ts` / `intervention.ts`：词库保存新内容，字形复盘复用同一份简短拆解；605 个 ID、原进度和已认可联想保留。
- 回归检查：块拼接还原拼写、中文意义、变形说明、未知词不硬拆、重点错误辨析、卡片答案隐藏、真实详情导航与 IndexedDB 旧词库内容更新。

验证结果：`npm test` 23 个文件、169 项通过；`npm run lint` 通过；`npm run build` 通过，生成 PWA 离线缓存。保留现有 Vite 主包超过 500 kB 的提示，构建成功。

本次采用通用学习原则，没有测得“加速多少”的个人效果，不替换现有排程算法。下一步的效果可继续通过已有跨天及七天保持统计观察，不能把立即看懂当成记忆提升。
