import { NextRequest, NextResponse } from 'next/server';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import {
  getYtDlpPath,
  isKnownPlatform,
  buildYtDlpArgs,
  createRateLimiter,
  isDirectVideoUrl,
  getRandomUserAgent,
} from '@/lib/yt-dlp-utils';

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const YTDLP = getYtDlpPath();
const checkRateLimit = createRateLimiter(15, 60_000);

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

    const formatId = request?.nextUrl?.searchParams?.get?.('format') || '';
    const audioOnly = request?.nextUrl?.searchParams?.get?.('audioOnly') === 'true';
    const audioFormat = request?.nextUrl?.searchParams?.get?.('audioFormat') || 'mp3';

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl?.protocol)) {
        return NextResponse.json({ error: 'Only HTTP/HTTPS URLs supported.' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
    }

    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const knownPlatform = isKnownPlatform(hostname);
    const pathname = parsedUrl.pathname.toLowerCase();
    const isDirectVideo = isDirectVideoUrl(pathname);

    // ── Try yt-dlp (with retry) ──────────────────────────────────────────────
    const MAX_RETRIES = 2;
    let ytdlpFilename: string | null = null;
    let ytdlpContentType: string | null = null;
    let ytdlpError: string | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (isDirectVideo && !audioOnly) throw new Error('DIRECT_VIDEO_SKIP');

        console.log(`[download] yt-dlp info attempt ${attempt + 1}/${MAX_RETRIES} (binary: ${YTDLP})`);
        const infoArgs = buildYtDlpArgs(url, { infoOnly: true });
        const { stdout } = await execFileAsync(YTDLP, infoArgs, { maxBuffer: 1024 * 1024 * 10, timeout: 30000 });
        const info = JSON.parse(stdout);

        if (audioOnly) {
          const title = info.title?.replace(/[^\w\s-]/gi, '') || 'audio';
          const ext = audioFormat === 'm4a' ? 'm4a' : 'mp3';
          ytdlpFilename = `${title}.${ext}`.replace(/\s+/g, '_');
          ytdlpContentType = ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
        } else {
          const ext = info.ext || 'mp4';
          const title = info.title?.replace(/[^\w\s-]/gi, '') || 'video';
          ytdlpFilename = `${title}.${ext}`.replace(/\s+/g, '_');
          ytdlpContentType = `video/${ext}`;
        }
        break; // success
      } catch (e: any) {
        if (e?.message === 'DIRECT_VIDEO_SKIP') {
          ytdlpError = 'DIRECT_VIDEO_SKIP';
          break;
        }
        const rawStderr = e?.stderr?.trim() || '';
        ytdlpError = rawStderr || e?.message || String(e);
        if (ytdlpError?.startsWith('ERROR: ')) ytdlpError = ytdlpError.substring(7);
        console.error(`[download] yt-dlp info attempt ${attempt + 1} failed:`, ytdlpError);
      }
    }

    // ── Stream via yt-dlp ────────────────────────────────────────────────────
    if (ytdlpFilename && ytdlpContentType) {
      const spawnArgs = buildYtDlpArgs(url, {
        outputStdout: true,
        audioOnly,
        audioFormat: audioOnly ? audioFormat : undefined,
        formatId: (!audioOnly && formatId) ? formatId : undefined,
      });

      const ytProcess = spawn(YTDLP, spawnArgs);

      const stream = new ReadableStream({
        start(controller) {
          ytProcess.stdout.on('data', (chunk) => controller.enqueue(chunk));
          ytProcess.stdout.on('end', () => controller.close());
          ytProcess.stderr.on('data', (d) => console.error('[yt-dlp stderr]', d.toString()));
          ytProcess.on('error', (err) => {
            console.error('[yt-dlp spawn error]', err);
            controller.error(err);
          });
        },
        cancel() {
          ytProcess.kill();
        },
      });

      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': ytdlpContentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(ytdlpFilename)}"`,
          'X-Powered-By': 'yt-dlp',
        },
      });
    }

    // For known video platforms — never fall back to raw fetch
    if (knownPlatform) {
      console.error(`[download] yt-dlp failed for platform ${hostname}:`, ytdlpError);
      return NextResponse.json(
        { error: `Could not download from ${hostname}: ${ytdlpError?.slice(0, 200) ?? 'unknown'}` },
        { status: 422 }
      );
    }

    // ── Fallback: direct fetch for plain file URLs ──────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': getRandomUserAgent() },
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

    const contentType = response?.headers?.get?.('content-type') ?? 'application/octet-stream';

    if (contentType.includes('text/html')) {
      return NextResponse.json(
        { error: 'The URL returned an HTML page, not a video file. Please provide a direct video file link.' },
        { status: 422 }
      );
    }

    const contentLength = response?.headers?.get?.('content-length') ?? '';
    const parts = pathname?.split?.('/') ?? [];
    const filename = parts?.[parts.length - 1] || 'video.mp4';

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    };
    if (contentLength) headers['Content-Length'] = contentLength;

    return new NextResponse(response.body as any, { status: 200, headers });
  } catch (err: any) {
    console.error('download error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
