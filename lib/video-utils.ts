import type { FormatOption } from './yt-dlp-utils';

export type { FormatOption };

export const SUPPORTED_FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'ogg', 'ogv', '3gp'];

export const AUDIO_FORMATS = ['mp3', 'm4a', 'aac', 'opus', 'wav', 'flac'];

export const FORMAT_LABELS: Record<string, string> = {
  mp4: 'MP4',
  webm: 'WebM',
  mov: 'MOV',
  avi: 'AVI',
  mkv: 'MKV',
  flv: 'FLV',
  wmv: 'WMV',
  m4v: 'M4V',
  ogg: 'OGG',
  ogv: 'OGV',
  '3gp': '3GP',
  mp3: 'MP3',
  m4a: 'M4A',
  aac: 'AAC',
  opus: 'OPUS',
  wav: 'WAV',
  flac: 'FLAC',
};

export function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed?.protocol)) return false;
    const ext = getFileExtension(url);
    if (ext && SUPPORTED_FORMATS.includes(ext)) return true;
    // Allow URLs that might be video even without extension
    return true;
  } catch {
    return false;
  }
}

export function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url)?.pathname ?? '';
    const lastDot = pathname?.lastIndexOf?.('.') ?? -1;
    if (lastDot === -1) return '';
    return pathname?.slice?.(lastDot + 1)?.toLowerCase?.()?.split?.('?')?.[0] ?? '';
  } catch {
    return '';
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i))?.toFixed?.(2) ?? '0'} ${sizes?.[i] ?? 'Bytes'}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url)?.pathname ?? '';
    const parts = pathname?.split?.('/') ?? [];
    const filename = parts?.[parts.length - 1] ?? '';
    return decodeURIComponent(filename) || 'video';
  } catch {
    return 'video';
  }
}

export interface VideoInfo {
  url: string;
  filename: string;
  format: string;
  size: number;
  sizeFormatted: string;
  contentType: string;
  isVideo: boolean;
  /** Available quality/format options from yt-dlp */
  formats?: FormatOption[];
  /** Thumbnail URL from yt-dlp */
  thumbnail?: string;
  /** Duration in seconds */
  duration?: number;
  /** Whether this URL is a known video platform (enables audio extraction + quality selection) */
  isPlatform: boolean;
}

export interface DownloadHistoryItem {
  id: string;
  url: string;
  filename: string;
  format: string;
  size: string;
  downloadedAt: string;
  status: 'completed' | 'failed';
}
