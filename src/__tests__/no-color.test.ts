import { existsSync, writeFileSync, readFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { runCli } from './run-cli';

function runCommand(
  command: string,
  args: string = '',
  env: Record<string, string> = {}
): { stdout: string; stderr: string; exitCode: number } {
  // Force TTY-like color behavior for testing --no-color flag.
  // Clear NO_COLOR by default (tests that need it pass it explicitly).
  const testEnv: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: '1', ...env };
  if (env.NO_COLOR === undefined) {
    delete testEnv.NO_COLOR;
  }

  return runCli(
    [command, ...args.trim().split(/\s+/).filter(Boolean)],
    join(__dirname, '../..'),
    testEnv
  );
}

function hasAnsiCodes(text: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /\x1b\[[0-9;?]*[A-Za-z]/.test(text);
}

describe('--no-color flag', () => {
  let testDir: string;
  let testConfigPath: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'breathing-no-color-test-'));
    testConfigPath = join(testDir, 'config.yml');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('init command', () => {
    it('默认应该有彩色输出（有 ANSI 码）', () => {
      const result = runCommand('init', `-o ${testConfigPath}`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout)).toBe(true);
      expect(result.stdout).toContain('Config created');
    });

    it('--no-color 应该禁用彩色输出', () => {
      const result = runCommand('init', `-o ${testConfigPath} --no-color`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
      expect(result.stdout).toContain('Config created');
    });

    it('NO_COLOR=1 应该禁用彩色输出', () => {
      const result = runCommand('init', `-o ${testConfigPath}`, { NO_COLOR: '1' });
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
      expect(result.stdout).toContain('Config created');
    });

    it('--json 应该始终输出纯 JSON 无 ANSI', () => {
      const result = runCommand('init', `--json -o ${testConfigPath}`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout)).toBe(false);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    });
  });

  describe('validate command', () => {
    beforeEach(() => {
      const validConfig = `
username: testuser
intro:
  zh: 测试
  en: Test
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');
    });

    it('默认应该有彩色输出（有 ANSI 码）', () => {
      const result = runCommand('validate', `-c ${testConfigPath}`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout)).toBe(true);
      expect(result.stdout).toContain('Config valid');
    });

    it('--no-color 应该禁用彩色输出', () => {
      const result = runCommand('validate', `-c ${testConfigPath} --no-color`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
      expect(result.stdout).toContain('Config valid');
    });

    it('NO_COLOR=1 应该禁用彩色输出', () => {
      const result = runCommand('validate', `-c ${testConfigPath}`, { NO_COLOR: '1' });
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
      expect(result.stdout).toContain('Config valid');
    });
  });

  describe('generate command', () => {
    beforeEach(() => {
      const validConfig = `
username: octocat
intro:
  zh: 测试
  en: Test
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');
    });

    it('默认应该有彩色输出（有 ANSI 码）', () => {
      const outputPath = join(testDir, 'README.md');
      const result = runCommand('generate', `-c ${testConfigPath} -o ${outputPath}`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout)).toBe(true);
      expect(result.stdout).toContain('Data saved');
    });

    it('--no-color 应该禁用彩色输出', () => {
      const outputPath = join(testDir, 'README.md');
      const result = runCommand('generate', `-c ${testConfigPath} -o ${outputPath} --no-color`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout)).toBe(false);
      expect(hasAnsiCodes(result.stderr)).toBe(false);
      expect(result.stdout).toContain('Data saved');
    });

    it('NO_COLOR=1 应该禁用彩色输出', () => {
      const outputPath = join(testDir, 'README.md');
      const result = runCommand('generate', `-c ${testConfigPath} -o ${outputPath}`, { NO_COLOR: '1' });
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
      expect(result.stdout).toContain('Data saved');
    });

    it('FORCE_COLOR=1 + --no-color 时 stdout/stderr 都不应有 ANSI（含 ora）', () => {
      const outputPath = join(testDir, 'README.md');
      const result = runCommand(
        'generate',
        `-c ${testConfigPath} -o ${outputPath} --no-color`,
        { FORCE_COLOR: '1' }
      );

      expect(result.exitCode).toBe(0);
      expect(existsSync(outputPath)).toBe(true);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
    });

    it('--json 应该始终输出纯 JSON 无 ANSI', () => {
      const outputPath = join(testDir, 'README.md');
      const result = runCommand('generate', `--json -c ${testConfigPath} -o ${outputPath}`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout)).toBe(false);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.ok).toBe(true);
    });

    it('--html --no-color 的 HTML 与终端行都没有 ANSI', () => {
      const outputPath = join(testDir, 'README.md');
      const htmlPath = join(testDir, 'preview.html');
      const result = runCommand(
        'generate',
        `-c ${testConfigPath} -o ${outputPath} --html ${htmlPath} --no-color`
      );

      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
      expect(result.stdout).toContain('Data saved');
      expect(existsSync(htmlPath)).toBe(true);
      expect(hasAnsiCodes(readFileSync(htmlPath, 'utf-8'))).toBe(false);
    });

    it('--html --theme fog --no-color 的 HTML 与终端行都没有 ANSI', () => {
      const outputPath = join(testDir, 'README.md');
      const htmlPath = join(testDir, 'fog.html');
      const result = runCommand(
        'generate',
        `-c ${testConfigPath} -o ${outputPath} --html ${htmlPath} --theme fog --no-color`
      );

      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
      expect(readFileSync(htmlPath, 'utf-8')).toContain('--bg: #e8eef4;');
      expect(hasAnsiCodes(readFileSync(htmlPath, 'utf-8'))).toBe(false);
    });
  });

  describe('refresh command', () => {
    let readmePath: string;

    beforeEach(() => {
      const validConfig = `
username: octocat
intro:
  zh: 测试
  en: Test
sections:
  - type: stats
    marker: STATS
`;
      writeFileSync(testConfigPath, validConfig, 'utf-8');
      
      readmePath = join(testDir, 'README.md');
      const readmeContent = `# Profile

<!--STATS:START-->
old content
<!--STATS:END-->
`;
      writeFileSync(readmePath, readmeContent, 'utf-8');
    });

    it('默认应该有彩色输出（有 ANSI 码）', () => {
      const result = runCommand('refresh', `-c ${testConfigPath} -r ${readmePath}`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout)).toBe(true);
      expect(result.stdout).toContain('Data saved');
    });

    it('--no-color 应该禁用彩色输出', () => {
      const result = runCommand('refresh', `-c ${testConfigPath} -r ${readmePath} --no-color`);
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout)).toBe(false);
      expect(hasAnsiCodes(result.stderr)).toBe(false);
      expect(result.stdout).toContain('Data saved');
    });

    it('NO_COLOR=1 应该禁用彩色输出', () => {
      const result = runCommand('refresh', `-c ${testConfigPath} -r ${readmePath}`, { NO_COLOR: '1' });
      
      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
      expect(result.stdout).toContain('Data saved');
    });

    it('FORCE_COLOR=1 + --no-color 时 stdout/stderr 都不应有 ANSI（含 ora）', () => {
      const result = runCommand(
        'refresh',
        `-c ${testConfigPath} -r ${readmePath} --no-color`,
        { FORCE_COLOR: '1' }
      );

      expect(result.exitCode).toBe(0);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
    });

    it('--html --no-color 的 HTML stdout 没有 ANSI', () => {
      const result = runCommand(
        'refresh',
        `-c ${testConfigPath} -r ${readmePath} --html --no-color`
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/<!DOCTYPE html>/i);
      expect(hasAnsiCodes(result.stdout + result.stderr)).toBe(false);
    });
  });
});
