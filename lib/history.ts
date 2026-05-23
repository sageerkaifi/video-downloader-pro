import { DownloadHistoryItem } from './video-utils';

const HISTORY_KEY = 'vdp_download_history';
const MAX_HISTORY = 50;

export function getHistory(): DownloadHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage?.getItem?.(HISTORY_KEY);
    return raw ? JSON.parse(raw) ?? [] : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: DownloadHistoryItem): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    history.unshift(item);
    const trimmed = history.slice(0, MAX_HISTORY);
    localStorage?.setItem?.(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // silently fail
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage?.removeItem?.(HISTORY_KEY);
  } catch {
    // silently fail
  }
}

export function removeFromHistory(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    const filtered = history?.filter?.((item: DownloadHistoryItem) => item?.id !== id) ?? [];
    localStorage?.setItem?.(HISTORY_KEY, JSON.stringify(filtered));
  } catch {
    // silently fail
  }
}
