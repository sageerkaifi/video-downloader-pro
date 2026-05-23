"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileVideo, HardDrive, Film, CheckCircle2, AlertTriangle,
  Loader2, ExternalLink, Copy, Check, Clock, Music,
} from 'lucide-react';
import type { VideoInfo } from '@/lib/video-utils';
import { formatDuration } from '@/lib/video-utils';
import { addToHistory } from '@/lib/history';
import { toast } from 'sonner';
import { AudioModeToggle } from './audio-mode-toggle';
import { FormatSelector } from './format-selector';

interface VideoInfoCardProps {
  info: VideoInfo;
  rightsConfirmed: boolean;
  onRightsChange: (val: boolean) => void;
}

export function VideoInfoCard({ info, rightsConfirmed, onRightsChange }: VideoInfoCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloadMode, setDownloadMode] = useState<'video' | 'audio'>('video');
  const [selectedFormatId, setSelectedFormatId] = useState('');
  const [audioFormat, setAudioFormat] = useState<'mp3' | 'm4a'>('mp3');

  const safeInfo = info ?? {} as VideoInfo;
  const isPlatform = safeInfo.isPlatform ?? false;
  const formats = safeInfo.formats ?? [];
  const duration = formatDuration(safeInfo.duration ?? 0);
  const thumbnail = safeInfo.thumbnail;

  const handleDownload = async () => {
    if (!rightsConfirmed) {
      toast.error('Please confirm you have rights to download this video.');
      return;
    }

    setDownloading(true);
    setProgress(0);

    try {
      const params = new URLSearchParams({ url: safeInfo?.url ?? '' });
      if (downloadMode === 'audio') {
        params.set('audioOnly', 'true');
        params.set('audioFormat', audioFormat);
      } else if (selectedFormatId) {
        params.set('format', selectedFormatId);
      }

      const response = await fetch(`/api/download?${params.toString()}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error ?? 'Download failed.');
      }

      const contentLength = parseInt(response?.headers?.get?.('content-length') ?? '0', 10);
      const reader = response?.body?.getReader?.();
      if (!reader) throw new Error('Could not start download stream.');

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value?.length ?? 0;
          if (contentLength > 0) {
            setProgress(Math.min(Math.round((received / contentLength) * 100), 99));
          } else {
            setProgress(Math.min(received / 1024 / 10, 95));
          }
        }
      }

      setProgress(100);

      const isAudio = downloadMode === 'audio';
      const type = isAudio
        ? (audioFormat === 'm4a' ? 'audio/mp4' : 'audio/mpeg')
        : (safeInfo?.contentType || 'application/octet-stream');
      const blob = new Blob(chunks, { type: type === 'application/octet-stream' ? 'video/mp4' : type });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;

      let downloadFilename = safeInfo?.filename || (isAudio ? 'audio' : 'video');
      if (isAudio) {
        // Replace video extension with audio extension
        const dotIdx = downloadFilename.lastIndexOf('.');
        const base = dotIdx > 0 ? downloadFilename.substring(0, dotIdx) : downloadFilename;
        downloadFilename = `${base}.${audioFormat}`;
      } else if (!downloadFilename.includes('.')) {
        let ext = safeInfo?.format?.toLowerCase() || 'mp4';
        if (ext === 'octet-stream' || ext === 'unknown' || ext.length > 4) ext = 'mp4';
        downloadFilename = `${downloadFilename}.${ext}`;
      }
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      // Add to history
      addToHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: safeInfo?.url ?? '',
        filename: downloadFilename,
        format: isAudio ? audioFormat.toUpperCase() : (safeInfo?.format ?? 'Unknown'),
        size: safeInfo?.sizeFormatted ?? 'Unknown',
        downloadedAt: new Date().toISOString(),
        status: 'completed',
      });

      toast.success(isAudio ? 'Audio extraction completed!' : 'Download completed!');
      window?.dispatchEvent?.(new Event('vdp-history-update'));
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error(err?.message ?? 'Download failed.');
      addToHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: safeInfo?.url ?? '',
        filename: safeInfo?.filename ?? 'video',
        format: safeInfo?.format ?? 'Unknown',
        size: safeInfo?.sizeFormatted ?? 'Unknown',
        downloadedAt: new Date().toISOString(),
        status: 'failed',
      });
      window?.dispatchEvent?.(new Event('vdp-history-update'));
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator?.clipboard?.writeText?.(safeInfo?.url ?? '');
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link.');
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 overflow-hidden gradient-border-hover" style={{ boxShadow: 'var(--shadow-md)' }}>
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative w-full aspect-video bg-secondary overflow-hidden">
          <img
            src={thumbnail}
            alt={safeInfo?.filename ?? 'Video thumbnail'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-mono">
              <Clock className="h-3 w-3" />
              {duration}
            </div>
          )}
          {/* Platform badge */}
          {isPlatform && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-primary/90 text-white text-[10px] font-semibold uppercase tracking-wider">
              Platform
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {safeInfo?.isVideo ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {safeInfo?.isVideo ? 'Video file detected' : 'File detected (may not be video)'}
              </span>
            </div>
            <h3 className="font-display font-semibold text-lg truncate" title={safeInfo?.filename ?? 'Unknown'}>
              {safeInfo?.filename ?? 'Unknown file'}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              aria-label="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
            <a
              href={safeInfo?.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              aria-label="Open original"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-3 divide-x divide-border/50 border-b border-border/50">
        <div className="p-4 text-center">
          <Film className="h-5 w-5 mx-auto mb-1.5 text-primary" />
          <p className="text-xs text-muted-foreground mb-0.5">Format</p>
          <p className="font-mono text-sm font-semibold">{safeInfo?.format ?? 'N/A'}</p>
        </div>
        <div className="p-4 text-center">
          <HardDrive className="h-5 w-5 mx-auto mb-1.5 text-primary" />
          <p className="text-xs text-muted-foreground mb-0.5">Size</p>
          <p className="font-mono text-sm font-semibold">{safeInfo?.sizeFormatted ?? 'Unknown'}</p>
        </div>
        <div className="p-4 text-center">
          <FileVideo className="h-5 w-5 mx-auto mb-1.5 text-primary" />
          <p className="text-xs text-muted-foreground mb-0.5">Type</p>
          <p className="font-mono text-sm font-semibold truncate" title={safeInfo?.contentType ?? 'N/A'}>
            {safeInfo?.contentType?.split?.('/')?.[1]?.toUpperCase?.() ?? 'N/A'}
          </p>
        </div>
      </div>

      {/* Download options */}
      <div className="p-5 space-y-4">
        {/* Mode toggle + format selector */}
        {isPlatform && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Download mode</span>
              <AudioModeToggle mode={downloadMode} onChange={setDownloadMode} />
            </div>

            {/* Audio format selector (only in audio mode) */}
            {downloadMode === 'audio' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-muted-foreground shrink-0">Format:</span>
                <div className="flex gap-1">
                  {(['mp3', 'm4a'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setAudioFormat(fmt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        audioFormat === fmt
                          ? 'bg-gradient-to-r from-primary to-accent text-white'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {audioFormat === 'mp3' ? 'Most compatible' : 'Better quality (AAC)'}
                </span>
              </motion.div>
            )}

            {/* Quality selector (only in video mode with formats) */}
            {downloadMode === 'video' && formats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Quality</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{formats.length} options</span>
                </div>
                <FormatSelector
                  formats={formats}
                  selectedFormatId={selectedFormatId}
                  onSelect={setSelectedFormatId}
                />
              </motion.div>
            )}
          </div>
        )}

        {/* Not-platform notice */}
        {!isPlatform && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
            <FileVideo className="h-3.5 w-3.5 shrink-0" />
            <span>Direct file URL — downloading original quality. Audio extraction requires a platform URL (YouTube, etc.).</span>
          </div>
        )}

        {/* Rights confirmation */}
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={rightsConfirmed}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onRightsChange?.(e?.target?.checked ?? false)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            I confirm that I have the right or permission to download this {downloadMode === 'audio' ? 'audio' : 'video'}, and I accept the{' '}
            <button
              onClick={(e: React.MouseEvent) => { e?.preventDefault?.(); e?.stopPropagation?.(); }}
              className="text-primary hover:underline"
            >
              Terms of Service
            </button>
          </span>
        </label>

        {/* Progress bar */}
        {downloading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {downloadMode === 'audio' ? 'Extracting audio...' : 'Downloading...'}
              </span>
              <span className="font-mono text-xs font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading || !rightsConfirmed}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all animate-pulse-glow"
          style={{ animationPlayState: rightsConfirmed && !downloading ? 'running' : 'paused' }}
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {downloadMode === 'audio' ? 'Extracting...' : 'Downloading...'} {progress}%
            </>
          ) : (
            <>
              {downloadMode === 'audio' ? <Music className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {downloadMode === 'audio' ? 'Extract Audio' : 'Download Video'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
