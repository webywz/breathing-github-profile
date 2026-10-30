import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { ProfileConfig } from './types';

export function loadConfig(configPath: string): ProfileConfig {
  const content = readFileSync(configPath, 'utf-8');
  
  let config: ProfileConfig;
  if (configPath.endsWith('.json')) {
    config = JSON.parse(content);
  } else if (configPath.endsWith('.yml') || configPath.endsWith('.yaml')) {
    config = parseYaml(content);
  } else {
    throw new Error('配置文件必须是 .json, .yml 或 .yaml 格式');
  }

  validateConfig(config);
  return config;
}

function hasIntroText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateConfig(config: ProfileConfig): void {
  if (!config.username || typeof config.username !== 'string') {
    throw new Error('配置中必须包含有效的 username 字段');
  }

  if (!config.intro || typeof config.intro !== 'object') {
    throw new Error('配置中必须包含 intro 对象');
  }

  // Blank / whitespace-only strings count as missing; zh-only or en-only is OK.
  if (!hasIntroText(config.intro.zh) && !hasIntroText(config.intro.en)) {
    throw new Error(
      'intro must include at least one non-empty zh or en / intro 必须至少包含非空的 zh 或 en 字段'
    );
  }

  if (config.featuredRepos && !Array.isArray(config.featuredRepos)) {
    throw new Error('featuredRepos 必须是数组');
  }

  if (config.sections && !Array.isArray(config.sections)) {
    throw new Error('sections 必须是数组');
  }

  if (config.sections) {
    for (const section of config.sections) {
      if (!['stats', 'languages', 'repos', 'custom'].includes(section.type)) {
        throw new Error(`不支持的 section 类型: ${section.type}`);
      }
      if (section.type === 'custom' && !section.content) {
        throw new Error('custom 类型的 section 必须包含 content 字段');
      }
    }
  }
}

export function getDefaultConfig(): Partial<ProfileConfig> {
  return {
    sections: [
      { type: 'stats', marker: 'STATS' },
      { type: 'languages', marker: 'LANGUAGES' },
      { type: 'repos', marker: 'REPOS' }
    ],
    style: {
      theme: 'auto',
      icons: true,
      badges: true
    }
  };
}
