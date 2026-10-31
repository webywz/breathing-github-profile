import { existsSync, writeFileSync, readFileSync, rmSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { expectExit, runCli, splitArgs } from './run-cli';

function runGenerate(args: string, testDir: string) {
  return runCli(['generate', ...splitArgs(args)], testDir);
}

function writeConfig(testDir: string): void {
  writeFileSync(
    join(testDir, 'config.yml'),
    `
username: octocat
intro:
  zh: 测试用户
  en: Test user
sections:
  - type: stats
    marker: STATS
  - type: languages
    marker: LANGUAGES
`,
    'utf-8'
  );
}

describe('Generate Command with --html', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'breathing-generate-html-'));
    writeConfig(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('omitted path writes HTML to stdout and still writes README', () => {
    const result = runGenerate('--html -c config.yml -o README.md', testDir);

    expectExit(result, 0);
    expect(result.stdout).toMatch(/<!DOCTYPE html>/i);
    expect(result.stdout).toContain('octocat');
    expect(result.stdout).toContain('STATS');
    expect(result.stdout).not.toContain('README written');
    expect(result.stdout).not.toContain('已生成');
    expect(result.stdout).not.toMatch(/cdn\.|unpkg|jsdelivr|googleapis/i);
    expect(existsSync(join(testDir, 'README.md'))).toBe(true);
    expect(existsSync(join(testDir, 'data', 'profile.json'))).toBe(true);
    expect(readFileSync(join(testDir, 'README.md'), 'utf-8')).toContain('octocat');
  });

  it('path writes HTML to that file and creates parent dirs', () => {
    const htmlPath = join(testDir, 'out', 'nested', 'preview.html');
    const result = runGenerate(
      `--html ${htmlPath} -c config.yml -o README.md`,
      testDir
    );

    expectExit(result, 0);
    expect(existsSync(htmlPath)).toBe(true);
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(html).toContain('octocat');
    expect(html).toContain('self-contained');
    expect(result.stdout).toContain('README written');
    expect(result.stdout).toContain('HTML preview');
    expect(result.stdout).not.toMatch(/<!DOCTYPE html>/i);
    expect(existsSync(join(testDir, 'README.md'))).toBe(true);
  });

  it('--html and --json is a usage error and does not write files', () => {
    const result = runGenerate('--html --json -c config.yml -o README.md', testDir);

    expect(result.exitCode).toBe(1);
    const combined = result.stdout + result.stderr;
    expect(combined).toMatch(/cannot be used together|不能同时使用/);
    expect(existsSync(join(testDir, 'README.md'))).toBe(false);
    expect(() => JSON.parse(result.stdout)).toThrow();
  });

  it('--theme fog restyles HTML chrome and leaves README unchanged', () => {
    const result = runGenerate('--html --theme fog -c config.yml -o README.md', testDir);

    expectExit(result, 0);
    expect(result.stdout).toMatch(/<!DOCTYPE html>/i);
    expect(result.stdout).toContain('--bg: #e8eef4;');
    expect(readFileSync(join(testDir, 'README.md'), 'utf-8')).toContain('octocat');
    expect(existsSync(join(testDir, 'data', 'profile.json'))).toBe(true);
  });

  it('--html --json with a path is still a usage error', () => {
    const result = runGenerate(
      '--json --html preview.html -c config.yml -o README.md',
      testDir
    );
    expect(result.exitCode).toBe(1);
    expect(existsSync(join(testDir, 'preview.html'))).toBe(false);
    expect(existsSync(join(testDir, 'README.md'))).toBe(false);
  });
});
