import { existsSync, writeFileSync, readFileSync, rmSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { expectExit, runCli, splitArgs } from './run-cli';

function runGenerate(args: string = '', testDir: string): { stdout: string; stderr: string; exitCode: number } {
  return runCli(['generate', ...splitArgs(args)], testDir);
}

function expectGenerateOk(result: { stdout: string; stderr: string; exitCode: number }): void {
  expectExit(result, 0);
}

describe('Generate Command with --json', () => {
  let testDir: string;
  let testConfigPath: string;
  let testOutputPath: string;
  let testDataDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'breathing-generate-test-'));
    testConfigPath = join(testDir, 'config.yml');
    testOutputPath = join(testDir, 'README.md');
    testDataDir = join(testDir, 'data');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('JSON 模式（--json）', () => {
    it('成功生成时应该输出 JSON，ok: true，并包含关键字段', () => {
      const validConfig = `
username: octocat
intro:
  zh: 测试用户
  en: Test user
sections:
  - type: stats
    marker: STATS
  - type: languages
    marker: LANGUAGES
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const result = runGenerate(`--json -c config.yml -o README.md`, testDir);
      
      expectGenerateOk(result);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.output).toBe('README.md');
      expect(parsed.config).toBe('config.yml');
      expect(parsed.username).toBe('octocat');
      expect(typeof parsed.bytes).toBe('number');
      expect(parsed.bytes).toBeGreaterThan(0);
      expect(parsed.sections).toBe(2);

      // 验证文件确实生成了
      expect(existsSync(testOutputPath)).toBe(true);
      expect(existsSync(join(testDataDir, 'profile.json'))).toBe(true);
    });

    it('失败时应该输出 JSON，ok: false，并退出码为 1', () => {
      const invalidConfig = `
username: octocat
intro: {}
`;
      writeFileSync(testConfigPath, invalidConfig, 'utf-8');

      const result = runGenerate(`--json -c config.yml -o README.md`, testDir);
      
      expect(result.exitCode).toBe(1);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.error).toBeDefined();
      expect(typeof parsed.error).toBe('string');
      expect(parsed.error.length).toBeGreaterThan(0);
    });

    it('配置文件不存在时应该输出 JSON，ok: false', () => {
      const result = runGenerate('--json -c /nonexistent/config.yml', testDir);
      
      expect(result.exitCode).toBe(1);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.error).toMatch(/not found|不存在/);
    });

    it('JSON 模式下不应该输出 spinner 或 chalk 文本', () => {
      const validConfig = `
username: octocat
intro:
  zh: 无 spinner
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const result = runGenerate(`--json -c config.yml -o README.md`, testDir);
      
      expectGenerateOk(result);
      expect(result.stdout).not.toContain('✓');
      expect(result.stdout).not.toContain('Generating');
      expect(result.stdout).not.toContain('正在生成');
      expect(result.stdout).not.toContain('Fetching');
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
    });

    it('sections 为空时应该返回 0', () => {
      const configNoSections = `
username: octocat
intro:
  zh: 无章节配置
`;
      writeFileSync(testConfigPath, configNoSections, 'utf-8');

      const result = runGenerate(`-j -c config.yml -o README.md`, testDir);
      
      expectGenerateOk(result);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.sections).toBe(0);
    });

    it('JSON 输出应该是合法的、可解析的', () => {
      const validConfig = `
username: octocat
intro:
  en: Parse test
sections:
  - type: stats
  - type: repos
  - type: languages
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const result = runGenerate('-j -c config.yml -o README.md', testDir);
      
      expectGenerateOk(result);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.sections).toBe(3);
    });
  });

  describe('标准模式（无 --json）', () => {
    it('默认行为应该保持不变，文件应该正常生成', () => {
      const validConfig = `
username: octocat
intro:
  zh: 标准模式
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const result = runGenerate(`-c config.yml -o README.md`, testDir);
      
      expectGenerateOk(result);
      
      // 验证文件生成
      expect(existsSync(testOutputPath)).toBe(true);
      const content = readFileSync(testOutputPath, 'utf-8');
      expect(content).toContain('octocat');
      expect(existsSync(join(testDataDir, 'profile.json'))).toBe(true);
    });
  });
});
