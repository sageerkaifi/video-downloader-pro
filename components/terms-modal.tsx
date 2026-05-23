"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsModal({ open, onClose, onAccept }: TermsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg rounded-xl bg-card border border-border" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold">Terms of Service</h2>
                </div>
                <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-foreground text-sm font-medium">
                    Please read and accept these terms before using Video Downloader Pro.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">1. Acceptable Use</h3>
                  <p>This tool is designed for downloading videos that you own, have created, or have explicit permission to download. You are solely responsible for ensuring that your use of this service complies with all applicable laws and regulations.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">2. Copyright Compliance</h3>
                  <p>You must not use this service to download copyrighted content without authorization from the rights holder. Unauthorized downloading of copyrighted material may violate copyright laws in your jurisdiction.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">3. No Liability</h3>
                  <p>Video Downloader Pro is provided as-is. We do not host, store, or distribute any video content. We are not responsible for any content downloaded through this service or any consequences arising from its use.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">4. Rate Limiting</h3>
                  <p>To prevent abuse, this service implements rate limiting. Excessive or automated requests may be temporarily blocked.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">5. Data Privacy</h3>
                  <p>Download history is stored locally in your browser. We do not collect, store, or transmit any personal data or download records to external servers.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-5 border-t border-border/50">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={onAccept}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:opacity-90 transition-all"
                >
                  I Accept
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
