import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getFileExtension, getFilenameFromUrl, formatBytes, SUPPORTED_FORMATS } from '@/lib/video-utils';
import {
  getYtDlpPath,
  isKnownPlatform,
  buildYtDlpArgs,
  parseFormats,
  createRateLimiter,
  isDirectVideoUrl,
  getRandomUserAgent,
} from '@/lib/yt-dlp-utils';

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const YTDLP = getYtDlpPath();
const checkRateLimit = createRateLimiter(30, 60_000);

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

    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const knownPlatform = isKnownPlatform(hostname);
    const pathname = parsedUrl.pathname.toLowerCase();
    const isDirectVideo = isDirectVideoUrl(pathname);

    // ── Try yt-dlp (with retry) ──────────────────────────────────────────────
    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (isDirectVideo) throw new Error('DIRECT_VIDEO_SKIP');

        console.log(`[video-info] yt-dlp attempt ${attempt + 1}/${MAX_RETRIES} (binary: ${YTDLP})`);
        const args = buildYtDlpArgs(url, { infoOnly: true });

        const { stdout } = await execFileAsync(YTDLP, args, { maxBuffer: 1024 * 1024 * 10, timeout: 30000 });
        const info = JSON.parse(stdout);

        const ext = info.ext || 'mp4';
        const title = info.title?.replace(/[^\w\s-]/gi, '') || 'video';
        const size = info.filesize || info.filesize_approx || 0;
        const formats = parseFormats(info);

        return NextResponse.json({
          url,
          filename: `${title}.${ext}`.replace(/\s+/g, '_'),
          format: ext.toUpperCase(),
          size,
          sizeFormatted: formatBytes(size),
          contentType: `video/${ext}`,
          isVideo: true,
          formats,
          thumbnail: info.thumbnail || null,
          duration: info.duration || 0,
          isPlatform: true,
        });
      } catch (ytError: any) {
        if (ytError?.message === 'DIRECT_VIDEO_SKIP') break;

        const rawStderr = ytError?.stderr?.trim() || '';
        console.log(`[video-info] yt-dlp attempt ${attempt + 1} failed:`, rawStderr || ytError?.message || String(ytError));

        // On last attempt for known platforms, return error
        if (attempt === MAX_RETRIES - 1 && knownPlatform) {
          let errMsg = rawStderr || ytError?.message || 'unknown';
          if (errMsg.startsWith('ERROR: ')) errMsg = errMsg.substring(7);
          return NextResponse.json(
            { error: `Could not retrieve info from ${hostname}: ${errMsg.slice(0, 150)}` },
            { status: 422 }
          );
        }
        // If not last attempt, retry with different UA/player client (happens automatically via rotation)
      }
    }

    // ── Fallback: HEAD request for direct URLs ───────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': getRandomUserAgent() },
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

    if (contentType.includes('text/html')) {
      return NextResponse.json(
        { error: 'The URL returned an HTML page, not a video file. Please provide a direct video file link or supported platform URL.' },
        { status: 422 }
      );
    }

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
      formats: [],
      thumbnail: null,
      duration: 0,
      isPlatform: false,
    });
  } catch (err: any) {
    console.error('video-info error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
