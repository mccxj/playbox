import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

const GITHUB_API_BASE = 'https://api.github.com';

function getGitHubToken(): string {
  return process.env.GITHUB_TOKEN || '';
}

function getGitHubHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Playbox-Gist-Manager',
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = getGitHubToken();
    if (!token) {
      return createJsonResponse({ error: 'GITHUB_TOKEN not configured' }, 500);
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '30';

    const url = `${GITHUB_API_BASE}/gists?page=${page}&per_page=${perPage}`;

    const response = await fetch(url, {
      headers: getGitHubHeaders(token),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return createJsonResponse({ error: `GitHub API error: ${response.status} ${errorBody}` }, response.status);
    }

    const gists = await response.json();
    const linkHeader = response.headers.get('Link');
    const totalPages = parseLinkHeaderTotalPages(linkHeader);

    return createJsonResponse({
      success: true,
      gists,
      pagination: {
        page: parseInt(page, 10),
        per_page: parseInt(perPage, 10),
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching gists:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getGitHubToken();
    if (!token) {
      return createJsonResponse({ error: 'GITHUB_TOKEN not configured' }, 500);
    }

    const body = (await request.json()) as {
      description?: string;
      public?: boolean;
      files?: Record<string, { content: string }>;
    };

    if (!body.files || Object.keys(body.files).length === 0) {
      return createJsonResponse({ error: 'At least one file is required' }, 400);
    }

    const githubBody: Record<string, unknown> = {
      description: body.description || '',
      public: body.public !== false,
      files: body.files,
    };

    const response = await fetch(`${GITHUB_API_BASE}/gists`, {
      method: 'POST',
      headers: {
        ...getGitHubHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(githubBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return createJsonResponse({ error: `GitHub API error: ${response.status} ${errorBody}` }, response.status);
    }

    const gist = await response.json();

    return createJsonResponse({ success: true, gist }, 201);
  } catch (error) {
    console.error('Error creating gist:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

function parseLinkHeaderTotalPages(linkHeader: string | null): number | null {
  if (!linkHeader) return null;
  const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
  if (lastMatch) {
    return parseInt(lastMatch[1], 10);
  }
  return null;
}
