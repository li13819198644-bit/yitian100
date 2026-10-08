# Issue #1 开发验证

## 源码审计与差距

- 已有 `WordRecallCard`、统一四个练习入口、不会进入详情、原有队列去重和冷却；这些流程继续沿用。
- `srs.ts` 原有掌握条件是重复次数、稳定度、易度和历史恢复状态的规则组合，不能证明跨天无提示掌握。
- `studyStats.ts` 原有逐词首答和历史模式，但未记录提示来源、揭示时间、独立验证及保持试次；缺失数据保持未知。
- `db.ts` 保持 IndexedDB 版本 1。额外修复数据库空白时先写默认值而遮住 localStorage 设置／统计备份的问题，先恢复备份再补默认。
- `practiceDay` 只在练习发生时更新，冷却判断还要求等于当天；导出旧日期是预期行为。

## 实现文件

| 优先级 | 文件 | 结果 |
| --- | --- | --- |
| P0 | `types.ts`, `memoryEvidence.ts`, `studyStats.ts` | 可选观察事件与分维度证据；历史不反推；首答不覆盖 |
| P0 | `WordRecallCard.tsx`, `App.tsx` | 保留默认两次点击，揭示后可选三档自评；后台时揭示时长未知 |
| P0/P1 | `srs.ts`, `retrieval.ts` | 提示、辨认及短时成功不增加强度；旧题型兼容，不自动宣称独立验证 |
| P1 | `intervention.ts`, `TargetedReview.tsx`, `App.tsx` | 按失败原因短复盘、精确 repudiate 辨析、解释浏览标记；不改写学习时间或到期日 |
| P1 | `srs.ts`, `App.tsx`, `db.ts` | 风险优先队列、每日去重词数、积压与未来分开、少量新词入口、保留个人目标 |
| P2 | `memoryDiagnostics.ts`, `dailyReport.ts`, `DailyStatsPanel.tsx` | 分类首答、跨天／7 天保持、样本分母、缺失覆盖、顽固词变化与积压 |
| 验证 | `memoryEvidence.test.ts`, `memoryDiagnostics.test.ts`, `intervention.test.ts`, `db.test.ts` | 新证据、调度、诊断与真实 IndexedDB API 回归 |
| 验证 | `WordRecallCard.test.tsx`, `App.test.tsx`, `cloudSync.test.ts` | 实际 React 导航、简化流程、可选自评／复盘、云 JSON 往返 |
| CI | `.github/workflows/pr-checks.yml` | PR 上执行依赖安装、lint、测试与构建 |

## 可验证验收

1. 连续十个学习日选择题正确只生成辨认证据，自评／验证／保持仍未知。
2. 提示、当天纠正不增加稳定度；第一次错误仍保留。未提示的当天成功重复保留原到期日。
3. 新观测跨天与至少七天的保持分别计数；浏览解释会重新起算间隔，不把昨天看答案后答对声称为七天保持。
4. 顽固词说明默认折叠，记录卡点不增加练习次数；既有最大两次、隔至少三词、次日九点冷却测试继续执行。
5. 263 个旧词积压优先选近期失败的高风险词；仍能显式选五个新词。统计按不同词去重。
6. 使用 fake-indexeddb 真实存储 API 保存／读取 605 词及其进度、已斩状态、语法、历史模式、新观察字段、100 默认及 200 个人目标。云快照测试验证完整 JSON 往返，旧快照不清空本机语法。
7. 新数据没有客观验证时界面显示缺乏证据，旧数据缺失提示／时间／来源不补造；旧 `practiceDay` 不被导出过程改写。

2026-10-08 本地验证结果：`npm test` 21 个文件、159 项测试通过；`npm run lint` 通过；`npm run build` 通过，生成 PWA service worker。Vite 提示主包大于 500 kB，构建成功；本任务未调整现有打包方案。

测试覆盖软件行为与数据兼容，不证明用户实际记忆已经改善；iPhone 交互仍需真机体验。合并后沿用现有 Pages 工作流部署。
