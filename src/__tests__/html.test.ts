import { mkdtempSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ReadmeGenerator } from '../generator';
import { ProfileConfig, ProfileData } from '../types';
import {
  escapeHtml,
  formatProfileHtml,
  profileHtmlInputFrom,
  renderReadmePreview,
  resolveHtmlTarget,
  writeHtmlPreview
} from '../html';
import { readPackageVersion } from '../version';

const mockConfig: ProfileConfig = {
  username: 'testuser',
  intro: {
    zh: '我是一个测试用户',
    en: 'I am a test user'
  },
  sections: [
    { type: 'stats', marker: 'STATS', title: 'GitHub Stats · 统计' },
    { type: 'languages', marker: 'LANGUAGES' }
  ]
};

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
  repos: [
    {
      name: 'test-repo',
      full_name: 'testuser/test-repo',
      description: 'A test repository',
      html_url: 'https://github.com/testuser/test-repo',
      homepage: '',
      stargazers_count: 10,
      forks_count: 5,
      language: 'TypeScript',
      topics: [],
      created_at: '2021-01-01T00:00:00Z',
      updated_at: '2021-06-01T00:00:00Z',
      pushed_at: '2021-06-01T00:00:00Z',
      size: 100,
      watchers_count: 10,
      open_issues_count: 2,
      archived: false,
      fork: false
    }
  ],
  languages: {
    TypeScript: 5,
    JavaScript: 3
  },
  totalStars: 10,
  totalForks: 5,
  updatedAt: '2024-01-01T00:00:00Z'
};

function sampleInput() {
  const markdown = new ReadmeGenerator(mockConfig, mockData).generate();
  return profileHtmlInputFrom({
    action: 'generate',
    config: mockConfig,
    data: mockData,
    markdown,
    outputPath: 'README.md',
    configPath: 'config.yml'
  });
}

const CDN_RE = /cdn\.|unpkg|jsdelivr|googleapis|bootstrapcdn|cloudflare|fonts\.gstatic/i;

describe('resolveHtmlTarget', () => {
  it('treats omitted/false as disabled', () => {
    expect(resolveHtmlTarget(undefined)).toEqual({ enabled: false, onStdout: false });
    expect(resolveHtmlTarget(false)).toEqual({ enabled: false, onStdout: false });
  });

  it('treats true or empty string as stdout', () => {
    expect(resolveHtmlTarget(true)).toEqual({ enabled: true, onStdout: true });
    expect(resolveHtmlTarget('')).toEqual({ enabled: true, onStdout: true });
  });

  it('treats a path as file output', () => {
    expect(resolveHtmlTarget('out/preview.html')).toEqual({
      enabled: true,
      onStdout: false,
      path: 'out/preview.html'
    });
  });
});

describe('escapeHtml / renderReadmePreview', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>"x"&\'')).toBe('&lt;script&gt;&quot;x&quot;&amp;&#39;');
  });

  it('renders headings, tables, links, and markers', () => {
    const html = renderReadmePreview(`# Hello

<!--STATS:START-->
## Stats

| Item | Value |
|:---|:---:|
| Stars | 10 |

[repo](https://example.com)
<!--STATS:END-->
`);
    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<h2>Stats</h2>');
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Item</th>');
    expect(html).toContain('Stars');
    expect(html).toContain('<a href="https://example.com">repo</a>');
    expect(html).toContain('data-marker="STATS"');
    expect(html).not.toContain('STATS:END');
  });

  it('escapes raw text while passing through generated HTML blocks', () => {
    const html = renderReadmePreview(`<div align="center">
  <img src="https://example.com/a.png" alt="x" />
</div>

<script>alert(1)</script>
`);
    expect(html).toContain('<div align="center">');
    expect(html).toContain('<img src="https://example.com/a.png" alt="x" />');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('formatProfileHtml', () => {
  it('emits a self-contained offline preview of generated markdown', () => {
    const input = sampleInput();
    const html = formatProfileHtml(input);

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('testuser');
    expect(html).toContain('Test User');
    expect(html).toContain('STATS');
    expect(html).toContain('LANGUAGES');
    expect(html).toContain('我是一个测试用户');
    expect(html).toContain('I am a test user');
    expect(html).toContain('总 Stars');
    expect(html).toContain(readPackageVersion());
    expect(html).toContain('self-contained');
    expect(html).toContain('offline');
    expect(html).not.toMatch(CDN_RE);
    expect(html).not.toMatch(/<script\s+src=/i);
    expect(html).not.toMatch(/<link\s+[^>]*href=/i);
  });

  it('localizes chrome; omitted locale stays bilingual', () => {
    const input = sampleInput();
    const omitted = formatProfileHtml(input);
    const en = formatProfileHtml(input, { locale: 'en' });
    const zh = formatProfileHtml(input, { locale: 'zh' });

    expect(omitted).toContain('Offline profile preview');
    expect(omitted).toContain('离线主页预览');
    expect(en).toContain('Offline profile preview');
    expect(en).not.toContain('离线主页预览');
    expect(zh).toContain('离线主页预览');
    expect(zh).not.toContain('Offline profile preview');
    expect(zh).toContain('生成');
  });

  it('marks refresh action in the preview', () => {
    const html = formatProfileHtml({
      ...sampleInput(),
      action: 'refresh'
    }, { locale: 'en' });
    expect(html).toContain('refresh');
    expect(html).not.toContain('generate ·');
  });
});

describe('writeHtmlPreview', () => {
  it('creates parent directories and writes the file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'breathing-html-unit-'));
    const path = join(dir, 'nested', 'preview.html');
    writeHtmlPreview('<!DOCTYPE html><html><body>ok</body></html>', path);
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf-8')).toContain('<!DOCTYPE html>');
    rmSync(dir, { recursive: true, force: true });
  });
});
