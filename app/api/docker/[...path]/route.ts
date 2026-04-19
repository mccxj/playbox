/**
 * Docker Hub 代理路由
 *
 * 用于加速中国大陆用户从 Docker Hub 拉取镜像。
 * 将客户端请求透明转发至 registry-1.docker.io，并处理认证流程。
 *
 * 使用方式：
 *   将 docker pull 请求中的 registry-1.docker.io 替换为你的部署域名即可。
 *   例如：docker pull your-domain/v2/library/nginx/manifests/latest
 *
 * 注意事项：
 * - Docker Registry v2 协议需要先请求 /v2/ 获取 WWW-Authenticate 夘认证信息，
 *   再向 auth.docker.io 获取 Bearer token，最后携带 token 访问真实资源。
 * - Cloudflare Workers 免费版有 10万次/天 请求限制，大流量场景请留意配额。
 * - 镜像层（layer）文件较大，Workers 单次请求体限制为 100MB（付费版），
 *   大部分镜像层可通过分段下载（Range 请求）规避此限制。
 * - 本代理不缓存任何数据，每次请求都实时回源。
 */

import { NextRequest } from 'next/server';
import { CORS_HEADERS } from '@/utils/constants';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

/** Docker Hub 相关域名 */
const REGISTRY_HOST = 'https://registry-1.docker.io';
const AUTH_HOST = 'https://auth.docker.io';
/** auth.docker.io 的认证服务标识 */
const AUTH_SERVICE = 'registry.docker.io';

/**
 * 从 WWW-Authenticate 头中提取 Bearer token
 * Docker Registry v2 返回格式如：Bearer realm="https://auth.docker.io/token",service="registry.docker.io",scope="repository:library/nginx:pull"
 */
async function fetchAuthToken(wwwAuthenticate: string): Promise<string> {
  const realmMatch = wwwAuthenticate.match(/realm="([^"]+)"/);
  const serviceMatch = wwwAuthenticate.match(/service="([^"]+)"/);
  const scopeMatch = wwwAuthenticate.match(/scope="([^"]+)"/);

  if (!realmMatch || !serviceMatch) {
    throw new Error(`无法解析 WWW-Authenticate 头: ${wwwAuthenticate}`);
  }

  const params = new URLSearchParams({ service: serviceMatch[1] });
  if (scopeMatch) {
    params.set('scope', scopeMatch[1]);
  }

  const tokenUrl = `${realmMatch[1]}?${params.toString()}`;
  const tokenResp = await fetch(tokenUrl, {
    headers: { 'User-Agent': 'Docker-Proxy/1.0' },
  });

  if (!tokenResp.ok) {
    throw new Error(`获取 token 失败: ${tokenResp.status} ${tokenResp.statusText}`);
  }

  const tokenData = (await tokenResp.json()) as { token?: string; access_token?: string };
  return tokenData.token || tokenData.access_token || '';
}

/**
 * 构建转发到 Docker Hub 的请求头
 * 只转发 Docker 客户端需要的头信息，过滤掉 Hop-by-hop 头
 */
function buildUpstreamHeaders(request: NextRequest, authToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    'User-Agent': 'Docker-Proxy/1.0',
  };

  // 转发 Docker 客户端可能发送的 Accept 头（如 manifest 列表请求）
  const accept = request.headers.get('Accept');
  if (accept) {
    headers['Accept'] = accept;
  }

  // 转发 Range 头以支持分段下载镜像层
  const range = request.headers.get('Range');
  if (range) {
    headers['Range'] = range;
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

/**
 * 构建返回给客户端的响应头
 * 透传 Docker Registry 返回的关键头信息
 */
function buildDownstreamHeaders(upstream: Response): Headers {
  const headers = new Headers();

  // 需要透传的 Docker Registry 响应头
  const passThrough = [
    'Content-Type',
    'Content-Length',
    'Content-Range',
    'Docker-Content-Digest',
    'Docker-Distribution-API-Version',
    'WWW-Authenticate',
    'Location',
    'Link',
    'Accept-Ranges',
  ];

  for (const header of passThrough) {
    const value = upstream.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  }

  // 添加 CORS 头以支持浏览器端调用
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }

  return headers;
}

/**
 * 通用代理处理器：将请求转发到 Docker Hub
 *
 * 流程：
 * 1. 构建上游 URL 并发送无认证请求
 * 2. 如果返回 401，从 WWW-Authenticate 头获取认证信息
 * 3. 向 auth.docker.io 请求 Bearer token
 * 4. 携带 token 重新请求上游资源
 * 5. 透传响应给客户端
 */
async function proxyRequest(request: NextRequest, method: string): Promise<Response> {
  // 提取客户端请求的路径，例如 /v2/library/nginx/manifests/latest
  const path = request.nextUrl.pathname.replace(/^\/api\/docker/, '');
  const upstreamUrl = `${REGISTRY_HOST}${path}`;

  // 第一次请求（无认证），试探是否需要认证
  const initialHeaders = buildUpstreamHeaders(request);
  let upstreamResp = await fetch(upstreamUrl, {
    method,
    headers: initialHeaders,
    redirect: 'manual', // 不自动跟随重定向，手动处理以修改 Location 头
  });

  // 如果需要认证（Docker Registry v2 标准流程）
  if (upstreamResp.status === 401) {
    const wwwAuthenticate = upstreamResp.headers.get('WWW-Authenticate');
    if (!wwwAuthenticate) {
      return createJsonResponse({ error: '上游返回 401 但未提供认证信息' }, 502);
    }

    // 获取 Bearer token
    const token = await fetchAuthToken(wwwAuthenticate);

    // 携带 token 重新请求
    const authHeaders = buildUpstreamHeaders(request, token);
    upstreamResp = await fetch(upstreamUrl, {
      method,
      headers: authHeaders,
      redirect: 'manual',
    });
  }

  // 处理上游重定向（如镜像层下载可能返回 307 到 CDN）
  if (upstreamResp.status >= 300 && upstreamResp.status < 400) {
    const location = upstreamResp.headers.get('Location');
    if (location) {
      // 重定向到原始 Docker CDN 地址，客户端直接访问
      // 注意：这意味着客户端需要能直接访问 Docker CDN，
      // 如需完全代理，可改为递归转发（但会增加 Worker 流量消耗）
      const headers = new Headers();
      headers.set('Location', location);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        headers.set(key, value);
      }
      return new Response(null, { status: upstreamResp.status, headers });
    }
  }

  // 非 2xx/3xx 且非预期状态码时返回错误
  if (!upstreamResp.ok && upstreamResp.status !== 206) {
    const errorBody = await upstreamResp.text().catch(() => '');
    console.error(`Docker Hub 代理错误: ${upstreamResp.status} ${upstreamResp.statusText} path=${path}`);
    return createJsonResponse(
      {
        error: `Docker Hub 请求失败: ${upstreamResp.status} ${upstreamResp.statusText}`,
        details: errorBody || undefined,
      },
      upstreamResp.status
    );
  }

  const responseHeaders = buildDownstreamHeaders(upstreamResp);

  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    headers: responseHeaders,
  });
}

/** GET 请求处理 — 拉取 manifest、镜像层等 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    return await proxyRequest(request, 'GET');
  } catch (error) {
    console.error('Docker Hub 代理异常:', error);
    return createInternalErrorResponse(error instanceof Error ? error.message : '代理请求失败');
  }
}

/** HEAD 请求处理 — 检查 manifest/层是否存在 */
export async function HEAD(request: NextRequest): Promise<Response> {
  try {
    return await proxyRequest(request, 'HEAD');
  } catch (error) {
    console.error('Docker Hub 代理异常:', error);
    return createInternalErrorResponse(error instanceof Error ? error.message : '代理请求失败');
  }
}

/** POST 请求处理 — 支持推送（push）场景，一般代理只读即可 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    return await proxyRequest(request, 'POST');
  } catch (error) {
    console.error('Docker Hub 代理异常:', error);
    return createInternalErrorResponse(error instanceof Error ? error.message : '代理请求失败');
  }
}

/** PUT 请求处理 — 支持推送层/manifest */
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    return await proxyRequest(request, 'PUT');
  } catch (error) {
    console.error('Docker Hub 代理异常:', error);
    return createInternalErrorResponse(error instanceof Error ? error.message : '代理请求失败');
  }
}

/** DELETE 请求处理 — 删除 manifest 等 */
export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    return await proxyRequest(request, 'DELETE');
  } catch (error) {
    console.error('Docker Hub 代理异常:', error);
    return createInternalErrorResponse(error instanceof Error ? error.message : '代理请求失败');
  }
}

/** OPTIONS 预检请求 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
