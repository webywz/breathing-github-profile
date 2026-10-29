import { GitHubUser, GitHubRepo, ProfileData } from './types';

export class GitHubClient {
  private token?: string;
  private baseUrl = 'https://api.github.com';

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'breathing-github-profile'
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API 错误: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getUser(username: string): Promise<GitHubUser> {
    return this.fetch<GitHubUser>(`/users/${username}`);
  }

  async getRepos(username: string): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const batch = await this.fetch<GitHubRepo[]>(
        `/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`
      );
      
      if (batch.length === 0) break;
      repos.push(...batch);
      
      if (batch.length < perPage) break;
      page++;
    }

    return repos.filter(repo => !repo.fork);
  }

  async getProfileData(username: string): Promise<ProfileData> {
    const [user, repos] = await Promise.all([
      this.getUser(username),
      this.getRepos(username)
    ]);

    const languages: Record<string, number> = {};
    let totalStars = 0;
    let totalForks = 0;

    for (const repo of repos) {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;

      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    }

    return {
      user,
      repos,
      languages,
      totalStars,
      totalForks,
      updatedAt: new Date().toISOString()
    };
  }
}
