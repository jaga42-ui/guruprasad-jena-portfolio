import { SITE } from '@/app/seo';

/* Emitted as a static /robots.txt by `next build` — the export needs no server.
   Hand-written, like app/seo.js: tools/build.mjs only rewrites the five
   page.jsx files, so nothing here is regenerated. */

/* required by output: 'export' — these are route handlers, and the export
   needs to know they are fully static. */
export const dynamic = 'force-static';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
