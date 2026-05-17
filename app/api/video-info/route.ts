import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getFileExtension, getFilenameFromUrl, formatBytes, SUPPORTED_FORMATS } from '@/lib/video-utils';

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

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

export async function POST(request: NextRequest) {
  try {
    const ip = request?.headers?.get?.('x-forwarded-for') ?? request?.headers?.get?.('x-real-ip') ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const url = body?.url;
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid URL.' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl?.protocol)) {
        return NextResponse.json({ error: 'Only HTTP and HTTPS URLs are supported.' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
    }

    // Attempt to use yt-dlp to get info
    try {
      const { stdout } = await execFileAsync('yt-dlp', ['-j', '--no-warnings', url], { maxBuffer: 1024 * 1024 * 10 });
      const info = JSON.parse(stdout);
      
      const ext = info.ext || 'mp4';
      const title = info.title?.replace(/[^\w\s-]/gi, '') || 'video';
      const size = info.filesize || info.filesize_approx || 0;
      
      return NextResponse.json({
        url,
        filename: `${title}.${ext}`.replace(/\s+/g, '_'),
        format: ext.toUpperCase(),
        size: size,
        sizeFormatted: formatBytes(size),
        contentType: `video/${ext}`,
        isVideo: true,
      });
    } catch (ytError) {
      console.log('yt-dlp failed, falling back to HEAD request:', ytError);
      
      // Fallback: HEAD request to get info for direct URLs if yt-dlp doesn't support the site
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VideoDownloaderPro/1.0)',
          },
          redirect: 'follow',
        });
      } catch (fetchErr: any) {
        clearTimeout(timeout);
        return NextResponse.json(
          { error: fetchErr?.name === 'AbortError' ? 'Request timed out.' : 'Could not reach the URL. Please check the link.' },
          { status: 422 }
        );
      }
      clearTimeout(timeout);

      if (!response.ok) {
        return NextResponse.json({ error: `Server returned status ${response?.status}. The URL may be invalid or restricted.` }, { status: 422 });
      }

      const contentType = response?.headers?.get?.('content-type') ?? '';
      const contentLength = parseInt(response?.headers?.get?.('content-length') ?? '0', 10) || 0;
      const ext = getFileExtension(url);
      const filename = getFilenameFromUrl(url);
      const isVideo = contentType?.includes?.('video') || SUPPORTED_FORMATS.includes(ext);

      const format = ext ? ext.toUpperCase() : (contentType?.split?.('/')?.[1]?.toUpperCase?.() ?? 'Unknown');

      return NextResponse.json({
        url,
        filename,
        format,
        size: contentLength,
        sizeFormatted: formatBytes(contentLength),
        contentType,
        isVideo,
      });
    }
  } catch (err: any) {
    console.error('video-info error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
