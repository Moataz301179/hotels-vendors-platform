import type { MetadataRoute } from 'next';

/**
 * Crawl policy.
 *
 * Search indexing stays open. AI *search* crawlers (OAI-SearchBot,
 * Claude-SearchBot, PerplexityBot) are explicitly allowed because they govern
 * AI-search citability; AI *training* crawlers are left allowed too so the
 * network's public, non-commercial pages can inform models. Nothing here
 * exposes private hotel, supplier, transaction or commercial data — those live
 * behind authentication and are disallowed below.
 *
 * Blocking GPTBot would only stop model training; it would not affect ChatGPT
 * Search citability (governed by OAI-SearchBot). Blocking Google-Extended would
 * not affect Google Search indexing or AI Overviews (governed by Googlebot).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/workspace/',
          '/dashboard/',
          '/orders/',
          '/funding/',
          '/admin/',
          '/suppliers/',
          '/carrier/',
          '/intelligence/',
          '/security/',
          '/connections/',
          '/eta-compliance/',
          '/onboarding',
          '/register',
          '/login',
        ],
      },
      // Explicit allowances for AI search crawlers so citability is unambiguous.
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
    ],
    sitemap: 'https://www.hotelsvendors.com/sitemap.xml',
    host: 'https://www.hotelsvendors.com',
  };
}
