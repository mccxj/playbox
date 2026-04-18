import type { Env } from '../types';

interface GmailCredentials {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface EmailAttachment {
  filename: string;
  r2_key: string;
  content_type: string;
}

interface SendEmailParams {
  recipients: string[];
  subject: string;
  body: string;
  html_body?: string;
  attachments?: EmailAttachment[];
}

interface SendEmailResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<void>): void;
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateJwt(credentials: GmailCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemKey = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));

  const keyData = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyData, new TextEncoder().encode(unsignedToken));

  const signatureB64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${unsignedToken}.${signatureB64}`;
}

async function getAccessToken(credentials: GmailCredentials): Promise<string> {
  const jwt = await generateJwt(credentials);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

function buildMimeMessage(params: SendEmailParams, fromEmail: string): string {
  const boundary = `mixed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const altBoundary = `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const lines: string[] = [];

  lines.push(`From: ${fromEmail}`);
  lines.push(`To: ${params.recipients.join(', ')}`);
  lines.push(`Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}??`);
  lines.push('MIME-Version: 1.0');

  const hasHtml = params.html_body && params.html_body.length > 0;
  const hasAttachments = params.attachments && params.attachments.length > 0;

  if (hasAttachments) {
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push('');
    lines.push(`--${boundary}`);

    if (hasHtml) {
      lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
      lines.push('');
      lines.push(`--${altBoundary}`);
    }

    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: quoted-printable');
    lines.push('');
    lines.push(params.body);

    if (hasHtml) {
      lines.push('');
      lines.push(`--${altBoundary}`);
      lines.push('Content-Type: text/html; charset=UTF-8');
      lines.push('Content-Transfer-Encoding: quoted-printable');
      lines.push('');
      lines.push(params.html_body!);
      lines.push(`--${altBoundary}--`);
    }

    lines.push('');
    lines.push(`--${boundary}--`);
  } else if (hasHtml) {
    lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
    lines.push('');
    lines.push(`--${altBoundary}`);
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: quoted-printable');
    lines.push('');
    lines.push(params.body);
    lines.push('');
    lines.push(`--${altBoundary}`);
    lines.push('Content-Type: text/html; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: quoted-printable');
    lines.push('');
    lines.push(params.html_body!);
    lines.push(`--${altBoundary}--`);
  } else {
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: quoted-printable');
    lines.push('');
    lines.push(params.body);
  }

  return lines.join('\r\n');
}

export const EmailManager = {
  async getGmailCredentials(env: Env): Promise<GmailCredentials | null> {
    const query = `SELECT content FROM security_keys WHERE type = 'EMAIL' AND provider = 'GMAIL' LIMIT 1`;
    const { results } = await env.PLAYBOX_D1.prepare(query).all();

    if (!results || results.length === 0) {
      return null;
    }

    const row = results[0] as unknown as { content: string };
    return JSON.parse(row.content) as GmailCredentials;
  },

  async sendEmail(env: Env, params: SendEmailParams, ctx: ExecutionContext): Promise<SendEmailResult> {
    try {
      const credentials = await this.getGmailCredentials(env);

      if (!credentials) {
        return {
          success: false,
          error: 'Gmail credentials not configured. Please add EMAIL type credentials to security_keys table.',
        };
      }

      const accessToken = await getAccessToken(credentials);
      const fromEmail = credentials.client_email;
      const mimeMessage = buildMimeMessage(params, fromEmail);
      const rawMessage = btoa(mimeMessage).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawMessage }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Gmail API error: ${error}` };
      }

      const data = (await response.json()) as { id: string };
      return { success: true, message_id: data.id };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  },

  async logEmail(env: Env, params: SendEmailParams, result: SendEmailResult): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.PLAYBOX_D1.prepare(
      `INSERT INTO email_logs (id, recipients, subject, body, attachments, status, error_message, message_id, created_at, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        JSON.stringify(params.recipients),
        params.subject,
        params.body?.slice(0, 10000),
        params.attachments ? JSON.stringify(params.attachments) : null,
        result.success ? 'sent' : 'failed',
        result.error || null,
        result.message_id || null,
        now,
        result.success ? now : null
      )
      .run();

    return id;
  },

  async getEmailLogs(env: Env, page: number = 1, pageSize: number = 20): Promise<{ logs: any[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const countResult = await env.PLAYBOX_D1.prepare('SELECT COUNT(*) as total FROM email_logs').first();
    const total = (countResult as any)?.total || 0;

    const { results } = await env.PLAYBOX_D1.prepare(
      `SELECT id, recipients, subject, body, attachments, status, error_message, message_id, created_at, sent_at
       FROM email_logs
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(pageSize, offset)
      .all();

    return { logs: results || [], total };
  },
};
