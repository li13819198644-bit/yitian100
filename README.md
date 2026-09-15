# 一天100词

面向 iPhone 的移动优先背词应用。支持三种使用方式：本地运行、GitHub Pages 发布成网页 PWA、或通过 Capacitor 打包成 iOS App。v1 无后端，使用 IndexedDB 离线保存词库、学习进度和 SM-2 风格复习计划。

## 功能

- 每日目标默认 100 词，按 20 组 × 5 词推进
- 认识 / 模糊 / 不认识 三种反馈
- 到期复习优先于新词，不认识自动进入弱词和复习队列
- 英译中、中译英选择、语境填空、快刷模式
- 首页显示今日进度、正确率、Combo、连续学习、掌握词、弱词数
- CSV / JSON 本地导入词库
- 可选 Supabase 账号密码云同步进度
- PWA manifest、service worker、离线缓存、iOS safe-area 支持
- Capacitor iOS 工程，可用 Xcode 安装到 iPhone
- GitHub Pages 自动部署工作流
- 单词起源和邪修记法分开维护：起源讲词源，邪修只做画面/动作钩子

## 复习阶段维护原则

### 复习减负与统计

- 每个词在一轮内最多出现两次；必须隔开至少 3 个其他词才能重测，队尾不立即重复。
- 同一天答错两次后，下一次复习不早于次日 09:00；弱词和测验入口均遵守冷却。
- 当天刚练过且未到期的弱词暂时离开轮换队列，详情仍可随时查看。
- 同一天的重复答对记录为练习，不继续增加连续巩固次数、易度或稳定度；这是保守的排程规则，并非个人记忆模型的校准结果。
- 减负首页按 20 个不同单词显示目标，完成页展示本轮结果和剩余总数，可直接结束。
- 从本版开始保留最近 90 个学习日的首答结果与题型。纠正答案不覆盖首答；历史累计数据不反推每日准确率。
- 导出预测采用本地自然日；“明日新增到期”不包含旧积压或未来答错引起的重测。

现在没有新词时，优先复习旧词和弱词。遇到记不住的词，直接记录具体卡点，例如“precedent 会想到流程”；之后修改对应词的起源辨析和邪修钩子，并用测试防止同类错误回退。

邪修记法由人工维护，不再使用 Antigravity 生成。验收标准是：闭眼能看到一个动作场景，并且能把你从错误联想拉回正确含义。

## 安装和运行

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
npm run preview
```

运行测试：

```bash
npm test
```

## 方式一：iPhone Safari 使用

1. 让电脑和 iPhone 连接同一个 Wi-Fi。
2. 在电脑上查看局域网 IP，例如 macOS：

```bash
ipconfig getifaddr en0
```

3. 启动 Vite 并允许局域网访问：

```bash
npm run dev -- --host 0.0.0.0
```

4. 在 iPhone Safari 打开 `http://你的电脑IP:5173`。
5. 选择 Safari 分享按钮，然后点“添加到主屏幕”。开发环境也会注册 PWA；生产构建更接近真实离线表现。

## 发布到 GitHub Pages

1. 登录 GitHub，新建仓库，名称建议用 `yitian100`。
2. 把本项目文件全部上传到仓库的 `main` 分支。
3. 打开仓库 `Settings` → `Pages`。
4. 在 `Build and deployment` 的 `Source` 中选择 `GitHub Actions`。
5. 打开 `Actions` 页面，等待 `Deploy to GitHub Pages` 完成。
6. 发布网址通常是：`https://你的GitHub用户名.github.io/yitian100/`。

本项目已经包含 `.github/workflows/deploy.yml`，提交后会自动安装依赖、运行测试、构建并部署 `dist`。

## 云同步设置

云同步使用 Supabase Auth 和一张用户私有进度表。密码由 Supabase Auth 处理，本应用不保存明文密码；本地 IndexedDB 仍然是主存储，登录后额外上传云端快照。

1. 在 Supabase 新建项目。
2. 打开 `SQL Editor`，执行：

```sql
create table if not exists public.learning_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.learning_snapshots enable row level security;

create policy "Users can read own learning snapshot"
on public.learning_snapshots
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own learning snapshot"
on public.learning_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own learning snapshot"
on public.learning_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

3. 复制项目的 `Project URL` 和 `anon public key`，创建 `.env.local`：

```bash
cp .env.example .env.local
```

然后填写：

```bash
VITE_SUPABASE_URL=你的 Project URL
VITE_SUPABASE_ANON_KEY=你的 anon public key
```

4. 本地运行：

```bash
npm run dev
```

5. 发布到 GitHub Pages 时，在仓库 `Settings` → `Secrets and variables` → `Actions` 里添加同名变量或 secret：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

如果你想用“用户名”而不是邮箱，本应用会把 `huali` 转成 `huali@yitian100.local` 交给 Supabase Auth。Supabase 如果开启邮件确认，建议用真实邮箱注册；如果只给自己用，可以在 Supabase Auth 设置里关闭邮箱确认。

## 方式二：打包成 iPhone App

项目已经集成 Capacitor，并生成了 iOS 工程：`ios/`。

前置条件：

- macOS
- Xcode
- 一台 iPhone
- Apple ID。真机安装通常需要在 Xcode 登录 Apple ID 并选择开发团队。

同步网页代码到 iOS 工程：

```bash
npm run ios:sync
```

打开 Xcode：

```bash
npm run ios:open
```

在 Xcode 中：

1. 选择 `App` target。
2. 在 Signing & Capabilities 里选择你的 Team。
3. 用 USB 或同 Wi-Fi 连接 iPhone。
4. 选择你的 iPhone 作为运行设备。
5. 点击 Run 安装到手机。

也可以尝试命令行运行：

```bash
npm run ios:run
```

每次改完 React 代码后，先执行 `npm run ios:sync`，再回到 Xcode 运行。

## 部署

### Vercel

1. 将项目推到 GitHub。
2. Vercel 导入仓库。
3. Framework 选择 Vite。
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Netlify

1. Netlify 导入仓库。
2. Build command: `npm run build`
3. Publish directory: `dist`

## 导入格式

CSV 表头：

```csv
word,phonetic,meaning,collocation,example,difficulty,level
facilitate,/fəˈsɪlɪteɪt/,促进；使便利,facilitate communication,Clear visuals facilitate communication.,3,B2
```

JSON：

```json
[
  {
    "word": "facilitate",
    "phonetic": "/fəˈsɪlɪteɪt/",
    "meaning": "促进；使便利",
    "collocation": "facilitate communication",
    "example": "Clear visuals facilitate communication.",
    "difficulty": 3,
    "level": "B2"
  }
]
```

## 结构

### 第九批词库扩充

- 新增 `src/data/generatedBatch9.ts` 中的 100 个独立词条，内置词库共 505 词。沿用原有按日乱序的新词队列，不重置学习进度。
- 本批手写记忆提示直接发布，避免被旧的通用拆词规则覆盖。字形借用属于助记联想，不作为历史词源。
- 构词说明参考 [Cambridge 的构词说明](https://dictionary.cambridge.org/us/grammar/british-grammar/word-formation_2)；特殊词源核查参考 Etymonline 的 [overwhelm](https://www.etymonline.com/word/overwhelm)、[livelihood](https://www.etymonline.com/word/livelihood) 和 [thorough](https://www.etymonline.com/word/thorough)。本批例句为原创，等级为应用内学习分组，不是官方 CEFR 认证。

### 语法板块

- 底部「语法」入口；设置仍可通过右上角齿轮进入。
- 16 个专题、80 道原创四选一题，含中文规则、例子和逐题解析。无需听音或输入文字。
- 第二批新增间接引语、过去推测与遗憾、过去习惯与适应、比较与程度、数量词、愿望与遗憾、倒装、分词。前 40 题的 ID 保持不变，旧学习记录继续有效；新题进入现有每日统计与云同步。
- 每轮最多 5 道不同的题，答错后阅读解析并手动继续，不在本轮重复插题。
- 到期复习优先；答错次日 09:00 复习，跨日答对按 1、3、7、14 天安排。同日重复答对不扩大间隔。这是简单规则，不是经过个人数据拟合的记忆模型。
- 语法记录保存在 IndexedDB 的 `meta/grammar`，附带 localStorage 备份；独立于单词统计。已登录时进入现有云快照，旧云快照没有语法字段时不覆盖本机语法进度。
- 学习报告包含每题次数、首次/最近正误、下次复习时间；「重置单词学习进度」仅清除单词进度。
- 题目在 `src/data/grammar.ts`，调度与合并在 `src/lib/grammar.ts`，界面在 `src/components/GrammarPanel.tsx`。

### 当天学习统计

- 首页「当天学习统计」按设备本地日期显示单词和语法数据，可下载或通过系统分享 JSON 文件，文件名为 `yitian100-daily-report-YYYY-MM-DD.json`。
- 单词记录每日去重词数、新词/旧词、作答次数、逐词未通过次数、首次和最近结果、练习模式。自评与客观测验正确率分开，重复纠正不改写当天首答。
- 语法记录当天次数、首次和最近结果及具体误选项，报告附题干、正确答案、解析。
- 逐日明细保留最近 90 个有记录的学习日，随原有进度自动离线保存并进入云快照。更新前缺失的数据明确标记为部分记录或未知，不从累计数据反推。
- 当天报告不含登录邮箱、密码或访问令牌；不统计作答耗时。原有完整学习报告也包含 `dailyReport`。

```text
src/
  data/seedWords.ts
  lib/db.ts
  lib/importer.ts
  lib/srs.ts
  lib/srs.test.ts
  App.tsx
  index.css
ios/
  App/
```
