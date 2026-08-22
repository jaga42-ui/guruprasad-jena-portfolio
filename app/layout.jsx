import './globals.css';
import './hover.css';
import Motion from '@/components/Motion';
import InstantNav from '@/components/InstantNav';
import { SITE, OG_IMAGE } from '@/app/seo';

/* Two of the four repos are closed (provider keys ship with them), so the
   description says "two repos open" rather than the older "repos public" —
   this string is the copy under the link card everywhere it gets shared. */
const DESCRIPTION =
  'Full-stack developer. Four products live, two repos open. A cinematic engineering scrapbook.';

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Guruprasad Jena — Scrapbook',
    template: '%s',
  },
  description: DESCRIPTION,
  authors: [{ name: 'Guruprasad Jena' }],
  creator: 'Guruprasad Jena',
  alternates: { canonical: '/' },
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '512x512' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Guruprasad Jena — Scrapbook',
    locale: 'en_IN',
    url: '/',
    title: 'Guruprasad Jena — Scrapbook',
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guruprasad Jena — Scrapbook',
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#101619',
};

/* The union of the five sources' <helmet> font links, minus Abril Fatface —
   it was only ever loaded for the postcard variant that got cut.
   Bebas Neue and Space Grotesk stay: the Projects plotter picks a different
   display face per sheet, and those two are sheets 02 and 04. */
const FONTS =
  'https://fonts.googleapis.com/css2' +
  '?family=Playfair+Display:ital,wght@0,400..800;1,400..700' +
  '&family=Saira+Condensed:wght@400;500;600;700' +
  '&family=Spectral:ital,wght@0,400;0,500;0,600;1,400' +
  '&family=Caveat:wght@400..700' +
  '&family=Patrick+Hand' +
  '&family=JetBrains+Mono:wght@400..700' +
  '&family=Special+Elite' +
  '&family=Bebas+Neue' +
  '&family=Space+Grotesk:wght@500;700' +
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
      </body>
    </html>
  );
}
