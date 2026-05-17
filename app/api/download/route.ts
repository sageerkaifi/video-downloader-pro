import { NextRequest, NextResponse } from 'next/server';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

// Rate limiter shared
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const ip = request?.headers?.get?.('x-forwarded-for') ?? request?.headers?.get?.('x-real-ip') ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const url = request?.nextUrl?.searchParams?.get?.('url');
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing URL parameter.' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl?.protocol)) {
        return NextResponse.json({ error: 'Only HTTP/HTTPS URLs supported.' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
    }

    // Attempt to extract info with yt-dlp first
    let isYtDlp = false;
    let filename = 'video.mp4';
    let contentType = 'video/mp4';

    try {
      const { stdout } = await execFileAsync('yt-dlp', ['-j', '--no-warnings', url], { maxBuffer: 1024 * 1024 * 10 });
      const info = JSON.parse(stdout);
      const ext = info.ext || 'mp4';
      const title = info.title?.replace(/[^\w\s-]/gi, '') || 'video';
      filename = `${title}.${ext}`.replace(/\s+/g, '_');
      contentType = `video/${ext}`;
      isYtDlp = true;
    } catch (e) {
      isYtDlp = false;
    }

    if (isYtDlp) {
      const ytProcess = spawn('yt-dlp', ['-o', '-', '--no-warnings', url]);
      
      const stream = new ReadableStream({
        start(controller) {
          ytProcess.stdout.on('data', chunk => {
            controller.enqueue(chunk);
          });
          ytProcess.stdout.on('end', () => {
            controller.close();
          });
          ytProcess.on('error', err => {
            controller.error(err);
          });
        },
        cancel() {
          ytProcess.kill();
        }
      });

      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    // Fallback logic for direct URLs not supported by yt-dlp
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VideoDownloaderPro/1.0)',
        },
        redirect: 'follow',
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      return NextResponse.json(
        { error: fetchErr?.name === 'AbortError' ? 'Download timed out.' : 'Could not reach URL.' },
        { status: 422 }
      );
    }
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ error: `Server returned ${response?.status}.` }, { status: 422 });
    }

    contentType = response?.headers?.get?.('content-type') ?? 'application/octet-stream';
    const contentLength = response?.headers?.get?.('content-length') ?? '';
    const pathname = parsedUrl?.pathname ?? '';
    const parts = pathname?.split?.('/') ?? [];
    filename = parts?.[parts.length - 1] || 'video.mp4';

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    };
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    // Stream the response
    return new NextResponse(response.body as any, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('download error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
