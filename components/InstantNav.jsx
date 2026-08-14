'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ROUTES = ['/', '/about', '/skills', '/projects', '/contact'];

/* Prefetches the sibling tabs and exposes window.__nav, which scrap-motion.js calls
   after the page-turn animation finishes — so a tab turn is a client-side transition
   instead of a full document load, while looking exactly the same. */
export default function InstantNav() {
  const router = useRouter();

  useEffect(() => {
    ROUTES.forEach((r) => router.prefetch(r));
    window.__nav = (href) => {
      try { router.push(href); } catch { location.href = href; }
    };
    return () => { delete window.__nav; };
  }, [router]);

  return null;
}
