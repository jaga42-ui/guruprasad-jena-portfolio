import { SITE } from '@/app/seo';

/* Emitted as a static /sitemap.xml by `next build`.

   LAST_MODIFIED is a constant rather than new Date() so two builds of the same
   content produce the same sitemap — a build clock would tell crawlers every
   page changed on every deploy. Bump it when the pages actually change. */

const LAST_MODIFIED = '2026-08-23';

/* priority is relative within this site only: the sheets are the reason to
   visit, so /projects sits just under the front page. */
const ROUTES = [
  { path: '/', priority: 1.0 },
  { path: '/projects', priority: 0.9 },
  { path: '/about', priority: 0.8 },
  { path: '/skills', priority: 0.8 },
  { path: '/contact', priority: 0.7 },
];

/* required by output: 'export' — these are route handlers, and the export
   needs to know they are fully static. */
export const dynamic = 'force-static';

export default function sitemap() {
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE}${path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: 'monthly',
    priority,
  }));
}
