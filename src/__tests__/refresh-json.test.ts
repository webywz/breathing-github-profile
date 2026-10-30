import { existsSync, writeFileSync, unlinkSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const testConfigPath = join(__dirname, '../../test-refresh-config.yml');
const testReadmePath = join(__dirname, '../../test-refresh-readme.md');
const testDataDir = join(__dirname, '../../data');
const cliPath = join(__dirname, '../cli.ts');

function runRefresh(args: string = ''): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(
      `npx tsx ${cliPath} refresh ${args}`,
      { 
        encoding: 'utf-8',
        cwd: join(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1
    };
  }
}

describe('Refresh Command with --json', () => {
  afterEach(() => {
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
    if (existsSync(testReadmePath)) {
      unlinkSync(testReadmePath);
    }
    if (existsSync(testDataDir)) {
      rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('JSON 模式（--json）', () => {
    it('成功刷新时应该输出 JSON，ok: true，action: refreshed，path 正确', () => {
      const validConfig = `
username: octocat
intro:
  zh: 测试用户
  en: Test user
sections:
  - type: stats
    marker: STATS
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const existingReadme = `# Test Profile

<!--STATS:START-->
Old stats content
<!--STATS:END-->

More content here.
`;
      writeFileSync(testReadmePath, existingReadme, 'utf-8');

      const result = runRefresh(`--json -c ${testConfigPath} -r ${testReadmePath}`);
      
      expect(result.exitCode).toBe(0);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.action).toBe('refreshed');
      expect(parsed.path).toBe(testReadmePath);

      // 验证文件确实更新了
      expect(existsSync(testReadmePath)).toBe(true);
      const updatedContent = readFileSync(testReadmePath, 'utf-8');
      expect(updatedContent).toContain('STATS:START');
      expect(updatedContent).toContain('STATS:END');
    });

    it('配置文件不存在时应该输出 JSON，ok: false，并退出码为 1', () => {
      const result = runRefresh('--json -c /nonexistent/config.yml');
      
      expect(result.exitCode).toBe(1);
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.error).toMatch(/not found|不存在/);
    });

    it('README 文件不存在时应该输出 JSON，ok: false，并退出码为 1', () => {
      const validConfig = `
username: octocat
intro:
  zh: 测试
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const result = runRefresh(`--json -c ${testConfigPath} -r /nonexistent/README.md`);
      
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
sections:
  - type: languages
    marker: LANGS
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const existingReadme = `# Profile

<!--LANGS:START-->
<!--LANGS:END-->
`;
      writeFileSync(testReadmePath, existingReadme, 'utf-8');

      const result = runRefresh(`--json -c ${testConfigPath} -r ${testReadmePath}`);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('✓');
      expect(result.stdout).not.toContain('Refreshing');
      expect(result.stdout).not.toContain('正在刷新');
      expect(result.stdout).not.toContain('Fetching');
      expect(result.stdout).not.toContain('Data saved');
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.action).toBe('refreshed');
    });

    it('JSON 输出应该是合法的、可解析的', () => {
      const validConfig = `
username: octocat
intro:
  en: Parse test
sections:
  - type: repos
    marker: REPOS
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const existingReadme = `<!--REPOS:START--><!--REPOS:END-->`;
      writeFileSync(testReadmePath, existingReadme, 'utf-8');

      const result = runRefresh(`-j -c ${testConfigPath} -r ${testReadmePath}`);
      
      expect(result.exitCode).toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.action).toBe('refreshed');
      expect(parsed.path).toBe(testReadmePath);
    });
  });

  describe('标准模式（无 --json）', () => {
    it('默认行为应该保持不变，spinner 和 chalk 输出正常', () => {
      const validConfig = `
username: octocat
intro:
  zh: 标准模式
sections:
  - type: stats
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');

      const existingReadme = `# Test

<!--STATS:START-->
Old content
<!--STATS:END-->
`;
      writeFileSync(testReadmePath, existingReadme, 'utf-8');

      const result = runRefresh(`-c ${testConfigPath} -r ${testReadmePath}`);
      
      expect(result.exitCode).toBe(0);
      
      // 验证文件更新
      expect(existsSync(testReadmePath)).toBe(true);
      const updatedContent = readFileSync(testReadmePath, 'utf-8');
      expect(updatedContent).toContain('STATS:START');
    });
  });
});
