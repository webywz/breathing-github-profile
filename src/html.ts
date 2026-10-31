import { dirname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { Locale, cliText } from './locale';
import { ProfileConfig, ProfileData } from './types';
import { readPackageVersion } from './version';

export type HtmlAction = 'generate' | 'refresh';

export interface ProfileHtmlSection {
  type: string;
  marker: string;
  title?: string;
}

export interface ProfileHtmlInput {
  action: HtmlAction;
  username: string;
  name?: string;
  outputPath: string;
  configPath: string;
  bytes: number;
  sections: ProfileHtmlSection[];
  stars: number;
  forks: number;
  publicRepos: number;
  followers: number;
  following: number;
  updatedAt?: string;
  version: string;
  markdown: string;
}

export interface HtmlFormatOptions {
  locale?: Locale;
}

type HtmlStrings = {
  title: string;
  kicker: string;
  actionGenerate: string;
  actionRefresh: string;
  username: string;
  name: string;
  stats: string;
  preview: string;
  stars: string;
  forks: string;
  repos: string;
  followers: string;
  following: string;
  sections: string;
  output: string;
  config: string;
  bytes: string;
  updated: string;
  unnamed: string;
  none: string;
  footer: string;
};

const EN: HtmlStrings = {
  title: 'breathing-github-profile',
  kicker: 'Offline profile preview',
  actionGenerate: 'generate',
  actionRefresh: 'refresh',
  username: 'User',
  name: 'Name',
  stats: 'Stats',
  preview: 'README preview',
  stars: 'Stars',
  forks: 'Forks',
  repos: 'Public repos',
  followers: 'Followers',
  following: 'Following',
  sections: 'Sections',
  output: 'README',
  config: 'Config',
  bytes: 'Bytes',
  updated: 'Updated',
  unnamed: '—',
  none: 'none',
  footer: 'breathing-github-profile · self-contained · offline (file://)'
};

const ZH: HtmlStrings = {
  title: 'breathing-github-profile',
  kicker: '离线主页预览',
  actionGenerate: '生成',
  actionRefresh: '刷新',
  username: '用户',
  name: '名称',
  stats: '统计',
  preview: 'README 预览',
  stars: 'Stars',
  forks: 'Forks',
  repos: '公开仓库',
  followers: '关注者',
  following: '正在关注',
  sections: '章节',
  output: 'README',
  config: '配置',
  bytes: '字节',
  updated: '更新时间',
  unnamed: '无',
  none: '无',
  footer: 'breathing-github-profile · 自包含 · 离线 (file://)'
};

function stringsFor(locale?: Locale): HtmlStrings {
  if (locale === 'zh') return ZH;
  if (locale === 'en') return EN;
  return {
    title: 'breathing-github-profile',
    kicker: 'Offline profile preview · 离线主页预览',
    actionGenerate: 'generate · 生成',
    actionRefresh: 'refresh · 刷新',
    username: 'User / 用户',
    name: 'Name / 名称',
    stats: 'Stats / 统计',
    preview: 'README preview · README 预览',
    stars: 'Stars',
    forks: 'Forks',
    repos: 'Public repos / 公开仓库',
    followers: 'Followers / 关注者',
    following: 'Following / 正在关注',
    sections: 'Sections / 章节',
    output: 'README',
    config: 'Config / 配置',
    bytes: 'Bytes / 字节',
    updated: 'Updated / 更新时间',
    unnamed: '—',
    none: 'none / 无',
    footer: 'breathing-github-profile · self-contained · offline (file://)'
  };
}

/** Escape text for safe insertion into HTML text/attr contexts. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function resolveHtmlTarget(html: unknown): {
  enabled: boolean;
  onStdout: boolean;
  path?: string;
} {
  if (html === undefined || html === false || html === null) {
    return { enabled: false, onStdout: false };
  }
  if (html === true || html === '') {
    return { enabled: true, onStdout: true };
  }
  if (typeof html === 'string') {
    return { enabled: true, onStdout: false, path: html };
  }
  return { enabled: false, onStdout: false };
}

export function writeHtmlPreview(html: string, path?: string): void {
  const payload = html.endsWith('\n') ? html : `${html}\n`;
  if (path) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, payload, 'utf-8');
    return;
  }
  process.stdout.write(payload);
}

export function profileHtmlInputFrom(args: {
  action: HtmlAction;
  config: ProfileConfig;
  data: ProfileData;
  markdown: string;
  outputPath: string;
  configPath: string;
}): ProfileHtmlInput {
  return {
    action: args.action,
    username: args.config.username,
    name: args.data.user.name,
    outputPath: args.outputPath,
    configPath: args.configPath,
    bytes: Buffer.byteLength(args.markdown, 'utf-8'),
    sections: (args.config.sections || []).map((section) => ({
      type: section.type,
      marker: section.marker || section.type.toUpperCase(),
      title: section.title
    })),
    stars: args.data.totalStars,
    forks: args.data.totalForks,
    publicRepos: args.data.user.public_repos,
    followers: args.data.user.followers,
    following: args.data.user.following,
    updatedAt: args.data.updatedAt,
    version: readPackageVersion(),
    markdown: args.markdown
  };
}

function inlineFormat(raw: string): string {
  const codes: string[] = [];
  const images: string[] = [];
  const links: string[] = [];

  let text = raw.replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return `%%C${codes.length - 1}%%`;
  });

  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, url: string) => {
    images.push(
      `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />`
    );
    return `%%I${images.length - 1}%%`;
  });

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) => {
    links.push(
      `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`
    );
    return `%%L${links.length - 1}%%`;
  });

  text = escapeHtml(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  text = text.replace(/%%C(\d+)%%/g, (_, i: string) => codes[Number(i)]);
  text = text.replace(/%%I(\d+)%%/g, (_, i: string) => images[Number(i)]);
  text = text.replace(/%%L(\d+)%%/g, (_, i: string) => links[Number(i)]);
  return text;
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableCells(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((cell) => cell.trim());
}

function renderTable(rows: string[]): string {
  if (rows.length === 0) return '';
  const head = splitTableCells(rows[0]).map((cell) => `<th>${inlineFormat(cell)}</th>`).join('');
  const bodyRows = rows.slice(1).filter((row) => !isTableSeparator(row));
  const body = bodyRows
    .map((row) => `<tr>${splitTableCells(row).map((cell) => `<td>${inlineFormat(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function headingLevel(line: string): number {
  const match = /^(#{1,6})\s+/.exec(line);
  return match ? match[1].length : 0;
}

const PASSTHROUGH_TAG =
  /^(div|img|table|thead|tbody|tr|td|th|br|hr|p|span|a|strong|em|ul|ol|li|code|pre)$/i;

function isPassthroughHtml(line: string): boolean {
  const match = /^\s*<\/?([a-zA-Z][\w:-]*)\b/.exec(line);
  return Boolean(match && PASSTHROUGH_TAG.test(match[1]));
}

function tagDelta(line: string): number {
  const tags = line.match(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g) || [];
  let delta = 0;
  for (const tag of tags) {
    if (tag.startsWith('</')) {
      delta -= 1;
      continue;
    }
    if (/\/>$/.test(tag)) continue;
    const name = /^<\/?([a-zA-Z][\w:-]*)/.exec(tag)?.[1]?.toLowerCase();
    if (!name || /^(img|br|hr|input|meta|link|source|area|col|embed|wbr)$/.test(name)) {
      continue;
    }
    if (!PASSTHROUGH_TAG.test(name)) continue;
    delta += 1;
  }
  return delta;
}

/**
 * Render generated README markdown as structured HTML.
 * Passes through existing HTML blocks from the generator; converts headings,
 * tables, rules, markers, and inline markdown. No external renderer.
 */
export function renderReadmePreview(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  let htmlDepth = 0;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    out.push(`<p>${inlineFormat(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    const markerStart = /^<!--([A-Za-z0-9_-]+):START-->\s*$/.exec(trimmed);
    if (markerStart) {
      flushParagraph();
      out.push(`<div class="marker" data-marker="${escapeHtml(markerStart[1])}">${escapeHtml(markerStart[1])}</div>`);
      i += 1;
      continue;
    }
    if (/^<!--([A-Za-z0-9_-]+):END-->\s*$/.test(trimmed) || /^<!--.*-->\s*$/.test(trimmed)) {
      flushParagraph();
      i += 1;
      continue;
    }

    if (htmlDepth > 0) {
      if (trimmed.startsWith('|')) {
        flushParagraph();
        const table: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          table.push(lines[i]);
          i += 1;
        }
        out.push(renderTable(table));
        continue;
      }
      if (!trimmed) {
        flushParagraph();
        i += 1;
        continue;
      }
      if (isPassthroughHtml(trimmed)) {
        flushParagraph();
        out.push(line);
        htmlDepth += tagDelta(line);
        i += 1;
        continue;
      }
      paragraph.push(trimmed);
      i += 1;
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      i += 1;
      continue;
    }

    const level = headingLevel(trimmed);
    if (level > 0) {
      flushParagraph();
      out.push(`<h${level}>${inlineFormat(trimmed.replace(/^#{1,6}\s+/, ''))}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^(---|\*\*\*|___)\s*$/.test(trimmed)) {
      flushParagraph();
      out.push('<hr />');
      i += 1;
      continue;
    }

    if (trimmed.startsWith('|')) {
      flushParagraph();
      const table: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        table.push(lines[i]);
        i += 1;
      }
      out.push(renderTable(table));
      continue;
    }

    if (isPassthroughHtml(trimmed)) {
      flushParagraph();
      out.push(line);
      htmlDepth = Math.max(0, htmlDepth + tagDelta(line));
      i += 1;
      continue;
    }

    paragraph.push(trimmed);
    i += 1;
  }

  flushParagraph();
  return out.join('\n');
}

function row(label: string, value: string): string {
  return `<tr><th>${escapeHtml(label)}</th><td>${value}</td></tr>`;
}

/**
 * Self-contained profile HTML preview (inline CSS, no CDN, no external fonts/scripts).
 * Preview chrome is escaped; README HTML produced by this package is inlined as-is.
 */
export function formatProfileHtml(
  input: ProfileHtmlInput,
  options: HtmlFormatOptions = {}
): string {
  const locale = options.locale;
  const s = stringsFor(locale);
  const actionLabel = input.action === 'refresh' ? s.actionRefresh : s.actionGenerate;
  const pageTitle = `${s.title} · ${input.action} · ${input.username}`;
  const displayName = input.name?.trim()
    ? escapeHtml(input.name)
    : escapeHtml(s.unnamed);
  const sectionList = input.sections.length
    ? input.sections
      .map((section) => {
        const label = section.title?.trim() || section.type;
        return `<li><code>${escapeHtml(section.marker)}</code> ${escapeHtml(label)}</li>`;
      })
      .join('')
    : `<li class="empty">${escapeHtml(s.none)}</li>`;
  const updated = input.updatedAt
    ? escapeHtml(input.updatedAt)
    : escapeHtml(s.unnamed);
  const preview = renderReadmePreview(input.markdown);

  return `<!DOCTYPE html>
<html lang="${locale === 'zh' ? 'zh' : 'en'}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(pageTitle)}</title>
<style>
:root {
  --bg: #0f1419;
  --bg-deep: #0b1014;
  --panel: #162028;
  --border: #2b3d4a;
  --text: #e6edf3;
  --muted: #8b9bab;
  --accent: #3fb950;
  --cyan: #79c0ff;
  --gold: #d4a72c;
  --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
}
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: var(--bg); color: var(--text);
  font: 15px/1.55 var(--font);
}
body { padding: 28px 20px 56px; max-width: 920px; margin: 0 auto; }
.top, .hero, .stats, .preview {
  border: 1px solid var(--border); background: var(--panel);
  padding: 18px 20px; margin-bottom: 16px;
}
.top h1 { margin: 0 0 8px; font-size: 15px; font-weight: 650; letter-spacing: 0.02em; }
.top .meta { color: var(--muted); font-size: 12px; }
.hero .kicker {
  color: var(--muted); font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.1em; margin: 0 0 8px;
}
.hero .login {
  font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15;
  color: var(--cyan);
}
.hero .chips { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  padding: 2px 8px; border: 1px solid var(--border); font-size: 12px; color: var(--muted);
}
.chip.accent { color: var(--accent); border-color: #24582d; }
.grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px; margin: 14px 0 0;
}
.stat {
  border: 1px solid var(--border); background: var(--bg-deep);
  padding: 10px 12px;
}
.stat .n { font-size: 20px; font-weight: 700; color: var(--gold); }
.stat .l { color: var(--muted); font-size: 11px; margin-top: 4px; }
h2 {
  font-size: 11px; color: var(--muted); text-transform: uppercase;
  letter-spacing: 0.1em; margin: 0 0 12px; font-weight: 650;
}
table.meta { width: 100%; border-collapse: collapse; }
table.meta th, table.meta td { text-align: left; padding: 6px 0; vertical-align: top; }
table.meta th { width: 34%; color: var(--muted); font-weight: 500; }
table.meta td { color: var(--text); word-break: break-all; }
.sections { margin: 12px 0 0; padding-left: 18px; color: var(--text); }
.sections .empty { color: var(--muted); list-style: none; margin-left: -18px; }
.marker {
  display: inline-block; margin: 10px 0 6px; padding: 1px 8px;
  border: 1px solid var(--border); color: var(--cyan);
  font: 11px/1.4 var(--mono); letter-spacing: 0.06em;
}
.article h1, .article h2, .article h3 { color: var(--text); letter-spacing: 0; text-transform: none; }
.article h1 { font-size: 26px; margin: 0 0 12px; }
.article h2 { font-size: 18px; margin: 22px 0 10px; }
.article h3 { font-size: 16px; margin: 16px 0 8px; }
.article p { margin: 0 0 10px; }
.article hr { border: 0; border-top: 1px solid var(--border); margin: 20px 0; }
.article img { max-width: 160px; height: auto; border-radius: 50%; display: block; margin: 8px auto; }
.article table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; }
.article th, .article td {
  border: 1px solid var(--border); padding: 6px 8px; text-align: left;
}
.article th { color: var(--muted); font-weight: 600; }
.article a { color: var(--cyan); }
.article code { font-family: var(--mono); font-size: 13px; }
.article div[align="center"] { text-align: center; }
footer {
  margin-top: 8px; color: var(--muted); font-size: 11px;
  border-top: 1px solid var(--border); padding-top: 12px;
}
@media (max-width: 640px) {
  .hero .login { font-size: 22px; }
  table.meta th { width: 42%; }
}
</style>
</head>
<body>
  <header class="top">
    <h1>${escapeHtml(s.title)}</h1>
    <div class="meta">${escapeHtml(s.kicker)} · v${escapeHtml(input.version)}</div>
  </header>
  <section class="hero">
    <p class="kicker">${escapeHtml(s.username)}</p>
    <div class="login">${escapeHtml(input.username)}</div>
    <div class="chips">
      <span class="chip accent">${escapeHtml(actionLabel)}</span>
      <span class="chip">${escapeHtml(s.name)} ${displayName}</span>
    </div>
    <div class="grid">
      <div class="stat"><div class="n">${input.stars}</div><div class="l">${escapeHtml(s.stars)}</div></div>
      <div class="stat"><div class="n">${input.forks}</div><div class="l">${escapeHtml(s.forks)}</div></div>
      <div class="stat"><div class="n">${input.publicRepos}</div><div class="l">${escapeHtml(s.repos)}</div></div>
      <div class="stat"><div class="n">${input.followers}</div><div class="l">${escapeHtml(s.followers)}</div></div>
      <div class="stat"><div class="n">${input.following}</div><div class="l">${escapeHtml(s.following)}</div></div>
      <div class="stat"><div class="n">${input.sections.length}</div><div class="l">${escapeHtml(s.sections)}</div></div>
    </div>
  </section>
  <section class="stats">
    <h2>${escapeHtml(s.stats)}</h2>
    <table class="meta">
      ${row(s.username, escapeHtml(input.username))}
      ${row(s.name, displayName)}
      ${row(s.output, escapeHtml(input.outputPath))}
      ${row(s.config, escapeHtml(input.configPath))}
      ${row(s.bytes, String(input.bytes))}
      ${row(s.updated, updated)}
    </table>
    <ul class="sections">${sectionList}</ul>
  </section>
  <section class="preview">
    <h2>${escapeHtml(s.preview)}</h2>
    <article class="article">
${preview}
    </article>
  </section>
  <footer>${escapeHtml(s.footer)}</footer>
</body>
</html>`;
}

export function htmlWrittenLine(locale: Locale | undefined, path: string): string {
  return cliText(locale, {
    both: `  HTML preview / HTML 预览: ${path}`,
    en: `  HTML preview: ${path}`,
    zh: `  HTML 预览: ${path}`
  });
}
