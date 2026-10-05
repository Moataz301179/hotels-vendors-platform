import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.hotelsvendors.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '/',
    '/platform',
    '/solutions',
    '/solutions/hotels',
    '/solutions/suppliers',
    '/solutions/carriers',
    '/solutions/funders',
    '/marketplace',
    '/security-overview',
  ].map((path) => ({ url: `${SITE_URL}${path === '/' ? '' : path}` }));
}
