"use client";

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Link2, X, Clipboard, AlertCircle, CheckCircle2, Loader2, Shield, FileVideo } from 'lucide-react';
import { isValidVideoUrl } from '@/lib/video-utils';
import { VideoInfoCard } from './video-info-card';
import { DownloadHistoryPanel } from './download-history-panel';
import { TermsModal } from './terms-modal';
import type { VideoInfo } from '@/lib/video-utils';
import { toast } from 'sonner';

export function HeroSection() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [showTos, setShowTos] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check localStorage for TOS
  const checkTos = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage?.getItem?.('vdp_tos_accepted') === 'true';
    } catch { return false; }
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator?.clipboard?.readText?.();
      if (text) setUrl(text);
    } catch {
      toast.error('Could not read clipboard. Please paste manually.');
    }
  };

  const handleClear = () => {
    setUrl('');
    setVideoInfo(null);
    setError('');
    setRightsConfirmed(false);
    inputRef?.current?.focus?.();
  };

  const handleAnalyze = async () => {
    setError('');
    setVideoInfo(null);

    if (!url?.trim?.()) {
      setError('Please enter a video URL.');
      return;
    }

    if (!isValidVideoUrl(url?.trim?.())) {
      setError('Please enter a valid HTTP or HTTPS URL.');
      return;
    }

    // Check TOS
    if (!checkTos() && !tosAccepted) {
      setShowTos(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url?.trim?.() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? 'Failed to analyze the video URL.');
        return;
      }
      setVideoInfo(data);
    } catch (err: any) {
      console.error('Analyze error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTosAccept = () => {
    setTosAccepted(true);
    setShowTos(false);
    if (typeof window !== 'undefined') {
      try { localStorage?.setItem?.('vdp_tos_accepted', 'true'); } catch {}
    }
    // Re-trigger analyze
    setTimeout(() => handleAnalyze(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e?.key === 'Enter') handleAnalyze();
  };

  return (
    <>
      <section id="hero" className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-b from-primary/8 to-transparent blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-t from-accent/6 to-transparent blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Download Videos &amp; Extract Audio from{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Any URL
              </span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Paste any video link to download in your preferred quality, or extract audio as MP3. Supports YouTube, Vimeo, 1000+ sites and direct file URLs.
            </p>
          </motion.div>

          {/* URL Input area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto max-w-3xl"
          >
            <div className="relative rounded-xl glass-card p-1.5" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="url"
                    value={url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUrl(e?.target?.value ?? ''); setError(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste video URL here (e.g., https://youtube.com/watch?v=... or direct .mp4 link)"
                    className="w-full rounded-lg bg-secondary/50 py-3.5 pl-11 pr-20 text-sm sm:text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {url && (
                      <button
                        onClick={handleClear}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                        aria-label="Clear"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={handlePaste}
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                      aria-label="Paste from clipboard"
                    >
                      <Clipboard className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-3.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileVideo className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{loading ? 'Analyzing...' : 'Analyze'}</span>
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Only download videos you own or have permission to use</span>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Video info card */}
            {videoInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <VideoInfoCard
                  info={videoInfo}
                  rightsConfirmed={rightsConfirmed}
                  onRightsChange={setRightsConfirmed}
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Download history */}
      <DownloadHistoryPanel />

      {/* Terms modal */}
      <TermsModal
        open={showTos}
        onClose={() => setShowTos(false)}
        onAccept={handleTosAccept}
      />
    </>
  );
}
