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
