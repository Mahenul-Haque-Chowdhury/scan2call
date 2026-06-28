'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Mounts Lenis smooth scrolling for the current layout subtree.
 * Renders nothing; cleans up (and removes Lenis classes) on unmount, so it only
 * affects pages where it is mounted (the public marketing site).
 * Disabled entirely when the user prefers reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      // Leave touch scrolling native for best mobile performance.
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
