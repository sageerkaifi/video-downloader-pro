"use client";

import { motion } from 'framer-motion';
import { Video, Music } from 'lucide-react';

interface AudioModeToggleProps {
  mode: 'video' | 'audio';
  onChange: (mode: 'video' | 'audio') => void;
  disabled?: boolean;
}

export function AudioModeToggle({ mode, onChange, disabled }: AudioModeToggleProps) {
  return (
    <div className="relative inline-flex items-center rounded-xl bg-secondary/70 p-1" role="radiogroup" aria-label="Download mode">
      {/* Sliding indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-primary to-accent"
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          width: 'calc(50% - 4px)',
          left: mode === 'video' ? '4px' : 'calc(50%)',
        }}
      />

      <button
        role="radio"
        aria-checked={mode === 'video'}
        disabled={disabled}
        onClick={() => onChange('video')}
        className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
          mode === 'video'
            ? 'text-white'
            : 'text-muted-foreground hover:text-foreground'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Video className="h-3.5 w-3.5" />
        Video
      </button>

      <button
        role="radio"
        aria-checked={mode === 'audio'}
        disabled={disabled}
        onClick={() => onChange('audio')}
        className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
          mode === 'audio'
            ? 'text-white'
            : 'text-muted-foreground hover:text-foreground'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Music className="h-3.5 w-3.5" />
        Audio
      </button>
    </div>
  );
}
