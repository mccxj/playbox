import { NextRequest } from 'next/server';
import { getTypedContext } from '@/lib/cloudflare-context';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';
import type nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

interface EmailCredentials {
  user: string;
  pass: string;
  from: string;
}

interface SendEmailRequest {
  recipients: string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: {
    filename: string;
    content: string;
    contentType: string;
  }[];
}

function generateId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

async function sendGmailEmail(
  credentials: EmailCredentials,
  to: string[],
  subject: string,
  text: string,
  html?: string,
  attachments?: SendEmailRequest['attachments']
): Promise<{ success: boolean; error?: string }> {
  const nodemailer = await import('nodemailer');

  const transporter = nodemailer.default.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: credentials.user,
      pass: credentials.pass,
    },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: credentials.from,
    to: to.join(', '),
    subject,
    text,
  };

  if (html) {
    mailOptions.html = html;
  }

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.contentType,
    }));
  }

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = getTypedContext();
    const db = env.PLAYBOX_D1;

    if (!db) {
      return createJsonResponse({ error: 'D1 database not configured' }, 500);
    }

    const body: SendEmailRequest = await request.json();
    const { recipients, subject, body: emailBody, html, attachments } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return createJsonResponse({ error: 'Recipients are required' }, 400);
    }

    if (!subject) {
      return createJsonResponse({ error: 'Subject is required' }, 400);
    }

    if (!emailBody && !html) {
      return createJsonResponse({ error: 'Body content is required' }, 400);
    }

    const credQuery = `SELECT content FROM security_keys WHERE type = 'EMAIL' AND provider = 'GMAIL' LIMIT 1`;
    const credResult = await db.prepare(credQuery).all();

    if (!credResult.results || credResult.results.length === 0) {
      return createJsonResponse(
        { error: 'Gmail credentials not configured. Please add EMAIL type credentials to security_keys table.' },
        400
      );
    }

    const credentials: EmailCredentials = JSON.parse((credResult.results[0] as unknown as { content: string }).content);

    const emailId = generateId();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO email_history (id, recipients, subject, body, html_body, attachments, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        emailId,
        JSON.stringify(recipients),
        subject,
        emailBody || null,
        html || null,
        attachments ? JSON.stringify(attachments) : null,
        'pending',
        now
      )
      .run();

    const result = await sendGmailEmail(credentials, recipients, subject, emailBody || '', html, attachments);

    if (result.success) {
      await db.prepare(`UPDATE email_history SET status = 'sent', sent_at = ? WHERE id = ?`).bind(new Date().toISOString(), emailId).run();

      return createJsonResponse({
        success: true,
        message: 'Email sent successfully',
        emailId,
      });
    } else {
      await db
        .prepare(`UPDATE email_history SET status = 'failed', error = ? WHERE id = ?`)
        .bind(result.error || 'Unknown error', emailId)
        .run();

      return createJsonResponse(
        {
          success: false,
          error: result.error,
          emailId,
        },
        500
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { env } = getTypedContext();
    const db = env.PLAYBOX_D1;

    if (!db) {
      return createJsonResponse({ error: 'D1 database not configured' }, 500);
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');

    const offset = (page - 1) * pageSize;

    const whereClauses: string[] = [];
    const params: string[] = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM email_history ${whereClause}`;
    const countResult = await db
      .prepare(countQuery)
      .bind(...params)
      .all();

    interface CountRow {
      total: number;
    }
    const total = (countResult.results as unknown as CountRow[])[0]?.total || 0;

    const query = `
      SELECT id, recipients, subject, body, html_body, attachments, status, error, created_at, sent_at
      FROM email_history
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, pageSize, offset];
    const result = await db
      .prepare(query)
      .bind(...queryParams)
      .all();

    interface EmailHistoryRow {
      id: string;
      recipients: string;
      subject: string;
      body: string;
      html_body: string | null;
      attachments: string | null;
      status: string;
      error: string | null;
      created_at: string;
      sent_at: string | null;
    }

    const records = (result.results as unknown as EmailHistoryRow[]).map((r) => ({
      id: r.id,
      recipients: JSON.parse(r.recipients),
      subject: r.subject,
      body: r.body,
      htmlBody: r.html_body || undefined,
      attachments: r.attachments ? JSON.parse(r.attachments) : null,
      status: r.status,
      error: r.error || undefined,
      createdAt: r.created_at,
      sentAt: r.sent_at || undefined,
    }));

    return createJsonResponse({
      success: true,
      records,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
