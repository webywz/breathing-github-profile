import { ReadmeGenerator, updateReadmeMarkers } from '../generator';
import { ProfileConfig, ProfileData } from '../types';

const mockConfig: ProfileConfig = {
  username: 'testuser',
  intro: {
    zh: '我是一个测试用户',
    en: 'I am a test user'
  },
  sections: [
    { type: 'stats', marker: 'STATS' },
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
    'TypeScript': 5,
    'JavaScript': 3,
    'Python': 2
  },
  totalStars: 10,
  totalForks: 5,
  updatedAt: '2024-01-01T00:00:00Z'
};

describe('ReadmeGenerator', () => {
  it('应该生成完整的 README', () => {
    const generator = new ReadmeGenerator(mockConfig, mockData);
    const readme = generator.generate();

    expect(readme).toContain('Test User');
    expect(readme).toContain('testuser');
    expect(readme).toContain('我是一个测试用户');
    expect(readme).toContain('I am a test user');
  });

  it('应该包含统计标记', () => {
    const generator = new ReadmeGenerator(mockConfig, mockData);
    const readme = generator.generate();

    expect(readme).toContain('<!--STATS:START-->');
    expect(readme).toContain('<!--STATS:END-->');
    expect(readme).toContain('总 Stars');
    expect(readme).toContain('10');
  });

  it('应该包含语言标记', () => {
    const generator = new ReadmeGenerator(mockConfig, mockData);
    const readme = generator.generate();

    expect(readme).toContain('<!--LANGUAGES:START-->');
    expect(readme).toContain('<!--LANGUAGES:END-->');
    expect(readme).toContain('TypeScript');
    expect(readme).toContain('JavaScript');
  });

  it('仅中文 intro 只输出中文关于我块', () => {
    const config: ProfileConfig = {
      username: 'testuser',
      intro: { zh: '我是一个测试用户' },
      sections: [{ type: 'stats', marker: 'STATS' }]
    };
    const generator = new ReadmeGenerator(config, mockData);
    const readme = generator.generate();

    expect(readme).toContain('## 👨‍💻 关于我');
    expect(readme).toContain('我是一个测试用户');
    expect(readme).not.toContain('## 👨‍💻 About Me');
  });

  it('应该包含页脚时间戳', () => {
    const generator = new ReadmeGenerator(mockConfig, mockData);
    const readme = generator.generate();

    expect(readme).toContain('最后更新');
    expect(readme).toContain('breathing-github-profile');
  });
});

describe('updateReadmeMarkers', () => {
  it('应该更新现有标记', () => {
    const existing = `# My Profile

<!--STATS:START-->
Old content
<!--STATS:END-->

Some custom text`;

    const updated = updateReadmeMarkers(existing, [
      { marker: 'STATS', content: 'New content' }
    ]);

    expect(updated).toContain('<!--STATS:START-->');
    expect(updated).toContain('New content');
    expect(updated).toContain('<!--STATS:END-->');
    expect(updated).not.toContain('Old content');
    expect(updated).toContain('Some custom text');
  });

  it('应该添加不存在的标记', () => {
    const existing = `# My Profile

Some existing content`;

    const updated = updateReadmeMarkers(existing, [
      { marker: 'STATS', content: 'Stats content' }
    ]);

    expect(updated).toContain('<!--STATS:START-->');
    expect(updated).toContain('Stats content');
    expect(updated).toContain('<!--STATS:END-->');
    expect(updated).toContain('Some existing content');
  });

  it('应该保留标记外的自定义内容', () => {
    const existing = `# Custom Header

My custom intro

<!--STATS:START-->
Old stats
<!--STATS:END-->

Custom middle section

<!--LANGUAGES:START-->
Old languages
<!--LANGUAGES:END-->

Custom footer`;

    const updated = updateReadmeMarkers(existing, [
      { marker: 'STATS', content: 'New stats' },
      { marker: 'LANGUAGES', content: 'New languages' }
    ]);

    expect(updated).toContain('Custom Header');
    expect(updated).toContain('My custom intro');
    expect(updated).toContain('New stats');
    expect(updated).toContain('Custom middle section');
    expect(updated).toContain('New languages');
    expect(updated).toContain('Custom footer');
  });
});
