"use client";

import { useState, useEffect } from 'react';
import { Download, Moon, Sun, History, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const scrollTo = (id: string) => {
    const el = document?.getElementById?.(id);
    el?.scrollIntoView?.({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const ThemeButton = ({ className = '' }: { className?: string }) => (
    mounted ? (
      <button
        onClick={toggleTheme}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-all overflow-hidden ${className}`}
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === 'dark' ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Sun className="h-4 w-4 text-amber-400" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Moon className="h-4 w-4 text-indigo-500" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Subtle glow ring */}
        <div className={`absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 ${
          theme === 'dark' ? 'shadow-[inset_0_0_8px_hsl(45,90%,60%,0.15)]' : 'shadow-[inset_0_0_8px_hsl(245,75%,58%,0.15)]'
        }`} />
      </button>
    ) : null
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass-card">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <button onClick={() => scrollTo('hero')} className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white transition-transform group-hover:scale-105">
            <Download className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Video Downloader <span className="text-primary">Pro</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scrollTo('hero')}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            Download
          </button>
          <button
            onClick={() => scrollTo('features')}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('history')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <History className="h-4 w-4" />
            History
          </button>
          <ThemeButton className="ml-2" />
        </nav>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeButton />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              <button onClick={() => scrollTo('hero')} className="text-left px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-secondary">Download</button>
              <button onClick={() => scrollTo('features')} className="text-left px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-secondary">Features</button>
              <button onClick={() => scrollTo('history')} className="text-left px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-secondary flex items-center gap-2">
                <History className="h-4 w-4" /> History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
