"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Film, Music2, Sparkles, HardDrive } from 'lucide-react';
import type { FormatOption } from '@/lib/video-utils';
import { formatBytes } from '@/lib/video-utils';

interface FormatSelectorProps {
  formats: FormatOption[];
  selectedFormatId: string;
  onSelect: (formatId: string) => void;
  audioMode?: boolean;
  disabled?: boolean;
}

interface FormatGroup {
  label: string;
  icon: React.ReactNode;
  formats: FormatOption[];
}

function groupFormats(formats: FormatOption[], audioMode: boolean): FormatGroup[] {
  if (audioMode) {
    const audioFormats = formats.filter(f => !f.hasVideo || f.resolution === 'Audio only');
    if (audioFormats.length === 0) return [];
    return [{
      label: 'Audio Formats',
      icon: <Music2 className="h-3.5 w-3.5" />,
      formats: audioFormats,
    }];
  }

  const groups: FormatGroup[] = [];
  const hd4k = formats.filter(f => f.hasVideo && f.height >= 1440);
  const hd = formats.filter(f => f.hasVideo && f.height >= 720 && f.height < 1440);
  const sd = formats.filter(f => f.hasVideo && f.height > 0 && f.height < 720);

  if (hd4k.length > 0) groups.push({ label: '4K / 2K Ultra', icon: <Sparkles className="h-3.5 w-3.5" />, formats: hd4k });
  if (hd.length > 0) groups.push({ label: 'HD Quality', icon: <Film className="h-3.5 w-3.5" />, formats: hd });
  if (sd.length > 0) groups.push({ label: 'Standard', icon: <HardDrive className="h-3.5 w-3.5" />, formats: sd });

  return groups;
}

export function FormatSelector({ formats, selectedFormatId, onSelect, audioMode = false, disabled = false }: FormatSelectorProps) {
  const [open, setOpen] = useState(false);
  const groups = groupFormats(formats, audioMode);
  const selected = formats.find(f => f.formatId === selectedFormatId);
  const hasFormats = groups.some(g => g.formats.length > 0);

  if (!hasFormats) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
        <Film className="h-3.5 w-3.5" />
        <span>{audioMode ? 'Audio extraction uses best available quality' : 'Single format available — best quality will be used'}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/70 border border-border/50 text-sm transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {audioMode ? <Music2 className="h-4 w-4 text-primary shrink-0" /> : <Film className="h-4 w-4 text-primary shrink-0" />}
          <span className="truncate font-medium">
            {selected ? (
              <>
                {selected.quality}
                <span className="text-muted-foreground font-normal ml-1.5">
                  {selected.ext.toUpperCase()} · {selected.filesizeFormatted !== 'Unknown size' ? selected.filesizeFormatted : ''}
                </span>
              </>
            ) : (
              audioMode ? 'Best audio quality' : 'Best quality (auto)'
            )}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl bg-card border border-border/50 overflow-hidden max-h-64 overflow-y-auto"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            {/* Best quality option */}
            <button
              onClick={() => { onSelect(''); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-secondary/50 transition-colors ${
                !selectedFormatId ? 'bg-primary/5 text-primary font-semibold' : 'text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{audioMode ? 'Best audio quality (auto)' : 'Best quality (auto)'}</span>
            </button>

            {groups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-t border-border/30">
                  {group.icon}
                  {group.label}
                </div>
                {group.formats.map((fmt) => (
                  <button
                    key={fmt.formatId}
                    onClick={() => { onSelect(fmt.formatId); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-secondary/50 transition-colors ${
                      selectedFormatId === fmt.formatId ? 'bg-primary/5 text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {fmt.ext.toUpperCase()}
                      </span>
                      <span className="truncate">{fmt.quality}</span>
                      {fmt.fps > 30 && (
                        <span className="px-1 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-semibold">
                          {fmt.fps}fps
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground font-mono text-[10px] shrink-0">
                      {fmt.filesizeFormatted !== 'Unknown size' ? fmt.filesizeFormatted : ''}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-away overlay */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
