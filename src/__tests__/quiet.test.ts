import { existsSync, writeFileSync, mkdtempSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { expectExit, runCli as spawnCli } from './run-cli';

function runCli(
  args: string[],
  cwd: string
): { stdout: string; stderr: string; exitCode: number } {
  return spawnCli(args, cwd, { ...process.env, FORCE_COLOR: '0' });
}

const HUMAN_SUCCESS = [
  '✓',
  'Config created',
  '配置文件已创建',
  'Next steps',
  'Config valid',
  '配置文件有效',
  'README written',
  '已生成',
  'README refreshed',
  '已刷新',
  'Data saved',
  '数据已保存',
  'Generating',
  '正在生成',
  'Refreshing',
  '正在刷新'
];

function expectNoHumanSuccess(output: string) {
  for (const phrase of HUMAN_SUCCESS) {
    expect(output).not.toContain(phrase);
  }
}

describe('--quiet flag', () => {
  let testDir: string;
  let testConfigPath: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'breathing-quiet-test-'));
    testConfigPath = join(testDir, 'config.yml');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('init', () => {
    it('默认输出成功摘要', () => {
      const result = runCli(['init', '-o', testConfigPath], testDir);
      expectExit(result, 0);
      expect(result.stdout).toContain('Config created');
      expect(existsSync(testConfigPath)).toBe(true);
    });

    it('--quiet 成功时不输出摘要，仍写入文件', () => {
      const result = runCli(['init', '--quiet', '-o', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('');
      expectNoHumanSuccess(result.stdout + result.stderr);
      expect(existsSync(testConfigPath)).toBe(true);
    });

    it('--json 不受 --quiet 影响，仍输出 JSON', () => {
      const result = runCli(['init', '--quiet', '--json', '-o', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.action).toBe('created');
    });

    it('--quiet 失败时仍将错误写到 stderr 并以非零退出', () => {
      writeFileSync(testConfigPath, 'existing', 'utf-8');
      const result = runCli(['init', '--quiet', '-o', testConfigPath], testDir);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/already exists|已存在/);
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      writeFileSync(
        testConfigPath,
        'username: octocat\nintro:\n  en: Test\n',
        'utf-8'
      );
    });

    it('默认输出成功摘要', () => {
      const result = runCli(['validate', '-c', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Config valid');
    });

    it('--quiet 成功时不输出摘要', () => {
      const result = runCli(['validate', '--quiet', '-c', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('');
      expectNoHumanSuccess(result.stdout + result.stderr);
    });

    it('全局 --quiet 同样生效', () => {
      const result = runCli(['--quiet', 'validate', '-c', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('');
    });

    it('--json --quiet 仍输出 JSON', () => {
      const result = runCli(['validate', '-q', '--json', '-c', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.config.username).toBe('octocat');
    });

    it('--quiet 失败时 stderr 有错误且退出码为 1', () => {
      const result = runCli(['validate', '--quiet', '-c', '/nonexistent/config.yml'], testDir);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/not found|不存在/);
    });
  });

  describe('generate', () => {
    beforeEach(() => {
      writeFileSync(
        testConfigPath,
        'username: octocat\nintro:\n  zh: 测试\n  en: Test\n',
        'utf-8'
      );
    });

    it('默认输出成功摘要', () => {
      const result = runCli(
        ['generate', '-c', testConfigPath, '-o', join(testDir, 'README.md')],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Data saved');
    });

    it('--quiet 成功时不输出 spinner/摘要，仍写入文件', () => {
      const outputPath = join(testDir, 'README.md');
      const result = runCli(
        ['generate', '--quiet', '-c', testConfigPath, '-o', outputPath],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('');
      expectNoHumanSuccess(result.stdout + result.stderr);
      expect(existsSync(outputPath)).toBe(true);
      expect(readFileSync(outputPath, 'utf-8')).toContain('octocat');
    });

    it('--json --quiet 仍输出 JSON', () => {
      const result = runCli(
        ['generate', '--json', '--quiet', '-c', testConfigPath, '-o', join(testDir, 'README.md')],
        testDir
      );
      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.username).toBe('octocat');
    });

    it('--quiet 失败时 stderr 有错误且退出码为 1', () => {
      const result = runCli(
        ['generate', '--quiet', '-c', '/nonexistent/config.yml'],
        testDir
      );
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/not found|不存在|Error/);
      expect(result.stdout.trim()).toBe('');
    });

    it('--html --quiet 仍输出 HTML 到 stdout，无成功摘要', () => {
      const result = runCli(
        ['generate', '--html', '--quiet', '-c', testConfigPath, '-o', join(testDir, 'README.md')],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/<!DOCTYPE html>/i);
      expectNoHumanSuccess(result.stdout + result.stderr);
      expect(existsSync(join(testDir, 'README.md'))).toBe(true);
    });

    it('--html --theme paper --quiet 仍输出 HTML，无成功摘要', () => {
      const result = runCli(
        ['generate', '--html', '--theme', 'paper', '--quiet', '-c', testConfigPath, '-o', join(testDir, 'README.md')],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/<!DOCTYPE html>/i);
      expect(result.stdout).toContain('--bg: #f6f0e4;');
      expectNoHumanSuccess(result.stdout + result.stderr);
    });

    it('--html path --quiet 写入文件且 stdout 为空', () => {
      const htmlPath = join(testDir, 'quiet.html');
      const result = runCli(
        ['generate', '--html', htmlPath, '--quiet', '-c', testConfigPath, '-o', join(testDir, 'README.md')],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('');
      expectNoHumanSuccess(result.stdout + result.stderr);
      expect(existsSync(htmlPath)).toBe(true);
      expect(readFileSync(htmlPath, 'utf-8')).toMatch(/<!DOCTYPE html>/i);
    });
  });

  describe('refresh', () => {
    let readmePath: string;

    beforeEach(() => {
      writeFileSync(
        testConfigPath,
        `username: octocat
intro:
  zh: 测试
  en: Test
sections:
  - type: stats
    marker: STATS
`,
        'utf-8'
      );
      readmePath = join(testDir, 'README.md');
      writeFileSync(
        readmePath,
        '# Profile\n\n<!--STATS:START-->\nold\n<!--STATS:END-->\n',
        'utf-8'
      );
    });

    it('默认输出成功摘要', () => {
      const result = runCli(
        ['refresh', '-c', testConfigPath, '-r', readmePath],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Data saved');
    });

    it('--quiet 成功时不输出 spinner/摘要，仍刷新文件', () => {
      const result = runCli(
        ['refresh', '--quiet', '-c', testConfigPath, '-r', readmePath],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('');
      expectNoHumanSuccess(result.stdout + result.stderr);
      expect(readFileSync(readmePath, 'utf-8')).toContain('STATS:START');
    });

    it('--json --quiet 仍输出 JSON', () => {
      const result = runCli(
        ['refresh', '--json', '-q', '-c', testConfigPath, '-r', readmePath],
        testDir
      );
      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.action).toBe('refreshed');
    });

    it('--quiet 失败时 stderr 有错误且退出码为 1', () => {
      const result = runCli(
        ['refresh', '--quiet', '-c', '/nonexistent/config.yml', '-r', readmePath],
        testDir
      );
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/not found|不存在|Error/);
    });

    it('--html --quiet 仍输出 HTML 到 stdout，无成功摘要', () => {
      const result = runCli(
        ['refresh', '--html', '--quiet', '-c', testConfigPath, '-r', readmePath],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/<!DOCTYPE html>/i);
      expectNoHumanSuccess(result.stdout + result.stderr);
    });
  });
});
