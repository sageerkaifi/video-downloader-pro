"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileVideo, HardDrive, Film, CheckCircle2, AlertTriangle, Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import type { VideoInfo } from '@/lib/video-utils';
import { addToHistory } from '@/lib/history';
import { toast } from 'sonner';

interface VideoInfoCardProps {
  info: VideoInfo;
  rightsConfirmed: boolean;
  onRightsChange: (val: boolean) => void;
}

export function VideoInfoCard({ info, rightsConfirmed, onRightsChange }: VideoInfoCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const safeInfo = info ?? {} as VideoInfo;

  const handleDownload = async () => {
    if (!rightsConfirmed) {
      toast.error('Please confirm you have rights to download this video.');
      return;
    }

    setDownloading(true);
    setProgress(0);

    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(safeInfo?.url ?? '')}`);
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

      const type = safeInfo?.contentType || 'application/octet-stream';
      const blob = new Blob(chunks, { type: type === 'application/octet-stream' ? 'video/mp4' : type });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      
      let downloadFilename = safeInfo?.filename || 'video';
      if (!downloadFilename.includes('.')) {
        let ext = safeInfo?.format?.toLowerCase() || 'mp4';
        if (ext === 'octet-stream' || ext === 'unknown' || ext.length > 4) {
          ext = 'mp4';
        }
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
        filename: safeInfo?.filename ?? 'video',
        format: safeInfo?.format ?? 'Unknown',
        size: safeInfo?.sizeFormatted ?? 'Unknown',
        downloadedAt: new Date().toISOString(),
        status: 'completed',
      });

      toast.success('Download completed!');
      // Dispatch custom event to notify history panel
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
    <div className="rounded-xl bg-card border border-border/50 overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
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

      {/* Rights confirmation + download */}
      <div className="p-5">
        <label className="flex items-start gap-3 mb-4 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={rightsConfirmed}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onRightsChange?.(e?.target?.checked ?? false)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            I confirm that I have the right or permission to download this video, and I accept the{' '}
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
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Downloading...</span>
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

        <button
          onClick={handleDownload}
          disabled={downloading || !rightsConfirmed}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Downloading... {progress}%
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Video
            </>
          )}
        </button>
      </div>
    </div>
  );
}
