import type { APIRoute } from 'astro';
import { createSuccessResponse, createErrorResponse } from '@smauii/shared';

const CACHE = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const GET: APIRoute = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) {
    return createErrorResponse('Unauthorized', 401);
  }

  const githubUsername = url.searchParams.get('username') || user.githubUsername;
  if (!githubUsername) {
    return createSuccessResponse({
      hasGitHub: false,
      message: 'Connect your GitHub account to see contributions',
    });
  }

  // Check cache
  const cached = CACHE.get(githubUsername);
  if (cached && cached.expires > Date.now()) {
    return createSuccessResponse({ ...cached.data, cached: true });
  }

  const token = import.meta.env.GITHUB_PAT;

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SMAUII-Digital-Lab',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fetch user's public events (commits, PRs, issues)
    const eventsRes = await fetch(
      `https://api.github.com/users/${githubUsername}/events/public?per_page=30`,
      { headers, signal: AbortSignal.timeout(10000) }
    );

    if (!eventsRes.ok) {
      if (eventsRes.status === 404) {
        return createSuccessResponse({
          hasGitHub: true,
          valid: false,
          message: 'GitHub username not found',
        });
      }
      throw new Error(`GitHub API error: ${eventsRes.status}`);
    }

    const events = await eventsRes.json();

    // Aggregate by type
    const stats = {
      commits: 0,
      pullRequests: 0,
      issues: 0,
      other: 0,
      repos: new Set<string>(),
      recentActivity: [] as { type: string; repo: string; date: string }[],
    };

    for (const event of events) {
      const repo = event.repo?.name || '';
      stats.repos.add(repo);

      const date = new Date(event.created_at).toISOString().slice(0, 10);

      switch (event.type) {
        case 'PushEvent':
          stats.commits += event.payload?.size || 1;
          stats.recentActivity.push({ type: 'commit', repo, date });
          break;
        case 'PullRequestEvent':
          stats.pullRequests++;
          stats.recentActivity.push({ type: 'pr', repo, date });
          break;
        case 'IssuesEvent':
          stats.issues++;
          stats.recentActivity.push({ type: 'issue', repo, date });
          break;
        default:
          stats.other++;
      }
    }

    const data = {
      hasGitHub: true,
      valid: true,
      username: githubUsername,
      stats: {
        commits: stats.commits,
        pullRequests: stats.pullRequests,
        issues: stats.issues,
        repoCount: stats.repos.size,
      },
      topRepos: [...stats.repos].slice(0, 5),
      recentActivity: stats.recentActivity.slice(0, 10),
    };

    // Cache result
    CACHE.set(githubUsername, { data, expires: Date.now() + CACHE_TTL });

    return createSuccessResponse({ ...data, cached: false });
  } catch (error) {
    console.error('GitHub contributions error:', error);
    return createErrorResponse('Failed to fetch GitHub data', 500);
  }
};
