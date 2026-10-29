import { GitHubClient } from '../github';

describe('GitHubClient', () => {
  it('应该正确初始化', () => {
    const client = new GitHubClient();
    expect(client).toBeInstanceOf(GitHubClient);
  });

  it('应该接受自定义 token', () => {
    const token = 'test-token';
    const client = new GitHubClient(token);
    expect(client).toBeInstanceOf(GitHubClient);
  });

  it('应该从环境变量读取 token', () => {
    process.env.GITHUB_TOKEN = 'env-token';
    const client = new GitHubClient();
    expect(client).toBeInstanceOf(GitHubClient);
    delete process.env.GITHUB_TOKEN;
  });
});
