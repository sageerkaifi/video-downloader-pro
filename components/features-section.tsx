"use client";

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Shield, Zap, Download, FileVideo, Lock, Clock, Gauge, Globe } from 'lucide-react';

const features = [
  {
    icon: Download,
    title: 'Direct URL Downloads',
    description: 'Paste any direct video file link and download instantly. Supports MP4, WebM, MOV, AVI, and more.',
  },
  {
    icon: Shield,
    title: 'Legal Compliance',
    description: 'Built-in rights verification and Terms of Service ensure responsible, compliant usage.',
  },
  {
    icon: Zap,
    title: 'Fast & Reliable',
    description: 'Server-side processing with streaming downloads for optimal speed and reliability.',
  },
  {
    icon: FileVideo,
    title: 'Multiple Formats',
    description: 'Support for 10+ video formats including MP4, WebM, MOV, MKV, FLV, and more.',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'History stored locally in your browser. No data is collected or sent to external servers.',
  },
  {
    icon: Gauge,
    title: 'Progress Tracking',
    description: 'Real-time download progress with percentage and visual indicator for large files.',
  },
  {
    icon: Clock,
    title: 'Download History',
    description: 'Keep track of all your downloads with a local history that persists across sessions.',
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'Fully responsive design that works seamlessly on desktop, tablet, and mobile devices.',
  },
];

export function FeaturesSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="features" ref={ref} className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Everything You Need for{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Video Downloads
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A professional, privacy-respecting tool designed for responsible video downloading.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features?.map?.((feature: any, idx: number) => {
            const Icon = feature?.icon;
            return (
              <motion.div
                key={feature?.title ?? idx}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="group rounded-xl bg-card border border-border/50 p-5 hover:border-primary/20 transition-all cursor-default"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 mb-3 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                  {Icon && <Icon className="h-5 w-5 text-primary" />}
                </div>
                <h3 className="font-display font-semibold text-sm mb-1">{feature?.title ?? ''}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature?.description ?? ''}</p>
              </motion.div>
            );
          }) ?? []}
        </div>
      </div>
    </section>
  );
}
