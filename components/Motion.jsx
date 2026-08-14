'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initScrapMotion, rescan } from './scrap-motion';

export default function Motion() {
  const pathname = usePathname();

  useEffect(() => { initScrapMotion(); }, []);

  useEffect(() => {
    // first mount is handled by initScrapMotion; later pathname changes re-arm
    const t = setTimeout(() => rescan(), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
