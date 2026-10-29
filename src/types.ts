export interface ProfileConfig {
  username: string;
  intro: {
    zh?: string;
    en?: string;
  };
  featuredRepos?: string[];
  sections?: Section[];
  style?: StyleConfig;
}

export interface Section {
  type: 'stats' | 'languages' | 'repos' | 'custom';
  title?: string;
  content?: string;
  marker?: string;
}

export interface StyleConfig {
  theme?: 'light' | 'dark' | 'auto';
  icons?: boolean;
  badges?: boolean;
}

export interface GitHubUser {
  login: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  avatar_url: string;
  html_url: string;
  location?: string;
  blog?: string;
  twitter_username?: string;
  company?: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  homepage: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  watchers_count: number;
  open_issues_count: number;
  archived: boolean;
  fork: boolean;
}

export interface ProfileData {
  user: GitHubUser;
  repos: GitHubRepo[];
  languages: Record<string, number>;
  totalStars: number;
  totalForks: number;
  updatedAt: string;
}

export interface MarkerSection {
  marker: string;
  content: string;
}
