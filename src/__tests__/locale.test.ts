import { existsSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  BilingualError,
  UsageError,
  cliText,
  errorText,
  parseLocale
} from '../locale';
import { expectExit, runCli as spawnCli } from './run-cli';

function runCli(
  args: string[],
  cwd: string
): { stdout: string; stderr: string; exitCode: number } {
  return spawnCli(args, cwd, { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' });
}

describe('parseLocale / cliText', () => {
  it('accepts en and zh', () => {
    expect(parseLocale('en')).toBe('en');
    expect(parseLocale('zh')).toBe('zh');
  });

  it('rejects omitted/empty/invalid values with UsageError', () => {
    expect(() => parseLocale(undefined)).toThrow(UsageError);
    expect(() => parseLocale('')).toThrow(UsageError);
    expect(() => parseLocale('fr')).toThrow(UsageError);
    expect(() => parseLocale('EN')).toThrow(/Invalid --locale/);
    try {
      parseLocale('ja');
    } catch (err) {
      expect(err).toBeInstanceOf(UsageError);
      expect((err as Error).name).toBe('UsageError');
    }
  });

  it('omitted locale keeps bilingual text', () => {
    expect(cliText(undefined, {
      both: 'Config valid / 配置文件有效',
      en: 'Config valid',
      zh: '配置文件有效'
    })).toBe('Config valid / 配置文件有效');
  });

  it('en/zh pick a single language', () => {
    const parts = {
      both: 'Config valid / 配置文件有效',
      en: 'Config valid',
      zh: '配置文件有效'
    };
    expect(cliText('en', parts)).toBe('Config valid');
    expect(cliText('zh', parts)).toBe('配置文件有效');
  });

  it('BilingualError.message stays bilingual; format() is locale-aware', () => {
    const err = new BilingualError(
      'Config not found / 配置文件不存在: x.yml',
      'Config not found: x.yml',
      '配置文件不存在: x.yml'
    );
    expect(err.message).toBe('Config not found / 配置文件不存在: x.yml');
    expect(errorText(err)).toBe('Config not found / 配置文件不存在: x.yml');
    expect(errorText(err, 'en')).toBe('Config not found: x.yml');
    expect(errorText(err, 'zh')).toBe('配置文件不存在: x.yml');
  });
});

describe('--locale flag', () => {
  let testDir: string;
  let testConfigPath: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'breathing-locale-test-'));
    testConfigPath = join(testDir, 'config.yml');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('help', () => {
    it('lists --locale en|zh', () => {
      const result = runCli(['--help'], testDir);
      expectExit(result, 0);
      expect(result.stdout).toMatch(/--locale/);
      expect(result.stdout).toMatch(/en\|zh/);
    });
  });

  describe('init', () => {
    it('omitted --locale keeps bilingual success text', () => {
      const result = runCli(['init', '-o', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Config created');
      expect(result.stdout).toContain('配置文件已创建');
      expect(result.stdout).toContain('Next steps / 后续步骤');
    });

    it('--locale en is English only', () => {
      const result = runCli(['init', '--locale', 'en', '-o', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Config created');
      expect(result.stdout).toContain('Next steps');
      expect(result.stdout).not.toContain('配置文件已创建');
      expect(result.stdout).not.toContain('后续步骤');
      expect(result.stdout).not.toContain('编辑');
    });

    it('--locale zh is Chinese only', () => {
      const result = runCli(['init', '--locale', 'zh', '-o', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('配置文件已创建');
      expect(result.stdout).toContain('后续步骤');
      expect(result.stdout).not.toContain('Config created');
      expect(result.stdout).not.toContain('Next steps');
    });

    it('invalid --locale is a usage error with non-zero exit', () => {
      const result = runCli(['init', '--locale', 'fr', '-o', testConfigPath], testDir);
      expect(result.exitCode).not.toBe(0);
      const combined = result.stdout + result.stderr;
      expect(combined).toMatch(/Invalid --locale|en or zh/);
      expect(existsSync(testConfigPath)).toBe(false);
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      writeFileSync(
        testConfigPath,
        `
username: testuser
intro:
  zh: 测试
  en: Test
`,
        'utf-8'
      );
    });

    it('omitted --locale keeps bilingual success text', () => {
      const result = runCli(['validate', '-c', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Config valid');
      expect(result.stdout).toContain('配置文件有效');
      expect(result.stdout).toContain('Config / 配置内容');
    });

    it('--locale en is English only', () => {
      const result = runCli(['validate', '--locale', 'en', '-c', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Config valid');
      expect(result.stdout).not.toContain('配置文件有效');
      expect(result.stdout).not.toContain('配置内容');
    });

    it('--locale zh is Chinese only', () => {
      const result = runCli(['validate', '--locale', 'zh', '-c', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('配置文件有效');
      expect(result.stdout).not.toContain('Config valid');
      expect(result.stdout).not.toContain('Config /');
    });

    it('global --locale zh works before the command', () => {
      const result = runCli(['--locale', 'zh', 'validate', '-c', testConfigPath], testDir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('配置文件有效');
      expect(result.stdout).not.toContain('Config valid');
    });

    it('missing config with --locale en is English-only human error', () => {
      const result = runCli(
        ['validate', '--locale', 'en', '-c', '/nonexistent/config.yml'],
        testDir
      );
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid config');
      expect(result.stderr).toContain('Config not found');
      expect(result.stderr).not.toContain('配置无效');
      expect(result.stderr).not.toContain('配置文件不存在');
    });

    it('missing config with --locale zh is Chinese-only human error', () => {
      const result = runCli(
        ['validate', '--locale', 'zh', '-c', '/nonexistent/config.yml'],
        testDir
      );
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('配置无效');
      expect(result.stderr).toContain('配置文件不存在');
      expect(result.stderr).not.toContain('Invalid config');
      expect(result.stderr).not.toContain('Config not found');
    });
  });

  describe('--json unaffected', () => {
    it('validate --json keys/shape stay the same with --locale zh', () => {
      writeFileSync(
        testConfigPath,
        `
username: jsonuser
intro:
  zh: JSON 测试
  en: JSON test
`,
        'utf-8'
      );

      const omitted = runCli(['validate', '--json', '-c', testConfigPath], testDir);
      const zh = runCli(
        ['validate', '--json', '--locale', 'zh', '-c', testConfigPath],
        testDir
      );
      const en = runCli(
        ['validate', '--json', '--locale', 'en', '-c', testConfigPath],
        testDir
      );

      expect(omitted.exitCode).toBe(0);
      expect(zh.exitCode).toBe(0);
      expect(en.exitCode).toBe(0);

      const omittedJson = JSON.parse(omitted.stdout);
      const zhJson = JSON.parse(zh.stdout);
      const enJson = JSON.parse(en.stdout);

      expect(Object.keys(omittedJson).sort()).toEqual(['config', 'ok']);
      expect(Object.keys(zhJson).sort()).toEqual(['config', 'ok']);
      expect(Object.keys(enJson).sort()).toEqual(['config', 'ok']);
      expect(zhJson).toEqual(omittedJson);
      expect(enJson).toEqual(omittedJson);
      expect(zh.stdout).not.toContain('配置文件有效');
      expect(en.stdout).not.toContain('Config valid');
    });

    it('validate --json error string stays bilingual regardless of --locale', () => {
      const omitted = runCli(
        ['validate', '--json', '-c', '/nonexistent/config.yml'],
        testDir
      );
      const zh = runCli(
        ['validate', '--json', '--locale', 'zh', '-c', '/nonexistent/config.yml'],
        testDir
      );
      const en = runCli(
        ['validate', '--json', '--locale', 'en', '-c', '/nonexistent/config.yml'],
        testDir
      );

      expect(omitted.exitCode).toBe(1);
      expect(zh.exitCode).toBe(1);
      expect(en.exitCode).toBe(1);

      const omittedJson = JSON.parse(omitted.stdout);
      const zhJson = JSON.parse(zh.stdout);
      const enJson = JSON.parse(en.stdout);

      expect(omittedJson).toEqual({
        ok: false,
        error: 'Config not found / 配置文件不存在: /nonexistent/config.yml'
      });
      expect(zhJson).toEqual(omittedJson);
      expect(enJson).toEqual(omittedJson);
    });

    it('init --json success shape is unchanged with --locale', () => {
      const omitted = runCli(['init', '--json', '-o', join(testDir, 'a.yml')], testDir);
      const zh = runCli(
        ['init', '--json', '--locale', 'zh', '-o', join(testDir, 'b.yml')],
        testDir
      );

      expect(omitted.exitCode).toBe(0);
      expect(zh.exitCode).toBe(0);

      const omittedJson = JSON.parse(omitted.stdout);
      const zhJson = JSON.parse(zh.stdout);
      expect(Object.keys(omittedJson).sort()).toEqual(['action', 'ok', 'path']);
      expect(Object.keys(zhJson).sort()).toEqual(['action', 'ok', 'path']);
      expect(omittedJson.ok).toBe(true);
      expect(zhJson.ok).toBe(true);
      expect(omittedJson.action).toBe('created');
      expect(zhJson.action).toBe('created');
    });
  });

  describe('generate / refresh', () => {
    beforeEach(() => {
      writeFileSync(
        testConfigPath,
        `
username: octocat
intro:
  zh: 测试
  en: Test
sections:
  - type: stats
    marker: STATS
`,
        'utf-8'
      );
    });

    it('generate omitted locale is bilingual', () => {
      const result = runCli(
        ['generate', '-c', testConfigPath, '-o', join(testDir, 'README.md')],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('README written');
      expect(result.stdout).toContain('已生成');
      expect(result.stdout).toContain('Data saved');
      expect(result.stdout).toContain('数据已保存');
    });

    it('generate --locale en is English only', () => {
      const result = runCli(
        ['generate', '--locale', 'en', '-c', testConfigPath, '-o', join(testDir, 'README.md')],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('README written');
      expect(result.stdout).toContain('Data saved');
      expect(result.stdout).not.toContain('已生成');
      expect(result.stdout).not.toContain('数据已保存');
    });

    it('generate --locale zh is Chinese only', () => {
      const result = runCli(
        ['generate', '--locale', 'zh', '-c', testConfigPath, '-o', join(testDir, 'README.md')],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('已生成');
      expect(result.stdout).toContain('数据已保存');
      expect(result.stdout).not.toContain('README written');
      expect(result.stdout).not.toContain('Data saved');
    });

    it('generate --json keys are unchanged with --locale zh', () => {
      const omitted = runCli(
        ['generate', '--json', '-c', testConfigPath, '-o', 'README.md'],
        testDir
      );
      const zhDir = mkdtempSync(join(tmpdir(), 'breathing-locale-gen-zh-'));
      writeFileSync(join(zhDir, 'config.yml'), `
username: octocat
intro:
  zh: 测试
  en: Test
`, 'utf-8');
      const zh = runCli(
        ['generate', '--json', '--locale', 'zh', '-c', 'config.yml', '-o', 'README.md'],
        zhDir
      );

      expect(omitted.exitCode).toBe(0);
      expect(zh.exitCode).toBe(0);
      const omittedJson = JSON.parse(omitted.stdout);
      const zhJson = JSON.parse(zh.stdout);
      expect(Object.keys(omittedJson).sort()).toEqual(
        ['bytes', 'config', 'ok', 'output', 'sections', 'username'].sort()
      );
      expect(Object.keys(zhJson).sort()).toEqual(Object.keys(omittedJson).sort());
      expect(zhJson.ok).toBe(true);
      expect(zh.stdout).not.toContain('已生成');
      rmSync(zhDir, { recursive: true, force: true });
    });

    it('refresh --locale zh is Chinese only', () => {
      const readmePath = join(testDir, 'README.md');
      writeFileSync(
        readmePath,
        `# Profile\n\n<!--STATS:START-->\nold\n<!--STATS:END-->\n`,
        'utf-8'
      );
      const result = runCli(
        ['refresh', '--locale', 'zh', '-c', testConfigPath, '-r', readmePath],
        testDir
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('已刷新');
      expect(result.stdout).toContain('数据已保存');
      expect(result.stdout).not.toContain('README refreshed');
      expect(result.stdout).not.toContain('Data saved');
    });
  });
});
