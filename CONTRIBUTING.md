# 贡献指南

感谢你考虑为 breathing-github-profile 做出贡献！

## 如何贡献

### 报告 Bug

如果你发现了 bug，请创建一个 issue 并包含以下信息：

- 清晰的标题和描述
- 重现步骤
- 预期行为和实际行为
- 你的环境信息（Node.js 版本、操作系统等）
- 相关的配置文件和错误日志

### 提出新特性

我们欢迎新的功能建议！请创建一个 issue 并：

- 描述你想要的功能
- 解释为什么这个功能有用
- 如果可能，提供实现思路

### 提交代码

1. **Fork 仓库**

2. **克隆到本地**
   ```bash
   git clone https://github.com/your-username/breathing-github-profile.git
   cd breathing-github-profile
   ```

3. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

5. **进行更改**
   - 遵循现有的代码风格
   - 添加必要的测试
   - 更新相关文档

6. **运行测试**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

7. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `test:` 测试相关
   - `refactor:` 代码重构
   - `style:` 代码格式
   - `chore:` 构建/工具相关

8. **推送到 GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **创建 Pull Request**
   - 提供清晰的 PR 描述
   - 关联相关的 issue
   - 确保 CI 检查通过

## 开发指南

### 项目结构

```
src/
├── types.ts          # TypeScript 类型定义
├── config.ts         # 配置文件解析和验证
├── github.ts         # GitHub API 客户端
├── generator.ts      # README 生成器
├── cli.ts           # 命令行界面
├── index.ts         # 库入口
└── __tests__/       # 测试文件
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 为新功能添加测试
- 保持测试覆盖率在 70% 以上
- 添加必要的类型注解
- 编写清晰的注释

### 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm test -- --coverage
```

### 本地测试 CLI

```bash
# 使用示例配置测试
npm run generate -- -c examples/webywz.yml -o test-output.md

# 测试刷新功能
npm run refresh -- -c examples/webywz.yml -r test-output.md
```

## 行为准则

- 尊重所有贡献者
- 友善和包容
- 专注于建设性的反馈
- 接受不同的观点

## 问题？

如有任何疑问，请：
- 创建 issue 讨论
- 查看现有的 issues 和 PRs

感谢你的贡献！🎉
