import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { runCli, splitArgs } from './run-cli';

const testConfigPath = join(__dirname, '../../test-validate-config.yml');
const repoRoot = join(__dirname, '../..');

function runValidate(args: string = ''): { stdout: string; stderr: string; exitCode: number } {
  return runCli(['validate', ...splitArgs(args)], repoRoot);
}

describe('Validate Command', () => {
  afterEach(() => {
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('标准模式（无 --json）', () => {
    it('应该验证有效配置并输出中英文提示', () => {
      const validConfig = `
username: testuser
intro:
  zh: 测试用户
  en: Test user
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const result = runValidate(`-c ${testConfigPath}`);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Config valid');
      expect(result.stdout).toContain('配置文件有效');
      expect(result.stdout).toContain('testuser');
    });

    it('配置无效时应该输出错误并退出码为 1', () => {
      const invalidConfig = `
username: testuser
# 缺少 intro 字段
`;
      writeFileSync(testConfigPath, invalidConfig, 'utf-8');

      const result = runValidate(`-c ${testConfigPath}`);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid config');
      expect(result.stderr).toContain('配置无效');
    });

    it('配置文件不存在时应该报错', () => {
      const result = runValidate('-c /nonexistent/config.yml');
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/not found|不存在/);
    });
  });

  describe('JSON 模式（--json）', () => {
    it('有效配置应该输出 JSON，ok: true', () => {
      const validConfig = `
username: jsonuser
intro:
  zh: JSON 测试
  en: JSON test
featuredRepos:
  - repo1
  - repo2
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const result = runValidate(`--json -c ${testConfigPath}`);
      
      expect(result.exitCode).toBe(0);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.config).toBeDefined();
      expect(parsed.config.username).toBe('jsonuser');
      expect(parsed.config.intro.zh).toBe('JSON 测试');
      expect(parsed.config.featuredRepos).toEqual(['repo1', 'repo2']);
    });

    it('无效配置应该输出 JSON，ok: false，并退出码为 1', () => {
      const invalidConfig = `
username: baduser
intro: {}
# intro 没有 zh 或 en
`;
      writeFileSync(testConfigPath, invalidConfig, 'utf-8');

      const result = runValidate(`--json -c ${testConfigPath}`);
      
      expect(result.exitCode).toBe(1);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.error).toBeDefined();
      expect(typeof parsed.error).toBe('string');
      expect(parsed.error.length).toBeGreaterThan(0);
    });

    it('配置文件不存在时应该输出 JSON，ok: false，并退出码为 1', () => {
      const result = runValidate('--json -c /nonexistent/file.yml');
      
      expect(result.exitCode).toBe(1);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.error).toMatch(/not found|不存在/);
    });

    it('JSON 输出应该是合法的、可解析的', () => {
      const validConfig = `
username: parsetest
intro:
  en: Parse test
sections:
  - type: stats
    marker: STATS
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const result = runValidate('-j -c ' + testConfigPath);
      
      expect(result.exitCode).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.config.sections).toBeDefined();
      expect(parsed.config.sections[0].type).toBe('stats');
    });

    it('JSON 模式下不应该输出 chalk 彩色文本', () => {
      const validConfig = `
username: nochalk
intro:
  zh: 无颜色
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const result = runValidate('--json -c ' + testConfigPath);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('✓');
      expect(result.stdout).not.toContain('Config valid');
      expect(result.stdout).not.toContain('配置文件有效');
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
    });
  });
});
