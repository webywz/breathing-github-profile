# breathing-github-profile

**A living GitHub profile README — declarative config, marker-safe refresh, CLI + library.**  
**会呼吸的 GitHub 主页 README：声明式配置、标记保护区刷新，CLI 与库双入口。**

[![npm](https://img.shields.io/npm/v/@webywz/breathing-github-profile.svg)](https://www.npmjs.com/package/@webywz/breathing-github-profile)
[![Test](https://github.com/webywz/breathing-github-profile/actions/workflows/test.yml/badge.svg)](https://github.com/webywz/breathing-github-profile/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Package: `@webywz/breathing-github-profile` · CLI binary: `breathing-profile` · Node.js 18.18+

---

## Features · 特性

| | EN | 中文 |
| --- | --- | --- |
| Config | YAML / JSON define intro, sections, and style | YAML / JSON 声明介绍、章节与样式 |
| Refresh | Updates only `<!--MARKER:START-->…<!--MARKER:END-->` | 只改标记区，手写文案保留 |
| Stats | Stars, forks, repos, followers; language mix; featured repos | 统计、语言分布、精选仓库 |
| Sections | `stats` · `languages` · `repos` · `custom` | 四种章节类型 |
| Automation | Daily GitHub Actions workflow | Actions 每日定时刷新 |
| HTML | `--html [path]` self-contained offline preview (no CDN) | `--html [path]` 自包含离线预览（无 CDN） |
| API | CLI commands + TypeScript library exports | CLI + 库 |

Live example: [webywz/webywz](https://github.com/webywz/webywz).

---

## Install · 安装

```bash
npm i -g @webywz/breathing-github-profile
npx breathing-profile --help
# or without a global install:
npx @webywz/breathing-github-profile --help
```

One-shot without installing globally:

```bash
npx --yes @webywz/breathing-github-profile generate -c config.yml -o README.md
```

From source (develop):

```bash
git clone https://github.com/webywz/breathing-github-profile.git
cd breathing-github-profile
npm install
npm run build
```

---

## Quick start · 快速开始

### 1. Config · 配置

Create `config.yml` with the init command, or write one manually:

```bash
npx breathing-profile init
# Edit config.yml to replace 'octocat' with your GitHub username
```

Or create `config.yml` manually:

```yaml
username: your-github-username

intro:
  zh: |
    Full-stack developer · open source
    Happy to connect.
  en: |
    Full-stack developer · open source
    Let's connect.

featuredRepos:
  - your-best-repo

sections:
  - type: stats
    marker: STATS
    title: GitHub Stats · 统计

  - type: languages
    marker: LANGUAGES
    title: Languages · 常用语言

  - type: repos
    marker: REPOS
    title: Featured · 精选项目
```

Full sample: [examples/webywz.yml](examples/webywz.yml).

### 2. Initialize config · 初始化配置

```bash
npx breathing-profile init
# Creates config.yml from the built-in demo template
# 从内置演示模板创建 config.yml
```

Then edit `config.yml` to replace `octocat` with your GitHub username.
然后编辑 `config.yml`，将 `octocat` 替换为你的 GitHub 用户名。

### 3. Generate · 生成

```bash
npx breathing-profile generate -c config.yml -o README.md
npx breathing-profile generate -c config.yml -o README.md --json  # machine-readable CI output
npx breathing-profile generate -c config.yml -o README.md --html  # self-contained HTML preview on stdout
npx breathing-profile generate -c config.yml -o README.md --html preview.html
npx breathing-profile refresh  -c config.yml -r README.md
npx breathing-profile refresh  -c config.yml -r README.md --json  # machine-readable CI output
npx breathing-profile refresh  -c config.yml -r README.md --html
npx breathing-profile refresh  -c config.yml -r README.md --html preview.html
npx breathing-profile validate -c config.yml
npx breathing-profile validate -c config.yml --json  # machine-readable CI output
npx breathing-profile generate --no-color  # disable colored output
NO_COLOR=1 npx breathing-profile generate  # also disables colors
npx breathing-profile generate --quiet     # no spinner / success summary
npx breathing-profile validate --locale en # English-only human messages
npx breathing-profile validate --locale zh # Chinese-only human messages
```

| Command | EN | 中文 |
| --- | --- | --- |
| `init` | Create a starter config.yml (use `--force` to overwrite) | 创建初始 config.yml（使用 `--force` 覆盖） |
| `init --json` | Create config; output JSON (for CI) | 创建配置，输出 JSON（供 CI 使用） |
| `init --quiet` | Create config; no success summary | 创建配置，不打印成功摘要 |
| `init --locale en\|zh` | Human messages in one language (omit = bilingual) | 人类可读消息只用一种语言（省略则中英双语） |
| `generate` | Write a full README from config + GitHub data | 按配置与 GitHub 数据生成完整 README |
| `generate --json` | Generate and output JSON (for CI) | 生成 README 并输出 JSON（供 CI 使用） |
| `generate --html [path]` | Generate; write a self-contained HTML preview (stdout or file) | 生成 README，并写出自包含 HTML 预览（stdout 或文件） |
| `generate --quiet` | Generate; no spinner / success summary | 生成 README，不打印 spinner 与成功摘要 |
| `generate --locale en\|zh` | Spinner / summary / errors in one language | spinner、摘要与错误只用一种语言 |
| `refresh` | Rewrite marker sections only | 只刷新标记区 |
| `refresh --json` | Refresh markers; output JSON (for CI) | 刷新标记区，输出 JSON（供 CI 使用） |
| `refresh --html [path]` | Refresh; write a self-contained HTML preview (stdout or file) | 刷新标记区，并写出自包含 HTML 预览（stdout 或文件） |
| `refresh --quiet` | Refresh; no spinner / success summary | 刷新标记区，不打印 spinner 与成功摘要 |
| `refresh --locale en\|zh` | Spinner / summary / errors in one language | spinner、摘要与错误只用一种语言 |
| `validate` | Check the config file | 校验配置 |
| `validate --json` | Check the config file; output JSON (for CI) | 校验配置，输出 JSON（供 CI 使用） |
| `validate --quiet` | Check the config; no success summary | 校验配置，不打印成功摘要 |
| `validate --locale en\|zh` | Human messages in one language (omit = bilingual) | 人类可读消息只用一种语言（省略则中英双语） |

**Color output · 彩色输出**

By default, the CLI uses colored output (via ANSI escape codes). To disable:  
默认情况下，CLI 使用彩色输出（通过 ANSI 转义码）。禁用彩色输出：

- Add `--no-color` flag to any command · 在任何命令后添加 `--no-color` 标志
- Or set `NO_COLOR=1` environment variable · 或设置 `NO_COLOR=1` 环境变量
- `--json` mode always outputs plain JSON without colors · `--json` 模式始终输出无颜色的纯 JSON
- `--html` chrome is uncolored HTML; `--no-color` still applies to any human terminal lines · `--html` 页面本身无 ANSI；`--no-color` 仍作用于终端人类可读行

**Quiet output · 静默输出**

`--quiet` (or `-q`) suppresses the spinner and human success summary lines. Errors still go to stderr with a non-zero exit. Combined with `--json`, JSON stdout is unchanged. Combined with `--html`, the HTML preview still writes to stdout or the given file.  
`--quiet`（或 `-q`）会隐藏 spinner 与人类可读的成功摘要。错误仍写入 stderr 并以非零退出。与 `--json` 同时使用时，stdout 仍为 JSON。与 `--html` 同时使用时，HTML 预览仍写入 stdout 或指定文件。

```bash
npx breathing-profile generate --quiet -c config.yml -o README.md
npx breathing-profile --quiet validate -c config.yml
npx breathing-profile generate --quiet --json -c config.yml -o README.md  # JSON unchanged
```

**Locale · 语言**

`--locale en` or `--locale zh` prints spinner text, success summaries, and human error messages in that language only. Omit `--locale` to keep the current bilingual EN / ZH (or EN · ZH) wording. Invalid values (`fr`, `ja`, …) are a usage error and exit non-zero. `--json` keys and shape are unchanged regardless of locale (global or per-command, same pattern as `--quiet` / `--json`).  
`--locale en` 或 `--locale zh` 只以该语言显示 spinner、成功摘要和人类可读错误。省略 `--locale` 则保持现有中英双语。非法取值会以用法错误非零退出。无论 locale 如何，`--json` 的字段名与结构不变（全局或命令级，写法与 `--quiet` / `--json` 相同）。

`init --locale zh` also localizes the post-success next-step chrome (`后续步骤` / `运行:`); command names stay `breathing-profile validate|generate`. Omit locale or `--locale en` still prints `Run:` as before.  
`init --locale zh` 的成功后续步骤同样全中文（`后续步骤` / `运行:`），命令名不变。省略 locale 或 `--locale en` 仍显示英文 `Run:`。

```bash
npx breathing-profile generate --locale en -c config.yml -o README.md
npx breathing-profile --locale zh validate -c config.yml
npx breathing-profile init --locale zh
npx breathing-profile generate --locale zh --json -c config.yml -o README.md  # JSON unchanged
```

#### Init with `--json` · 使用 `--json` 初始化

For machine-readable CI init, use `--json` (or `-j`):  
在 CI 中使用 `--json` (或 `-j`) 初始化并获取机器可读的输出：

```bash
npx breathing-profile init --json -o config.yml
```

**Success output (exit 0) / 成功时（退出码 0）：**

```json
{
  "ok": true,
  "action": "created",
  "path": "config.yml"
}
```

**With `--force` (exit 0) / 使用 `--force` 覆盖（退出码 0）：**

```json
{
  "ok": true,
  "action": "updated",
  "path": "config.yml"
}
```

**Failure output (exit 1) / 失败时（退出码 1）：**

```json
{
  "ok": false,
  "error": "Config already exists: config.yml. Use --force to overwrite."
}
```

#### Validate with `--json` · 使用 `--json` 验证

For machine-readable CI checks, use `--json` (or `-j`):  
在 CI 中使用 `--json` (或 `-j`) 获取机器可读的输出：

```bash
npx breathing-profile validate --json -c config.yml
```

**Success output (exit 0) / 成功时（退出码 0）：**

```json
{
  "ok": true,
  "config": {
    "username": "your-username",
    "intro": { "zh": "...", "en": "..." },
    ...
  }
}
```

**Failure output (exit 1) / 失败时（退出码 1）：**

```json
{
  "ok": false,
  "error": "配置中必须包含有效的 username 字段"
}
```

#### Generate with `--json` · 使用 `--json` 生成

For machine-readable CI generation, use `--json` (or `-j`):  
在 CI 中使用 `--json` (或 `-j`) 生成并获取机器可读的输出：

```bash
npx breathing-profile generate --json -c config.yml -o README.md
```

**Success output (exit 0) / 成功时（退出码 0）：**

```json
{
  "ok": true,
  "output": "README.md",
  "config": "config.yml",
  "username": "your-username",
  "bytes": 12345,
  "sections": 3
}
```

**Failure output (exit 1) / 失败时（退出码 1）：**

```json
{
  "ok": false,
  "error": "Config not found / 配置文件不存在: config.yml"
}
```

> **Note:** `--json` mode still writes README to `--output` and saves `data/profile.json`.  
> **注意：** `--json` 模式下仍然会写入 README 到 `--output` 并保存 `data/profile.json`。

#### Refresh with `--json` · 使用 `--json` 刷新

For machine-readable CI refresh, use `--json` (or `-j`):  
在 CI 中使用 `--json` (或 `-j`) 刷新并获取机器可读的输出：

```bash
npx breathing-profile refresh --json -c config.yml -r README.md
```

**Success output (exit 0) / 成功时（退出码 0）：**

```json
{
  "ok": true,
  "action": "refreshed",
  "path": "README.md"
}
```

**Failure output (exit 1) / 失败时（退出码 1）：**

```json
{
  "ok": false,
  "error": "Config not found / 配置文件不存在: config.yml"
}
```

> **Note:** `--json` mode still writes updated README to `--readme` and saves `data/profile.json`.  
> **注意：** `--json` 模式下仍然会写入更新后的 README 到 `--readme` 并保存 `data/profile.json`。

#### Generate / refresh with `--html` · 使用 `--html` 预览

`--html` writes a self-contained offline HTML preview of the generated or refreshed README (inline CSS, no CDN, no external fonts or scripts). Open it via `file://`. The page shows a stats summary plus a rendered preview of the markdown that `generate` / `refresh` just wrote.

`--html` 写出一份自包含离线 HTML 预览（内联 CSS，无 CDN、无外部字体或脚本），可用 `file://` 打开。页面包含统计摘要，以及刚刚 `generate` / `refresh` 写出的 README 渲染预览。

| Form · 写法 | Result · 结果 |
| --- | --- |
| `--html` | Print HTML to stdout · 打印到标准输出 |
| `--html preview.html` | Write HTML to that file (parent dirs created) · 写入指定文件（自动创建父目录） |

README output (`-o` / `-r`) and `data/profile.json` are unchanged. `--quiet` still hides the spinner and human success lines. `--locale` localizes preview labels (and human messages); omit `--locale` for bilingual chrome. `--no-color` still applies to terminal lines. `--html` and `--json` cannot be used together.

README 输出（`-o` / `-r`）与 `data/profile.json` 行为不变。`--quiet` 仍隐藏 spinner 与人类成功摘要。`--locale` 本地化预览标签（以及人类消息）；省略则中英双语。`--no-color` 仍作用于终端行。`--html` 与 `--json` 不能同时使用。

```bash
npx breathing-profile generate -c config.yml -o README.md --html
npx breathing-profile generate -c config.yml -o README.md --html out/preview.html
npx breathing-profile refresh  -c config.yml -r README.md --html --quiet
npx breathing-profile generate -c config.yml -o README.md --html --locale zh
```

**Conflict (exit 1) / 冲突（退出码 1）：**

```text
error: --html and --json cannot be used together / --html 与 --json 不能同时使用
```

Optional: set `GITHUB_TOKEN` or `GH_TOKEN` (or use `secrets.GITHUB_TOKEN` in Actions) for higher API rate limits.

---

## Configuration · 配置说明

### Top-level · 顶层字段

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `username` | string | yes | GitHub login |
| `intro.zh` / `intro.en` | string | one of zh/en (non-empty) | zh-only, en-only, or both · 仅中文 / 仅英文 / 双语均可 |
| `featuredRepos` | string[] | no | Pinned repo names |
| `sections` | Section[] | no | Ordered sections |
| `style` | StyleConfig | no | See style fields below · 见下方 style 说明 |


### Style · 样式字段

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `icons` | boolean | `true` | When `false`, omit emoji from headings, stats table, and repo cards · `false` 时去掉标题/统计表/仓库卡片中的 emoji |
| `theme` | `'light' \| 'dark' \| 'auto'` | `auto` | **Reserved** — pure Markdown profiles ignore theme; kept for forward compatibility · **预留字段**，纯 Markdown 主页不生效 |
| `badges` | boolean | `true` | **Reserved** — not applied by the generator yet · **预留字段**，生成器暂未读取 |

```yaml
style:
  icons: true   # set false for emoji-free output
  theme: auto   # reserved
  badges: true  # reserved
```

### Section types · 章节类型

**`stats`** — totals (stars, forks, public repos, followers, following).

```yaml
- type: stats
  marker: STATS
  title: GitHub Stats · 统计
```

**`languages`** — top languages by share.

```yaml
- type: languages
  marker: LANGUAGES
  title: Languages · 常用语言
```

**`repos`** — featured list, or highest-star repos when `featuredRepos` is empty.

```yaml
- type: repos
  marker: REPOS
  title: Featured · 精选项目
```

**`custom`** — raw Markdown inside a marker.

```yaml
- type: custom
  marker: TECH_STACK
  title: Stack · 技术栈
  content: |
    TypeScript · NestJS · FastAPI · Vue
```

Markers must match exactly:

```markdown
<!--STATS:START-->
…
<!--STATS:END-->
```

---

## Automation · 自动刷新

In your profile repo (`USER/USER`):

1. Add `config.yml`
2. Add `.github/workflows/refresh-profile.yml`:

```yaml
name: Refresh profile README

on:
  schedule:
    - cron: '0 0 * * *'   # daily 00:00 UTC
  workflow_dispatch:

permissions:
  contents: write

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm i @webywz/breathing-github-profile@1.1.11
      - name: Refresh README
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx breathing-profile refresh
      - name: Commit if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add README.md data/profile.json
          git diff --quiet || git commit -m "chore: refresh profile README"
          git push
```

Flow: cron → GitHub API → rewrite markers → commit only when content changed. Copy outside markers is never touched.

流程：定时触发 → 拉 GitHub 数据 → 只改标记区 → 有变更才提交。标记外的手写内容不会被动。

---

## Library · 作为库使用

```ts
import {
  loadConfig,
  GitHubClient,
  ReadmeGenerator,
} from '@webywz/breathing-github-profile';

const config = loadConfig('config.yml');
const client = new GitHubClient(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
const data = await client.getProfileData(config.username);
const readme = new ReadmeGenerator(config, data).generate();
```

Also exported: `validateConfig`, `getDefaultConfig`, `updateReadmeMarkers`.

---

## Develop · 开发

```bash
git clone https://github.com/webywz/breathing-github-profile.git
cd breathing-github-profile
npm install
npm run build
npm test
npm run lint

npm run generate -- -c examples/webywz.yml -o examples/README.md
npm run refresh  -- -c examples/webywz.yml -r examples/README.md
```

```
src/
  types.ts       types
  config.ts      load / validate
  github.ts      GitHub client
  generator.ts   README generate + marker update
  cli.ts         CLI
  index.ts       library entry
examples/        sample configs
```

---

## FAQ · 常见问题

**Rate limits?** Set `GITHUB_TOKEN` or `GH_TOKEN`. Actions already injects `secrets.GITHUB_TOKEN`.

**Only update part of the README?** Use `refresh`, not `generate`.

**Markers not updating?** Names must match `marker` in config; use `<!--NAME:START-->` / `<!--NAME:END-->`.

---

## Links · 链接

- Demo profile: [webywz/webywz](https://github.com/webywz/webywz)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- License: [MIT](LICENSE) © webywz
