import { NextRequest } from 'next/server';
import { createJsonResponse, createNotFoundResponse, createInternalErrorResponse } from '@/lib/response-helpers';

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getGitHubToken();
    if (!token) {
      return createJsonResponse({ error: 'GITHUB_TOKEN not configured' }, 500);
    }

    const { id } = await params;

    const response = await fetch(`${GITHUB_API_BASE}/gists/${id}`, {
      headers: getGitHubHeaders(token),
    });

    if (response.status === 404) {
      return createNotFoundResponse('Gist not found');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      return createJsonResponse({ error: `GitHub API error: ${response.status} ${errorBody}` }, response.status);
    }

    const gist = await response.json();

    return createJsonResponse({ success: true, gist });
  } catch (error) {
    console.error('Error fetching gist:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getGitHubToken();
    if (!token) {
      return createJsonResponse({ error: 'GITHUB_TOKEN not configured' }, 500);
    }

    const { id } = await params;

    const body = (await request.json()) as {
      description?: string;
      files?: Record<string, { content: string } | null>;
    };

    if (!body.files || Object.keys(body.files).length === 0) {
      return createJsonResponse({ error: 'At least one file is required' }, 400);
    }

    const githubBody: Record<string, unknown> = {};
    if (body.description !== undefined) {
      githubBody.description = body.description;
    }
    githubBody.files = body.files;

    const response = await fetch(`${GITHUB_API_BASE}/gists/${id}`, {
      method: 'PATCH',
      headers: {
        ...getGitHubHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(githubBody),
    });

    if (response.status === 404) {
      return createNotFoundResponse('Gist not found');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      return createJsonResponse({ error: `GitHub API error: ${response.status} ${errorBody}` }, response.status);
    }

    const gist = await response.json();

    return createJsonResponse({ success: true, gist });
  } catch (error) {
    console.error('Error updating gist:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getGitHubToken();
    if (!token) {
      return createJsonResponse({ error: 'GITHUB_TOKEN not configured' }, 500);
    }

    const { id } = await params;

    const response = await fetch(`${GITHUB_API_BASE}/gists/${id}`, {
      method: 'DELETE',
      headers: getGitHubHeaders(token),
    });

    if (response.status === 404) {
      return createNotFoundResponse('Gist not found');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      return createJsonResponse({ error: `GitHub API error: ${response.status} ${errorBody}` }, response.status);
    }

    return createJsonResponse({ success: true });
  } catch (error) {
    console.error('Error deleting gist:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
