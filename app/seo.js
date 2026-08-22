/* Shared link-preview metadata.

   Hand-written — tools/build.mjs regenerates every page.jsx on `npm run pages`,
   so the per-route metadata has to come from a module the generator calls
   rather than from the generated files themselves.

   Next.js replaces `openGraph` wholesale when a route declares it (there is no
   deep merge with the layout's), so pageMeta() returns the complete object. */

export const SITE = 'https://guruprasad-jena-portfolio.vercel.app';

export const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Guruprasad Jena — full-stack developer. Four products live.',
};

export function pageMeta(title, description, path) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'Guruprasad Jena — Scrapbook',
      locale: 'en_IN',
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
