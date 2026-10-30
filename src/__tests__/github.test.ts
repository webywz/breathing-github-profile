import { GitHubClient, resolveGithubToken } from '../github';

describe('GitHubClient', () => {
  const savedGithub = process.env.GITHUB_TOKEN;
  const savedGh = process.env.GH_TOKEN;

  afterEach(() => {
    if (savedGithub === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = savedGithub;
    if (savedGh === undefined) delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN = savedGh;
  });

  it('应该正确初始化', () => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    const client = new GitHubClient();
    expect(client).toBeInstanceOf(GitHubClient);
  });

  it('应该接受自定义 token', () => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    const token = 'test-token';
    const client = new GitHubClient(token);
    expect(client.authToken).toBe(token);
  });

  it('应该从 GITHUB_TOKEN 环境变量读取 token', () => {
    delete process.env.GH_TOKEN;
    process.env.GITHUB_TOKEN = 'env-token';
    const client = new GitHubClient();
    expect(client.authToken).toBe('env-token');
  });

  it('应该从 GH_TOKEN 环境变量读取 token', () => {
    delete process.env.GITHUB_TOKEN;
    process.env.GH_TOKEN = 'gh-token';
    const client = new GitHubClient();
    expect(client.authToken).toBe('gh-token');
  });

  it('GITHUB_TOKEN 优先于 GH_TOKEN', () => {
    process.env.GITHUB_TOKEN = 'primary';
    process.env.GH_TOKEN = 'secondary';
    expect(resolveGithubToken()).toBe('primary');
    const client = new GitHubClient();
    expect(client.authToken).toBe('primary');
  });

  it('显式 token 优先于环境变量', () => {
    process.env.GITHUB_TOKEN = 'env';
    process.env.GH_TOKEN = 'gh';
    expect(resolveGithubToken('explicit')).toBe('explicit');
  });
});
