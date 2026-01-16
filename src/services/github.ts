import { supabase } from '../lib/supabase';

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  location: string;
  blog: string;
  email: string;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  homepage: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

// Use Vercel API route proxy to avoid CORS and rate limiting
const GITHUB_API_BASE = '/api/github';

// Log activity to Supabase (anon-friendly; stores user_id as null)
async function logActivity(
  eventType: 'fetch_profile' | 'fetch_repos' | 'settings_update' | 'error' | 'login' | 'logout',
  eventData?: any,
  errorMessage?: string
) {
  try {
    await fetch('/admin-api/admin/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData,
        error_message: errorMessage
      })
    });
  } catch (err) {
    // Silently fail - activity logging is not critical
    console.debug('Activity logging skipped:', err);
  }
}

// Fetch GitHub user profile
export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/users/${username}`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    await logActivity('fetch_profile', { username, success: true });
    
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logActivity('error', { username, context: 'fetch_profile' }, errorMessage);
    throw error;
  }
}

// Fetch GitHub repositories
export async function fetchGitHubRepos(
  username: string,
  options: {
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
  } = {}
): Promise<GitHubRepo[]> {
  try {
    const params = new URLSearchParams({
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
      per_page: String(options.per_page || 100),
    });

    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?${params}`
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    await logActivity('fetch_repos', { username, count: data.length, success: true });

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logActivity('error', { username, context: 'fetch_repos' }, errorMessage);
    throw error;
  }
}

// Fetch pinned repositories (requires GraphQL and token)
export async function fetchPinnedRepos(username: string, token?: string): Promise<GitHubRepo[]> {
  if (!token) {
    // Fallback to starred repos or most popular
    const repos = await fetchGitHubRepos(username, { sort: 'updated', per_page: 6 });
    return repos.slice(0, 6);
  }

  try {
    const query = `
      query {
        user(login: "${username}") {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                id
                name
                description
                url
                homepageUrl
                primaryLanguage {
                  name
                }
                stargazerCount
                forkCount
                repositoryTopics(first: 10) {
                  nodes {
                    topic {
                      name
                    }
                  }
                }
                createdAt
                updatedAt
                pushedAt
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`GitHub GraphQL API error: ${response.status}`);
    }

    const result = await response.json();
    const pinnedItems = result.data?.user?.pinnedItems?.nodes || [];

    // Transform GraphQL response to match REST API format
    return pinnedItems.map((item: any) => ({
      id: parseInt(item.id, 10),
      name: item.name,
      full_name: `${username}/${item.name}`,
      description: item.description,
      html_url: item.url,
      homepage: item.homepageUrl,
      language: item.primaryLanguage?.name || '',
      stargazers_count: item.stargazerCount,
      forks_count: item.forkCount,
      topics: item.repositoryTopics?.nodes?.map((t: any) => t.topic.name) || [],
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      pushed_at: item.pushedAt
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logActivity('error', { username, context: 'fetch_pinned_repos' }, errorMessage);
    // Fallback to regular repos
    const repos = await fetchGitHubRepos(username, { sort: 'updated', per_page: 6 });
    return repos.slice(0, 6);
  }
}

// Get user settings from Supabase
export async function getUserSettings() {
  try {
    const resp = await fetch('/admin-api/admin/settings');
    if (!resp.ok) return null;
    return await resp.json();
  } catch (error) {
    // Settings endpoint may not be accessible from public site
    console.debug('Settings not available:', error);
    return null;
  }
}

// Update user settings
export async function updateUserSettings(settings: Partial<{
  github_username: string;
  repo_filter: 'pinned' | 'recent' | 'stars';
  max_repos: number;
  bio_override: string;
  display_name_override: string;
}>) {
  const { data, error } = await supabase
    .from('admin_settings')
    .upsert({
      id: 1,
      ...settings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    await logActivity('error', { context: 'update_settings' }, error.message);
    throw error;
  }
  
  await logActivity('settings_update', { settings });
  return data;
}
