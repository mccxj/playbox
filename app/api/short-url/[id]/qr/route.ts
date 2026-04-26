import { NextRequest } from 'next/server';
import { getTypedContext } from '@/lib/cloudflare-context';
import qrcode from 'qrcode-generator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/short-url/[id]/qr
 * Returns a QR code PNG image for the short URL
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return new Response('ID required', { status: 400 });
  }

  try {
    const { env } = getTypedContext();
    const kv = env.PLAYBOX_KV;

    if (!kv) {
      return new Response('Service unavailable', { status: 503 });
    }

    const key = `short_url:${id}`;
    const data = await kv.get(key);

    if (!data) {
      return new Response('Short URL not found or expired', { status: 404 });
    }

    try {
      const shortUrl = `${request.nextUrl.origin}/s/${id}`;

      const qr = qrcode(0, 'M');
      qr.addData(shortUrl);
      qr.make();

      const cellSize = 10;
      const margin = 4;
      const size = qr.getModuleCount() * cellSize + margin * 2;
      const modules = qr.getModuleCount();

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="white"/>
  ${Array.from({ length: modules }, (_, row) =>
    Array.from({ length: modules }, (_, col) =>
      qr.isDark(row, col)
        ? `<rect x="${col * cellSize + margin}" y="${row * cellSize + margin}" width="${cellSize}" height="${cellSize}" fill="black"/>`
        : ''
    ).join('')
  ).join('\n  ')}
</svg>`;

      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch {
      return new Response('Invalid short URL data', { status: 500 });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    return new Response('Service error', { status: 500 });
  }
}
