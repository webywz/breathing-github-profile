# 🌊 breathing-github-profile

> 可复用的活跃 GitHub profile README 生成器，支持每日自动刷新

[![npm](https://img.shields.io/npm/v/@webywz/breathing-github-profile.svg)](https://www.npmjs.com/package/@webywz/breathing-github-profile)
[![GitHub](https://img.shields.io/github/package-json/v/webywz/breathing-github-profile)](https://github.com/webywz/breathing-github-profile)
[![Test](https://github.com/webywz/breathing-github-profile/actions/workflows/test.yml/badge.svg)](https://github.com/webywz/breathing-github-profile/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 特性

- 📝 **声明式配置**：使用 YAML/JSON 配置文件定义个人资料结构
- 🔄 **智能刷新**：自动更新标记部分，保留自定义内容
- 📊 **丰富统计**：GitHub 统计、语言分布、精选项目
- 🎨 **高度可定制**：支持自定义章节和样式
- 🤖 **自动化工作流**：GitHub Actions 每日定时刷新
- 🧪 **完善测试**：配置验证、标记完整性、快照测试
- 📦 **开箱即用**：CLI + 库两种使用方式
- 🌍 **多语言支持**：中英文双语介绍

## 🚀 快速开始

### 安装 · Install

```bash
npm i -g @webywz/breathing-github-profile
npx @webywz/breathing-github-profile --help
```

CLI 二进制名仍是 `breathing-profile`。

GitHub 安装（开发 / 未发布时）：

```bash
npm install github:webywz/breathing-github-profile
# 或克隆
git clone https://github.com/webywz/breathing-github-profile.git
cd breathing-github-profile && npm install && npm run build
```

```bash
npx --yes --package github:webywz/breathing-github-profile -- breathing-profile generate -c config.yml -o README.md
```

### 创建配置文件

创建 `config.yml` 文件：

```yaml
username: your-github-username

intro:
  zh: |
    🚀 全栈开发者 | 开源贡献者
    📫 欢迎交流合作！
  
  en: |
    🚀 Full-stack Developer | Open Source Contributor
    📫 Let's connect!

sections:
  - type: stats
    marker: STATS
    title: 📊 GitHub 统计
  
  - type: languages
    marker: LANGUAGES
    title: 💻 常用语言
  
  - type: repos
    marker: REPOS
    title: 🔥 精选项目
```

### 生成 README

```bash
# 生成新的 README
npx breathing-profile generate -c config.yml -o README.md

# 刷新现有 README 的标记部分
npx breathing-profile refresh -c config.yml -r README.md

# 验证配置文件
npx breathing-profile validate -c config.yml
```

## 📖 配置说明

### 基础配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | ✅ | GitHub 用户名 |
| `intro.zh` | string | ⚠️ | 中文介绍（zh 或 en 至少一个） |
| `intro.en` | string | ⚠️ | 英文介绍（zh 或 en 至少一个） |
| `featuredRepos` | string[] | ❌ | 精选仓库列表 |
| `sections` | Section[] | ❌ | 自定义章节 |
| `style` | StyleConfig | ❌ | 样式配置 |

### 章节类型

#### `stats` - 统计数据

显示 GitHub 统计信息：总 Stars、总 Forks、公开仓库数、关注者、正在关注等。

```yaml
- type: stats
  marker: STATS
  title: 📊 GitHub 统计
```

#### `languages` - 编程语言

显示最常用的编程语言及其占比。

```yaml
- type: languages
  marker: LANGUAGES
  title: 💻 常用语言
```

#### `repos` - 精选项目

显示精选项目或 Star 最多的项目。

```yaml
- type: repos
  marker: REPOS
  title: 🔥 精选项目
```

#### `custom` - 自定义内容

插入自定义 Markdown 内容。

```yaml
- type: custom
  marker: TECH_STACK
  title: 🛠 技术栈
  content: |
    ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
    ![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)
```

### 完整配置示例

查看 [examples/webywz.yml](examples/webywz.yml) 获取完整的配置示例。

## 🔄 自动刷新工作流

### 设置 GitHub Actions

1. 在你的 profile 仓库（如 `username/username`）中创建配置文件 `config.yml`

2. 创建 `.github/workflows/refresh-profile.yml`：

```yaml
name: 刷新 Profile README

on:
  schedule:
    - cron: '0 0 * * *'  # 每天 UTC 00:00
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
      
      # 尚未发布到 npm，从 GitHub 安装
      - run: npm install github:webywz/breathing-github-profile
      
      - name: 刷新 README
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx breathing-profile refresh
      
      - name: 提交更新
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add README.md data/profile.json
          git diff --quiet || git commit -m "🤖 自动更新 Profile"
          git push
```

3. 首次手动触发 Actions 或等待定时任务执行

### 工作原理

1. **定时触发**：GitHub Actions 按照 cron 表达式定时执行
2. **获取数据**：通过 GitHub API 获取最新的用户和仓库信息
3. **更新标记**：只更新 `<!--MARKER:START-->` 和 `<!--MARKER:END-->` 之间的内容
4. **保留自定义**：标记外的自定义文本完全保留
5. **提交变更**：如果内容有变化，自动提交并推送

## 🛠 开发指南

### 项目结构

```
breathing-github-profile/
├── src/
│   ├── types.ts          # 类型定义
│   ├── config.ts         # 配置解析
│   ├── github.ts         # GitHub API 客户端
│   ├── generator.ts      # README 生成器
│   ├── cli.ts           # CLI 入口
│   ├── index.ts         # 库入口
│   └── __tests__/       # 测试文件
├── examples/            # 配置示例
├── .github/workflows/   # GitHub Actions
└── dist/               # 编译输出
```

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/webywz/breathing-github-profile.git
cd breathing-github-profile

# 安装依赖
npm install

# 构建项目
npm run build

# 运行测试
npm test

# 代码检查
npm run lint

# 开发模式（监听文件变化）
npm run dev
```

### 运行示例

```bash
# 使用示例配置生成 README
npm run generate -- -c examples/webywz.yml -o examples/README.md

# 刷新 README
npm run refresh -- -c examples/webywz.yml -r examples/README.md
```

## 🧪 测试

项目包含完善的测试套件：

- ✅ 配置验证测试
- ✅ 标记完整性测试
- ✅ README 生成快照测试
- ✅ GitHub API 集成测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm test -- --coverage
```

## 📝 作为库使用

```typescript
import { loadConfig, GitHubClient, ReadmeGenerator } from 'breathing-github-profile';

// 加载配置
const config = loadConfig('config.yml');

// 获取 GitHub 数据
const client = new GitHubClient(process.env.GITHUB_TOKEN);
const data = await client.getProfileData(config.username);

// 生成 README
const generator = new ReadmeGenerator(config, data);
const readme = generator.generate();

console.log(readme);
```

## 🌟 实际使用案例

- [webywz/webywz](https://github.com/webywz/webywz) - 作者的 Profile README

> 💡 如果你使用了这个项目，欢迎提交 PR 添加到这里！

## ❓ 常见问题

### 如何提高 API 速率限制？

设置 `GITHUB_TOKEN` 环境变量：

```bash
export GITHUB_TOKEN=your_github_token
```

在 GitHub Actions 中会自动使用 `secrets.GITHUB_TOKEN`。

### 如何只更新部分内容？

使用 `refresh` 命令而不是 `generate`，它只会更新标记部分，保留其他自定义内容。

### 标记不生效？

确保标记格式正确：

```markdown
<!--MARKER:START-->
内容
<!--MARKER:END-->
```

标记名称必须与配置中的 `marker` 字段一致。

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)（待添加）了解详情。

1. Fork 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的改动 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 📄 许可证

[MIT](LICENSE) © webywz

---

## 🌍 English

### Overview

A reusable "living GitHub profile README" generator that others can fork. It provides both CLI and library interfaces to generate polished README files with automatic refresh capabilities.

### Features

- Declarative YAML/JSON configuration
- Smart marker-based content updates
- Rich GitHub statistics and insights
- Customizable sections and styles
- GitHub Actions automation
- Comprehensive test coverage
- Dual-mode: CLI + Library

> **Note:** This package is not published to the npm registry yet. Install from this GitHub repository for now — `npm install breathing-github-profile` will fail with Not found.

### Quick Start

Clone and build (recommended):

```bash
git clone https://github.com/webywz/breathing-github-profile.git
cd breathing-github-profile
npm install
npm run build
npx breathing-profile generate -c config.yml
```

Or install from GitHub:

```bash
npm install github:webywz/breathing-github-profile
npx breathing-profile generate -c config.yml
```

### Documentation

See the Chinese documentation above for detailed configuration options and usage examples.

### License

MIT © webywz
