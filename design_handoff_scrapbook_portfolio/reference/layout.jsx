import './globals.css';
import './hover.css';
import Script from 'next/script';
import Motion from '@/components/Motion';
import InstantNav from '@/components/InstantNav';

export const metadata = {
  title: 'Guruprasad Jena — Scrapbook',
  description: 'Full-stack engineer. Four products live, repos public. A cinematic engineering scrapbook.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

const FONTS =
  'https://fonts.googleapis.com/css2' +
  '?family=Playfair+Display:ital,wght@0,400..800;1,400..700' +
  '&family=Saira+Condensed:wght@400;500;600;700' +
  '&family=Spectral:ital,wght@0,400;0,500;0,600;1,400' +
  '&family=Caveat:wght@400..700' +
  '&family=Patrick+Hand' +
  '&family=JetBrains+Mono:wght@400..700' +
  '&family=Special+Elite' +
  '&family=Abril+Fatface' +
  '&display=swap';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preload" as="style" href={FONTS} />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        {children}
        <Motion />
        <InstantNav />
        <Script src="/image-slot.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
