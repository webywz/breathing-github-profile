import { existsSync, writeFileSync, readFileSync, rmSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { expectExit, runCli, splitArgs } from './run-cli';

function runRefresh(args: string, testDir: string) {
  return runCli(['refresh', ...splitArgs(args)], testDir);
}

function writeFixture(testDir: string): void {
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
`,
    'utf-8'
  );
  writeFileSync(
    join(testDir, 'README.md'),
    `# Test Profile

<!--STATS:START-->
Old stats content
<!--STATS:END-->

More content here.
`,
    'utf-8'
  );
}

describe('Refresh Command with --html', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'breathing-refresh-html-'));
    writeFixture(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('omitted path writes HTML to stdout and still refreshes README', () => {
    const result = runRefresh('--html -c config.yml -r README.md', testDir);

    expectExit(result, 0);
    expect(result.stdout).toMatch(/<!DOCTYPE html>/i);
    expect(result.stdout).toContain('octocat');
    expect(result.stdout).toContain('STATS');
    expect(result.stdout).not.toContain('README refreshed');
    expect(result.stdout).not.toContain('已刷新');
    expect(readFileSync(join(testDir, 'README.md'), 'utf-8')).toContain('STATS:START');
    expect(existsSync(join(testDir, 'data', 'profile.json'))).toBe(true);
  });

  it('path writes HTML to that file and creates parent dirs', () => {
    const htmlPath = join(testDir, 'reports', 'refresh.html');
    const result = runRefresh(
      `--html ${htmlPath} -c config.yml -r README.md`,
      testDir
    );

    expectExit(result, 0);
    expect(existsSync(htmlPath)).toBe(true);
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(html).toContain('octocat');
    expect(result.stdout).toContain('README refreshed');
    expect(result.stdout).toContain('HTML preview');
    expect(result.stdout).not.toMatch(/<!DOCTYPE html>/i);
  });

  it('--html and --json is a usage error and does not refresh', () => {
    const before = readFileSync(join(testDir, 'README.md'), 'utf-8');
    const result = runRefresh('--html --json -c config.yml -r README.md', testDir);

    expect(result.exitCode).toBe(1);
    const combined = result.stdout + result.stderr;
    expect(combined).toMatch(/cannot be used together|不能同时使用/);
    expect(readFileSync(join(testDir, 'README.md'), 'utf-8')).toBe(before);
    expect(existsSync(join(testDir, 'data', 'profile.json'))).toBe(false);
  });
});
