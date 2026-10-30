# breathing-github-profile

**A living GitHub profile README — declarative config, marker-safe refresh, CLI + library.**  
**会呼吸的 GitHub 主页 README：声明式配置、标记保护区刷新，CLI 与库双入口。**

[![npm](https://img.shields.io/npm/v/@webywz/breathing-github-profile.svg)](https://www.npmjs.com/package/@webywz/breathing-github-profile)
[![Test](https://github.com/webywz/breathing-github-profile/actions/workflows/test.yml/badge.svg)](https://github.com/webywz/breathing-github-profile/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Package: `@webywz/breathing-github-profile` · CLI binary: `breathing-profile` · Node 18+

---

## Features · 特性

| | EN | 中文 |
| --- | --- | --- |
| Config | YAML / JSON define intro, sections, and style | YAML / JSON 声明介绍、章节与样式 |
| Refresh | Updates only `<!--MARKER:START-->…<!--MARKER:END-->` | 只改标记区，手写文案保留 |
| Stats | Stars, forks, repos, followers; language mix; featured repos | 统计、语言分布、精选仓库 |
| Sections | `stats` · `languages` · `repos` · `custom` | 四种章节类型 |
| Automation | Daily GitHub Actions workflow | Actions 每日定时刷新 |
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

Create `config.yml`:

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

### 2. Generate · 生成

```bash
npx breathing-profile generate -c config.yml -o README.md
npx breathing-profile refresh  -c config.yml -r README.md
npx breathing-profile validate -c config.yml
```

| Command | EN | 中文 |
| --- | --- | --- |
| `generate` | Write a full README from config + GitHub data | 按配置与 GitHub 数据生成完整 README |
| `refresh` | Rewrite marker sections only | 只刷新标记区 |
| `validate` | Check the config file | 校验配置 |

Optional: set `GITHUB_TOKEN` (or use `secrets.GITHUB_TOKEN` in Actions) for higher API rate limits.

---

## Configuration · 配置说明

### Top-level · 顶层字段

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `username` | string | yes | GitHub login |
| `intro.zh` / `intro.en` | string | one of zh/en | Bilingual intro blocks |
| `featuredRepos` | string[] | no | Pinned repo names |
| `sections` | Section[] | no | Ordered sections |
| `style` | StyleConfig | no | Theme / layout knobs |

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
      - run: npm i @webywz/breathing-github-profile
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
const client = new GitHubClient(process.env.GITHUB_TOKEN);
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

**Rate limits?** Set `GITHUB_TOKEN`. Actions already injects `secrets.GITHUB_TOKEN`.

**Only update part of the README?** Use `refresh`, not `generate`.

**Markers not updating?** Names must match `marker` in config; use `<!--NAME:START-->` / `<!--NAME:END-->`.

---

## Links · 链接

- Demo profile: [webywz/webywz](https://github.com/webywz/webywz)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- License: [MIT](LICENSE) © webywz
