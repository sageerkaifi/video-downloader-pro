"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, ExternalLink, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getHistory, clearHistory, removeFromHistory } from '@/lib/history';
import type { DownloadHistoryItem } from '@/lib/video-utils';
import { toast } from 'sonner';

export function DownloadHistoryPanel() {
  const [items, setItems] = useState<DownloadHistoryItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const loadHistory = useCallback(() => {
    const h = getHistory();
    setItems(h ?? []);
  }, []);

  useEffect(() => {
    setMounted(true);
    loadHistory();
    const handler = () => loadHistory();
    window?.addEventListener?.('vdp-history-update', handler);
    return () => { window?.removeEventListener?.('vdp-history-update', handler); };
  }, [loadHistory]);

  const handleClear = () => {
    clearHistory();
    setItems([]);
    toast.success('History cleared.');
  };

  const handleRemove = (id: string) => {
    removeFromHistory(id);
    loadHistory();
  };

  if (!mounted) return null;

  const displayItems = expanded ? items : items?.slice?.(0, 5) ?? [];

  return (
    <section id="history" className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold tracking-tight">Download History</h2>
            {(items?.length ?? 0) > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-semibold">
                {items?.length ?? 0}
              </span>
            )}
          </div>
          {(items?.length ?? 0) > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>

        {(items?.length ?? 0) === 0 ? (
          <div className="text-center py-12 rounded-xl bg-card border border-border/50" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No downloads yet. Your download history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayItems?.map?.((item: DownloadHistoryItem, idx: number) => (
                <motion.div
                  key={item?.id ?? idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group flex items-center gap-4 rounded-xl bg-card border border-border/50 p-4 hover:border-primary/20 transition-all"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary shrink-0">
                    {item?.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" title={item?.filename ?? ''}>
                      {item?.filename ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item?.format ?? 'N/A'} · {item?.size ?? 'Unknown'} · {formatDate(item?.downloadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={item?.url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary transition-colors"
                      aria-label="Open link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleRemove(item?.id ?? '')}
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )) ?? []}
            </AnimatePresence>

            {(items?.length ?? 0) > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? (
                  <><ChevronUp className="h-4 w-4" /> Show Less</>
                ) : (
                  <><ChevronDown className="h-4 w-4" /> Show All ({items?.length ?? 0})</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(isoStr: string | undefined): string {
  if (!isoStr) return 'Unknown';
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d?.toLocaleDateString?.() ?? 'Unknown';
  } catch {
    return 'Unknown';
  }
}
