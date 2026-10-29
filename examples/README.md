# 示例和演示

本目录包含使用 breathing-github-profile 的示例配置。

## 📄 webywz.yml

完整的配置示例，展示所有可用功能：

- ✅ 中英文双语介绍
- ✅ 精选仓库列表
- ✅ 多种章节类型（统计、语言、项目）
- ✅ 自定义内容（技术栈徽章）
- ✅ 样式配置

## 🚀 快速测试

### 1. 验证配置

```bash
npm run validate -- -c examples/webywz.yml
```

预期输出：
```
✓ 配置文件有效
```

### 2. 生成 README（演示模式）

```bash
# 生成到临时文件
npm run generate -- -c examples/webywz.yml -o examples/test-output.md
```

### 3. 测试刷新功能

```bash
# 首先生成一个 README
npm run generate -- -c examples/webywz.yml -o examples/demo.md

# 手动编辑 demo.md，在标记外添加自定义内容

# 刷新（只更新标记部分）
npm run refresh -- -c examples/webywz.yml -r examples/demo.md
```

你会发现自定义内容被保留，只有标记部分被更新！

## 📝 创建你自己的配置

1. 复制 `webywz.yml` 作为模板
2. 修改 `username` 为你的 GitHub 用户名
3. 更新 `intro` 中的介绍
4. 根据需要调整 `sections`
5. 运行 `npm run generate` 生成 README

## 🔧 配置选项参考

### 章节类型

#### stats
显示 GitHub 统计信息

```yaml
- type: stats
  marker: STATS
  title: 📊 我的统计
```

#### languages
显示编程语言分布

```yaml
- type: languages
  marker: LANGUAGES
  title: 💻 技术栈
```

#### repos
显示精选项目

```yaml
- type: repos
  marker: REPOS
  title: 🔥 热门项目
```

#### custom
自定义 Markdown 内容

```yaml
- type: custom
  marker: BADGES
  title: 🎯 技能徽章
  content: |
    ![TypeScript](https://img.shields.io/badge/-TypeScript-blue)
    ![React](https://img.shields.io/badge/-React-61DAFB)
```

## 💡 提示

1. **标记名称**: 确保每个章节的 `marker` 唯一
2. **GitHub Token**: 设置 `GITHUB_TOKEN` 环境变量以避免 API 速率限制
3. **精选仓库**: 使用 `featuredRepos` 手动选择要展示的项目
4. **自定义样式**: 在 `custom` 章节中使用 HTML 和 Markdown

## 🌟 实际案例

使用此工具的 Profile README：

- [webywz/webywz](https://github.com/webywz/webywz) - 配套的 profile 仓库

---

有问题？查看 [主文档](../README.md) 或提交 [issue](https://github.com/webywz/breathing-github-profile/issues)。
