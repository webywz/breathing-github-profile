import { ProfileConfig, ProfileData, MarkerSection } from './types';

const DEFAULT_TITLES: Record<string, { withIcons: string; plain: string }> = {
  stats: { withIcons: '📊 GitHub 统计', plain: 'GitHub 统计' },
  languages: { withIcons: '💻 编程语言', plain: '编程语言' },
  repos: { withIcons: '🔥 精选项目', plain: '精选项目' },
};

export class ReadmeGenerator {
  constructor(
    private config: ProfileConfig,
    private data: ProfileData
  ) {}

  private get iconsEnabled(): boolean {
    return this.config.style?.icons !== false;
  }

  private icon(emoji: string): string {
    return this.iconsEnabled ? `${emoji} ` : '';
  }

  generate(): string {
    const sections: string[] = [];

    sections.push(this.generateHeader());
    sections.push(this.generateIntro());

    if (this.config.sections) {
      for (const section of this.config.sections) {
        sections.push(this.generateSection(section));
      }
    }

    sections.push(this.generateFooter());

    return sections.filter(s => s.trim()).join('\n\n');
  }

  private generateHeader(): string {
    const { user } = this.data;
    const wave = this.iconsEnabled ? ' 👋' : '';
    return `# Hi there, I'm ${user.name || user.login}${wave}

<div align="center">
  <img src="${user.avatar_url}" width="150" height="150" alt="${user.login}" style="border-radius: 50%;" />
</div>`;
  }

  private generateIntro(): string {
    const { intro } = this.config;
    const parts: string[] = [];
    const aboutZh = this.iconsEnabled ? '## 👨‍💻 关于我' : '## 关于我';
    const aboutEn = this.iconsEnabled ? '## 👨‍💻 About Me' : '## About Me';

    if (intro.zh?.trim()) {
      parts.push(`${aboutZh}

${intro.zh.trim()}`);
    }

    if (intro.en?.trim()) {
      parts.push(`${aboutEn}

${intro.en.trim()}`);
    }

    return parts.join('\n\n');
  }

  private defaultTitle(type: string): string | undefined {
    const entry = DEFAULT_TITLES[type];
    if (!entry) return undefined;
    return this.iconsEnabled ? entry.withIcons : entry.plain;
  }

  private generateSection(section: { type: string; marker?: string; title?: string; content?: string }): string {
    const marker = section.marker || section.type.toUpperCase();
    let content = '';

    switch (section.type) {
      case 'stats':
        content = this.generateStats();
        break;
      case 'languages':
        content = this.generateLanguages();
        break;
      case 'repos':
        content = this.generateRepos();
        break;
      case 'custom':
        content = section.content || '';
        break;
    }

    if (!content) return '';

    const title = section.title?.trim() || this.defaultTitle(section.type);
    const heading = title ? `## ${title}\n\n` : '';

    return `<!--${marker}:START-->
${heading}${content}
<!--${marker}:END-->`;
  }

  private generateStats(): string {
    const { user, totalStars, totalForks } = this.data;

    return `<div align="center">

| 统计项 | 数值 |
|:---:|:---:|
| ${this.icon('🌟')}总 Stars | ${totalStars} |
| ${this.icon('🍴')}总 Forks | ${totalForks} |
| ${this.icon('📦')}公开仓库 | ${user.public_repos} |
| ${this.icon('👥')}关注者 | ${user.followers} |
| ${this.icon('💫')}正在关注 | ${user.following} |

</div>`;
  }

  private generateLanguages(): string {
    const { languages } = this.data;
    const sorted = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    if (sorted.length === 0) return '';

    const rows = sorted.map(([lang, count]) => {
      const percentage = ((count / Object.values(languages).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
      return `| ${lang} | ${count} | ${percentage}% |`;
    }).join('\n');

    return `| 语言 | 仓库数 | 占比 |
|:---|:---:|:---:|
${rows}`;
  }

  private generateRepos(): string {
    const { repos } = this.data;
    const featured = this.config.featuredRepos || [];

    let displayRepos = repos;
    if (featured.length > 0) {
      displayRepos = repos.filter(r =>
        featured.some(f => r.name === f || r.full_name === f)
      );
    } else {
      displayRepos = repos
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 6);
    }

    if (displayRepos.length === 0) return '';

    const cards = displayRepos.map(repo => {
      const lang = repo.language || 'N/A';
      const desc = repo.description || '暂无描述';
      const namePrefix = this.icon('📦');
      const meta = this.iconsEnabled
        ? `⭐ ${repo.stargazers_count} stars | 🍴 ${repo.forks_count} forks | 📝 ${lang}`
        : `${repo.stargazers_count} stars | ${repo.forks_count} forks | ${lang}`;
      return `### ${namePrefix}[${repo.name}](${repo.html_url})
${desc}

${meta}`;
    }).join('\n\n');

    return cards;
  }

  private generateFooter(): string {
    const { updatedAt } = this.data;
    const date = new Date(updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    return `---

<div align="center">

*此 README 由 [breathing-github-profile](https://github.com/webywz/breathing-github-profile) 自动生成*

*最后更新: ${date} (北京时间)*

</div>`;
  }
}

export function updateReadmeMarkers(
  existingReadme: string,
  markerSections: MarkerSection[]
): string {
  let updated = existingReadme;

  for (const { marker, content } of markerSections) {
    const startMarker = `<!--${marker}:START-->`;
    const endMarker = `<!--${marker}:END-->`;

    const regex = new RegExp(
      `${escapeRegex(startMarker)}[\\s\\S]*?${escapeRegex(endMarker)}`,
      'g'
    );

    const replacement = `${startMarker}\n${content}\n${endMarker}`;

    if (regex.test(updated)) {
      updated = updated.replace(regex, replacement);
    } else {
      updated += `\n\n${replacement}`;
    }
  }

  return updated;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
