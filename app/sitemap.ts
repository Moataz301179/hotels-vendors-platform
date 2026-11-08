import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.hotelsvendors.com';

/**
 * Public, indexable routes only.
 *
 * Auth flows, portal entries and the sandbox are deliberately excluded: they
 * sit behind authentication or add nothing to a search index.
 */
const PUBLIC_ROUTES = [
  '/',
  '/platform',
  '/solutions',
  '/solutions/hotels',
  '/solutions/suppliers',
  '/solutions/carriers',
  '/solutions/funders',
  '/marketplace',
  '/security-overview',
  '/pricing',
  '/about',
  '/founder',
  '/investors',
  '/contact',
  '/hovin',
  '/eta-connect',
  '/getting-started',
  '/walkthrough',
  '/support',
  '/hotels/join',
  '/suppliers/join',
  '/terms',
  '/privacy',
];

/** Last significant content change per route (W3C Datetime, date precision). */
const LAST_MODIFIED: Record<string, string> = {
  '/': '2026-11-08',
  '/platform': '2026-11-05',
  '/solutions': '2026-11-05',
  '/solutions/hotels': '2026-11-05',
  '/solutions/suppliers': '2026-11-05',
  '/solutions/carriers': '2026-11-05',
  '/solutions/funders': '2026-11-05',
  '/marketplace': '2026-11-08',
  '/security-overview': '2026-11-05',
  '/pricing': '2026-11-05',
  '/about': '2026-11-05',
  '/founder': '2026-11-07',
  '/investors': '2026-11-08',
  '/contact': '2026-11-05',
  '/hovin': '2026-11-06',
  '/eta-connect': '2026-11-07',
  '/getting-started': '2026-11-05',
  '/walkthrough': '2026-11-05',
  '/support': '2026-11-05',
  '/hotels/join': '2026-11-05',
  '/suppliers/join': '2026-11-05',
  '/terms': '2026-11-05',
  '/privacy': '2026-11-05',
};

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: new Date(LAST_MODIFIED[path] ?? '2026-11-05'),
    changeFrequency: 'weekly',
    // Priority reflects value to a qualified enquiry, not potential traffic.
    priority: path === '/' ? 1 : path === '/investors' ? 0.8 : 0.7,
  }));
}
