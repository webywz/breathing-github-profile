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

    expect(() => validateConfig(config)).toThrow('zh 或 en');
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
    expect(defaults.sections?.length).toBeGreaterThan(0);
  });
});
