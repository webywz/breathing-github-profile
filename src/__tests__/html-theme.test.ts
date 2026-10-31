import { existsSync, writeFileSync, readFileSync, rmSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { expectExit, runCli, splitArgs } from './run-cli';
import { DEFAULT_HTML_THEME, HTML_THEMES, THEME_TOKENS } from '../html';
import { ReadmeGenerator } from '../generator';
import { ProfileConfig, ProfileData } from '../types';

function writeConfig(testDir: string, extra = ''): void {
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
${extra}
`,
    'utf-8'
  );
}

function writeReadme(testDir: string): void {
  writeFileSync(
    join(testDir, 'README.md'),
    `# Test Profile

<!--STATS:START-->
Old stats
<!--STATS:END-->
`,
    'utf-8'
  );
}

describe('CLI --theme HTML palette', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'breathing-html-theme-'));
    writeConfig(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('help lists HTML themes and marks them HTML-only', () => {
    const root = runCli(['--help'], testDir);
    const generate = runCli(['generate', '--help'], testDir);
    const refresh = runCli(['refresh', '--help'], testDir);
    expectExit(root, 0);
    expectExit(generate, 0);
    expectExit(refresh, 0);
    for (const result of [root, generate, refresh]) {
      expect(result.stdout).toMatch(/--theme/);
      expect(result.stdout).toMatch(/ember/);
      expect(result.stdout).toMatch(/fog/);
      expect(result.stdout).toMatch(/midnight/);
      expect(result.stdout).toMatch(/paper/);
      expect(result.stdout).toMatch(/HTML/);
    }
    expect(generate.stdout).toMatch(/not config theme|与配置 theme 无关/);
  });

  it('default HTML equals --theme ember', () => {
    const omitted = runCli(
      ['generate', '--html', '-c', 'config.yml', '-o', 'README.md'],
      testDir
    );
    const emberDir = mkdtempSync(join(tmpdir(), 'breathing-html-theme-ember-'));
    writeConfig(emberDir);
    const ember = runCli(
      ['generate', '--html', '--theme', 'ember', '-c', 'config.yml', '-o', 'README.md'],
      emberDir
    );
    expectExit(omitted, 0);
    expectExit(ember, 0);
    const rootRe = /:root \{[\s\S]*?\}/;
    expect(omitted.stdout.match(rootRe)?.[0]).toBe(ember.stdout.match(rootRe)?.[0]);
    expect(omitted.stdout).toContain(`--bg: ${THEME_TOKENS.ember['--bg']};`);
    expect(omitted.stdout).toContain('border-color: #24582d;');
    expect(ember.stdout).toContain('border-color: #24582d;');
    expect(omitted.stdout).not.toContain('var(--accent-border)');
    expect(ember.stdout).not.toContain('var(--accent-border)');
    expect(DEFAULT_HTML_THEME).toBe('ember');
    rmSync(emberDir, { recursive: true, force: true });
  });

  it('applies each --theme palette and keeps them distinct', () => {
    const seen = new Set<string>();
    for (const name of HTML_THEMES) {
      const dir = mkdtempSync(join(tmpdir(), `breathing-html-theme-${name}-`));
      writeConfig(dir);
      const result = runCli(
        ['generate', '--html', '--theme', name, '-c', 'config.yml', '-o', 'README.md'],
        dir
      );
      expectExit(result, 0);
      expect(result.stdout).toMatch(/<!DOCTYPE html>/i);
      expect(result.stdout).toContain(`--bg: ${THEME_TOKENS[name]['--bg']};`);
      seen.add(THEME_TOKENS[name]['--bg']!);
      rmSync(dir, { recursive: true, force: true });
    }
    expect(seen.size).toBe(HTML_THEMES.length);
  });

  it('rejects invalid --theme, including config theme names', () => {
    for (const bad of ['solar', 'light', 'dark', 'auto', 'neon']) {
      const result = runCli(
        ['generate', '--html', '--theme', bad, '-c', 'config.yml', '-o', 'README.md'],
        testDir
      );
      expect(result.exitCode).not.toBe(0);
      const combined = result.stdout + result.stderr;
      expect(combined).toMatch(/Invalid --theme/);
      expect(combined).toMatch(/ember, fog, midnight, paper/);
      expect(result.stdout).not.toMatch(/<!DOCTYPE html>/i);
      expect(existsSync(join(testDir, 'README.md'))).toBe(false);
    }
  });

  it('rejects missing --theme value', () => {
    const result = runCli(
      ['generate', '--html', '--theme'],
      testDir
    );
    expect(result.exitCode).not.toBe(0);
    const combined = result.stdout + result.stderr;
    expect(combined).toMatch(/theme/i);
    expect(existsSync(join(testDir, 'README.md'))).toBe(false);
  });

  it('works with --quiet / --locale / --no-color', () => {
    const htmlPath = join(testDir, 'themed.html');
    const result = runCli(
      splitArgs(
        `generate --html ${htmlPath} --theme fog --quiet --locale zh --no-color -c config.yml -o README.md`
      ),
      testDir
    );
    expectExit(result, 0);
    expect(result.stdout.trim()).toBe('');
    expect(result.stdout).not.toContain('已生成');
    expect(result.stdout).not.toContain('README written');
    expect(existsSync(htmlPath)).toBe(true);
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain(`--bg: ${THEME_TOKENS.fog['--bg']};`);
    expect(html).toContain('离线主页预览');
    expect(html).not.toContain('Offline profile preview');
    expect(readFileSync(join(testDir, 'README.md'), 'utf-8')).toContain('octocat');
  });

  it('--html and --json stay exclusive with --theme', () => {
    const result = runCli(
      ['generate', '--html', '--json', '--theme', 'paper', '-c', 'config.yml', '-o', 'README.md'],
      testDir
    );
    expect(result.exitCode).toBe(1);
    const combined = result.stdout + result.stderr;
    expect(combined).toMatch(/cannot be used together|不能同时使用/);
    expect(existsSync(join(testDir, 'README.md'))).toBe(false);
    expect(() => JSON.parse(result.stdout)).toThrow();
  });

  it('--theme without --html is ignored and does not change JSON / README', () => {
    const result = runCli(
      ['generate', '--json', '--theme', 'midnight', '-c', 'config.yml', '-o', 'README.md'],
      testDir
    );
    expectExit(result, 0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.username).toBe('octocat');
    expect(result.stdout).not.toMatch(/<!DOCTYPE html>/i);
    expect(readFileSync(join(testDir, 'README.md'), 'utf-8')).toContain('octocat');
  });

  it('refresh --theme midnight restyles HTML only', () => {
    writeReadme(testDir);
    const result = runCli(
      ['refresh', '--html', '--theme', 'midnight', '-c', 'config.yml', '-r', 'README.md'],
      testDir
    );
    expectExit(result, 0);
    expect(result.stdout).toMatch(/<!DOCTYPE html>/i);
    expect(result.stdout).toContain(`--bg: ${THEME_TOKENS.midnight['--bg']};`);
    expect(readFileSync(join(testDir, 'README.md'), 'utf-8')).toContain('STATS:START');
  });
});

describe('config style.theme stays reserved and unused by --theme', () => {
  const mockData: ProfileData = {
    user: {
      login: 'testuser',
      name: 'Test User',
      bio: 'A test bio',
      public_repos: 10,
      followers: 100,
      following: 50,
      created_at: '2020-01-01T00:00:00Z',
      avatar_url: 'https://example.com/avatar.png',
      html_url: 'https://github.com/testuser'
    },
    repos: [],
    languages: {},
    totalStars: 0,
    totalForks: 0,
    updatedAt: '2024-01-01T00:00:00Z'
  };

  it('style.theme light|dark|auto does not change markdown', () => {
    const base: ProfileConfig = {
      username: 'testuser',
      intro: { zh: '你好', en: 'Hello' },
      sections: [{ type: 'stats', marker: 'STATS' }]
    };
    const none = new ReadmeGenerator(base, mockData).generate();
    for (const theme of ['light', 'dark', 'auto'] as const) {
      const withTheme = new ReadmeGenerator(
        { ...base, style: { theme } },
        mockData
      ).generate();
      expect(withTheme).toBe(none);
    }
  });

  it('CLI --html uses ember even when config style.theme is dark', () => {
    const testDir = mkdtempSync(join(tmpdir(), 'breathing-config-theme-'));
    writeConfig(
      testDir,
      `style:
  theme: dark
  icons: true
  badges: true
`
    );
    const result = runCli(
      ['generate', '--html', '-c', 'config.yml', '-o', 'README.md'],
      testDir
    );
    expectExit(result, 0);
    expect(result.stdout).toContain(`--bg: ${THEME_TOKENS.ember['--bg']};`);
    expect(result.stdout).not.toContain(`--bg: ${THEME_TOKENS.fog['--bg']};`);
    const readme = readFileSync(join(testDir, 'README.md'), 'utf-8');
    expect(readme).toContain('octocat');
    expect(readme).not.toContain('dark');
    rmSync(testDir, { recursive: true, force: true });
  });

  it('validate --json still reports config style.theme unchanged', () => {
    const testDir = mkdtempSync(join(tmpdir(), 'breathing-validate-theme-'));
    writeConfig(
      testDir,
      `style:
  theme: light
`
    );
    const result = runCli(['validate', '--json', '-c', 'config.yml'], testDir);
    expectExit(result, 0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.ok).toBe(true);
    expect(parsed.config.style.theme).toBe('light');
    rmSync(testDir, { recursive: true, force: true });
  });
});
