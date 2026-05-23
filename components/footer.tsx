"use client";

import { useState, useEffect } from 'react';
import { Download, Shield } from 'lucide-react';

export function Footer() {
  const [year, setYear] = useState(2026);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);
  return (
    <footer className="mt-auto border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
              <Download className="h-4 w-4" />
            </div>
            <span className="font-display text-sm font-bold">
              Video Downloader <span className="text-primary">Pro</span>
            </span>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs text-muted-foreground max-w-md">
              This tool is for downloading videos you own or have permission to use. 
              We do not host, store, or distribute any content. All downloads are processed through your browser.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Your privacy is protected. No data is collected or stored externally.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {year} Video Downloader Pro
          </p>
        </div>
      </div>
    </footer>
  );
}
