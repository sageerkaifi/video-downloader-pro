import { existsSync } from 'fs';
import { formatBytes } from './video-utils';

// ── Binary resolution ──────────────────────────────────────────────────────────

export function getYtDlpPath(): string {
  const candidates = ['/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp', 'yt-dlp'];
  for (const p of candidates) {
    if (p === 'yt-dlp') return p; // fallback: rely on PATH
    if (existsSync(p)) return p;
  }
  return 'yt-dlp';
}

// ── Platform detection ─────────────────────────────────────────────────────────

export const PLATFORM_HOSTNAMES = [
  'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com',
  'facebook.com', 'fb.watch', 'instagram.com', 'twitter.com',
  'x.com', 'tiktok.com', 'twitch.tv', 'bilibili.com',
  'reddit.com', 'streamable.com', 'rumble.com', 'soundcloud.com',
  'bandcamp.com', 'mixcloud.com',
];

export function isKnownPlatform(hostname: string): boolean {
  const h = hostname.replace(/^www\./, '');
  return PLATFORM_HOSTNAMES.some(p => h === p || h.endsWith('.' + p));
}

// ── Rotating user-agents ───────────────────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

let uaIndex = 0;

export function getRandomUserAgent(): string {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua;
}

// ── Player client rotation for YouTube ─────────────────────────────────────────

const PLAYER_CLIENT_COMBOS = [
  'ios,android,web',
  'android,web',
  'ios,web',
  'web',
  'mweb,android',
];

let pcIndex = 0;

export function getPlayerClients(): string {
  const combo = PLAYER_CLIENT_COMBOS[pcIndex % PLAYER_CLIENT_COMBOS.length];
  pcIndex++;
  return combo;
}

// ── Arg builder ────────────────────────────────────────────────────────────────

export interface YtDlpOptions {
  infoOnly?: boolean;        // -j mode
  formatId?: string;         // -f <id>
  audioOnly?: boolean;       // --extract-audio
  audioFormat?: string;      // mp3 | m4a
  listFormats?: boolean;     // include format listing
  outputStdout?: boolean;    // -o - (stream to stdout)
}

export function buildYtDlpArgs(url: string, opts: YtDlpOptions = {}): string[] {
  const args: string[] = [];

  // Base flags
  args.push('--no-warnings', '--no-playlist');

  // YouTube-specific extractor args
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'youtu.be') {
      args.push('--extractor-args', `youtube:player_client=${getPlayerClients()}`);
    }
  } catch { /* ignore */ }

  // User agent
  args.push('--user-agent', getRandomUserAgent());

  // Cookies
  if (existsSync('cookies.txt')) {
    args.push('--cookies', 'cookies.txt');
  }

  // Mode-specific flags
  if (opts.infoOnly) {
    args.push('-j');
  }

  if (opts.audioOnly) {
    args.push('--extract-audio');
    args.push('--audio-format', opts.audioFormat || 'mp3');
    args.push('--audio-quality', '0'); // best quality
  } else if (opts.formatId) {
    // Try to merge with best audio if format is video-only
    args.push('-f', `${opts.formatId}+bestaudio/best/${opts.formatId}`);
  }

  if (opts.outputStdout) {
    args.push('-o', '-');
  }

  args.push(url);
  return args;
}

// ── Format parsing ─────────────────────────────────────────────────────────────

export interface FormatOption {
  formatId: string;
  ext: string;
  resolution: string;
  width: number;
  height: number;
  filesize: number;
  filesizeFormatted: string;
  vcodec: string;
  acodec: string;
  quality: string;
  hasVideo: boolean;
  hasAudio: boolean;
  fps: number;
  tbr: number;          // total bitrate in kbps
}

function qualityLabel(height: number, fps: number): string {
  if (height >= 2160) return '4K Ultra HD';
  if (height >= 1440) return '2K QHD';
  if (height >= 1080) return fps > 30 ? '1080p60 Full HD' : '1080p Full HD';
  if (height >= 720) return fps > 30 ? '720p60 HD' : '720p HD';
  if (height >= 480) return '480p SD';
  if (height >= 360) return '360p';
  if (height >= 240) return '240p';
  if (height >= 144) return '144p';
  return 'Unknown';
}

export function parseFormats(ytdlpJson: any): FormatOption[] {
  const rawFormats = ytdlpJson?.formats;
  if (!Array.isArray(rawFormats)) return [];

  const seen = new Set<string>();
  const result: FormatOption[] = [];

  for (const f of rawFormats) {
    // Skip storyboard/manifest-only formats
    if (f.vcodec === 'none' && f.acodec === 'none') continue;
    if (f.format_note === 'storyboard') continue;
    if (f.protocol === 'm3u8_native' && !f.url) continue;

    const hasVideo = f.vcodec !== 'none' && !!f.vcodec;
    const hasAudio = f.acodec !== 'none' && !!f.acodec;
    const height = f.height || 0;
    const width = f.width || 0;
    const fps = f.fps || 0;
    const ext = f.ext || 'mp4';
    const filesize = f.filesize || f.filesize_approx || 0;

    // Build a dedup key
    const dedupKey = `${height}-${ext}-${hasVideo}-${hasAudio}-${fps > 30 ? '60' : '30'}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    let resolution: string;
    let quality: string;

    if (hasVideo) {
      resolution = height ? `${height}p` : (f.format_note || 'Unknown');
      quality = qualityLabel(height, fps);
    } else {
      resolution = 'Audio only';
      quality = `Audio (${ext.toUpperCase()})`;
    }

    result.push({
      formatId: String(f.format_id || ''),
      ext,
      resolution,
      width,
      height,
      filesize,
      filesizeFormatted: formatBytes(filesize),
      vcodec: f.vcodec || 'none',
      acodec: f.acodec || 'none',
      quality,
      hasVideo,
      hasAudio,
      fps,
      tbr: f.tbr || 0,
    });
  }

  // Sort: highest resolution first, then by bitrate
  result.sort((a, b) => {
    if (a.hasVideo && !b.hasVideo) return -1;
    if (!a.hasVideo && b.hasVideo) return 1;
    if (a.height !== b.height) return b.height - a.height;
    return b.tbr - a.tbr;
  });

  return result;
}

// ── Rate limiter factory ───────────────────────────────────────────────────────

export function createRateLimiter(limit: number, windowMs: number) {
  const map = new Map<string, { count: number; resetTime: number }>();

  return function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = map.get(ip);
    if (!entry || now > entry.resetTime) {
      map.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
  };
}

// ── Supported direct-video extensions ──────────────────────────────────────────

export const DIRECT_VIDEO_EXTENSIONS = [
  'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'ogg', 'ogv', '3gp',
];

export function isDirectVideoUrl(pathname: string): boolean {
  const lc = pathname.toLowerCase();
  return DIRECT_VIDEO_EXTENSIONS.some(ext => lc.endsWith('.' + ext));
}
