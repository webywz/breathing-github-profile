import { validateConfig, getDefaultConfig } from '../config';
import { ProfileConfig } from '../types';

describe('Config Validation', () => {
  it('应该通过有效的配置', () => {
    const config: ProfileConfig = {
      username: 'webywz',
      intro: {
        zh: '你好',
        en: 'Hello'
      }
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  it('应该要求 username 字段', () => {
    const config = {
      intro: { zh: '你好' }
    } as any;

    expect(() => validateConfig(config)).toThrow('username');
  });

  it('应该要求 intro 对象', () => {
    const config = {
      username: 'test'
    } as any;

    expect(() => validateConfig(config)).toThrow('intro');
  });

  it('应该要求 intro 至少包含 zh 或 en', () => {
    const config = {
      username: 'test',
      intro: {}
    } as any;

    expect(() => validateConfig(config)).toThrow(/zh 或 en|non-empty zh or en/);
  });

  it('应该通过仅中文 intro', () => {
    const config: ProfileConfig = {
      username: 'test',
      intro: { zh: '你好，我是开发者' }
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  it('应该通过仅英文 intro', () => {
    const config: ProfileConfig = {
      username: 'test',
      intro: { en: 'Hello, I am a developer' }
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  it('空白 zh 且无 en 应失败，且错误文案中英双语', () => {
    const config = {
      username: 'test',
      intro: { zh: '  ' }
    } as any;

    expect(() => validateConfig(config)).toThrow(
      /intro must include at least one non-empty zh or en \/ intro 必须至少包含非空的 zh 或 en 字段/
    );
  });

  it('空白 en 且有非空 zh 应通过', () => {
    const config: ProfileConfig = {
      username: 'test',
      intro: { zh: '你好', en: '   ' }
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  it('应该验证 featuredRepos 是数组', () => {
    const config = {
      username: 'test',
      intro: { zh: '你好' },
      featuredRepos: 'not-array'
    } as any;

    expect(() => validateConfig(config)).toThrow('数组');
  });

  it('应该验证 sections 类型', () => {
    const config: ProfileConfig = {
      username: 'test',
      intro: { zh: '你好' },
      sections: [
        { type: 'invalid' as any }
      ]
    };

    expect(() => validateConfig(config)).toThrow('section 类型');
  });

  it('应该要求 custom 类型包含 content', () => {
    const config: ProfileConfig = {
      username: 'test',
      intro: { zh: '你好' },
      sections: [
        { type: 'custom' }
      ]
    };

    expect(() => validateConfig(config)).toThrow('content');
  });

  it('应该返回默认配置', () => {
    const defaults = getDefaultConfig();
    
    expect(defaults.sections).toBeDefined();
    expect(defaults.style).toBeDefined();
    expect(defaults.style?.theme).toBe('auto');
    expect(defaults.sections?.length).toBeGreaterThan(0);
  });

  it('保留 style.theme 为 light|dark|auto，且不与 HTML 配色混用', () => {
    for (const theme of ['light', 'dark', 'auto'] as const) {
      const config: ProfileConfig = {
        username: 'test',
        intro: { zh: '你好' },
        style: { theme }
      };
      expect(() => validateConfig(config)).not.toThrow();
    }
  });
});
