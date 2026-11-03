import { existsSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { expectExit, runCli } from './run-cli';
import { HTML_THEMES } from '../html';

describe('CLI --list-themes', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'breathing-list-themes-'));
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('prints HTML_THEMES names one per line', () => {
    const result = runCli(['--list-themes'], testDir);
    expectExit(result, 0);
    expect(result.stdout).toBe(`${HTML_THEMES.join('\n')}\n`);
    expect(result.stdout.trim().split('\n')).toEqual([...HTML_THEMES]);
  });

  it('prints a JSON array of HTML_THEMES with --list-themes --json', () => {
    const listed = runCli(['--list-themes', '--json'], testDir);
    const reversed = runCli(['--json', '--list-themes'], testDir);
    const shortJson = runCli(['--list-themes', '-j'], testDir);
    expectExit(listed, 0);
    expectExit(reversed, 0);
    expectExit(shortJson, 0);
    expect(JSON.parse(listed.stdout)).toEqual([...HTML_THEMES]);
    expect(JSON.parse(reversed.stdout)).toEqual([...HTML_THEMES]);
    expect(JSON.parse(shortJson.stdout)).toEqual([...HTML_THEMES]);
    expect(listed.stdout).toBe(`${JSON.stringify([...HTML_THEMES])}\n`);
  });

  it('does not require generate/refresh inputs or a config file', () => {
    const result = runCli(['--list-themes'], testDir);
    expectExit(result, 0);
    const combined = result.stdout + result.stderr;
    expect(combined).not.toMatch(/unknown option/i);
    expect(combined).not.toMatch(/Config not found|配置文件不存在/);
    expect(existsSync(join(testDir, 'config.yml'))).toBe(false);
    expect(existsSync(join(testDir, 'README.md'))).toBe(false);
  });

  it('lists themes even when placed after generate (no config required)', () => {
    const result = runCli(['generate', '--list-themes'], testDir);
    expectExit(result, 0);
    expect(result.stdout).toBe(`${HTML_THEMES.join('\n')}\n`);
    expect(existsSync(join(testDir, 'README.md'))).toBe(false);
  });

  it('documents --list-themes in help', () => {
    const root = runCli(['--help'], testDir);
    expectExit(root, 0);
    expect(root.stdout).toMatch(/--list-themes/);
    expect(root.stdout).toMatch(/JSON array|JSON 数组/);
  });
});
