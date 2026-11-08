# SEO Implementation Report — HOTELSVENDORS

> Toolkit: [Claude SEO](https://github.com/AgriciDaniel/claude-seo) (MIT), 26 sub-skills.
> Applied methodology: `seo-technical`, `seo-geo`, `seo-hreflang`, `seo-sitemap`,
> `seo-schema`, `seo-content`. No paid SEO APIs were used.
> No existing UI, design token, component or business logic was changed.

---

## 1. Changes made

### Technical SEO

| Change | Before | After |
|---|---|---|
| **Sitemap coverage** | 9 URLs, no dates | **23 URLs** with `lastmod`, `changefreq`, `priority` |
| **robots.txt** | Single wildcard rule, disallow `/api/` | Public routes allowed; **14 authenticated/private paths disallowed**; `Host` declared; AI search crawlers explicitly allowed |
| **Broken redirect** | `/rfq` → `/demand-aggregation` (route does not exist publicly) | `/rfq` → `/platform` |
| **Redirect stubs** | `/carriers`, `/funders`, `/hotels` had no metadata | All four carry `robots: { index: false, follow: false }` |
| **Broken hreflang** | Declared `ar: "/ar"` — **no `/ar` route exists** | Removed; only real languages declared |

### Structured data

| Change | Detail |
|---|---|
| JSON-LD graph | `Organization` → **`@graph` of `WebSite` + `SearchAction` + `Organization`**, linked by `@id` |
| `WebSite` | New — declares publisher and language |
| `SearchAction` | New — sitelinks search box target (`/marketplace?q={search_term_string}`) |

### Content — investor presence

`/investors` expanded from a single briefing page to a full public presence:

- **Company profile** — what HOTELSVENDORS is, legal entity, operating scope
- **Business model** — transactional and compliance-led; explicit note that no figure is presented as current revenue or a commitment to charge
- **Market opportunity** — four structural conditions (vertical depth, working-capital pressure, fragmented sourcing, regulatory timing)
- **Investment opportunity** — what is being discussed, what a partner should expect
- **Strategic partnership** — supplier networks, logistics providers, finance providers, technology partners
- **Evidence boundary** — retained and expanded

### Discovery platforms

`docs/startup-discovery-profiles.md` — accurate draft profiles for Crunchbase,
Tracxn, Dealroom, Magnitt, Wamda, StartupBlink, Product Hunt, LinkedIn and GitHub.
**None published.** Every field is verified from the public site or explicitly
left blank.

---

## 2. Deliberate decisions

**No `llms.txt`.** The toolkit's own evidence review (`skills/seo-geo/references/llmstxt-evidence.md`)
records that Google states it ignores `llms.txt`, John Mueller called the
discovery use case "a dead end", no major AI search system consumes it, and a
300k-domain study found only one of the 50 most AI-cited domains had one. It is
consumed by AI *coding agents*, not search engines. Building one would add a
file without adding a ranking or citation effect.

**AI crawlers are allowed, not blocked.** Blocking `GPTBot` would only stop
model training — it would not affect ChatGPT Search citability, which is
governed by `OAI-SearchBot`. Blocking `Google-Extended` would not affect Google
Search indexing or AI Overviews, which are governed by `Googlebot`. The policy
names `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `PerplexityBot`,
`Google-Extended` and `Applebot-Extended` with explicit `Allow` so citability
is unambiguous.

**No invented figures.** No funding status, revenue, customer count, traction,
partnership or performance figure appears anywhere in the changes. Where a
platform requires a metric that cannot be evidenced, the profile leaves it
blank rather than estimating.

---

## 3. Measurable baselines

| Metric | Before | After |
|---|---|---|
| Sitemap URLs | 9 | 23 |
| Sitemap entries with `lastmod` | 0 | 23 |
| Public pages with metadata | 22 of 26 | 26 of 26 |
| Public pages reachable in sitemap | 9 | 23 |
| JSON-LD node types | 1 (`Organization`) | 3 (`WebSite`, `SearchAction`, `Organization`) |
| Declared hreflang languages with a real route | 1 of 2 | 1 of 1 |
| Authenticated paths disallowed in robots.txt | 1 (`/api/`) | 14 |
| Broken public redirects | 1 (`/rfq`) | 0 |
| Local build | exit 0 | exit 0 |
| Unit suite | 152 files / 723 tests | 152 files / 723 tests |
| CI (all four workflows) | green at `3d83fc2d` | to be re-confirmed |

**Verification performed:** live `/sitemap.xml` (23 `<loc>` entries) and
`/robots.txt` fetched from the running dev server; `tsc --noEmit` clean;
production build exit 0.

---

## 4. Remaining opportunities

### Arabic / RTL — the largest gap

The site declares `ar_EG` in OpenGraph and carries Arabic keywords, but **there
is no Arabic route and no RTL layout**. Arabic discoverability is currently
limited to metadata strings.

Real progress requires one of:
1. A parallel `/ar` route tree with `dir="rtl"` and full translations, plus a
   correct bidirectional hreflang set and hreflang alternates in the sitemap; or
2. Removal of the `ar_EG` alternate locale claim until an Arabic route exists.

Option 1 is a content project, not an SEO one. Until it happens, Arabic search
visibility will not match English.

### Per-page structured data

Only the site-wide graph exists. High-value additions:
- `BreadcrumbList` on multi-section pages
- `FAQPage` on `/investors` and `/pricing` if real questions are added
- `SoftwareApplication` on `/platform` with the verified feature set

### Core Web Vitals

Not measured in this pass. The toolkit's `seo-performance` skill requires
field data (PageSpeed Insights or CrUX), which needs either a paid API or
owner-run measurement. Recommend measuring LCP, INP and CLS on `/`,
`/marketplace` and `/investors` before and after any further change.

### Indexing

Submit the sitemap to Google Search Console and confirm:
- all 23 URLs return 200
- no `noindex` on the intended public pages
- `lastmod` values are accepted (they are currently date-precision, which is valid)

### Content depth for the four target audiences

- **Hotels** — strong (`/solutions/hotels`, `/hotels`, `/eta-connect`)
- **Suppliers** — strong (`/solutions/suppliers`, `/suppliers/join`)
- **Investors** — now substantially deeper (`/investors`)
- **Ecosystem researchers / partners** — partial; `/investors` partnership section
  helps, but no dedicated partner or ecosystem page exists

### Startup platforms

Profiles are drafted and awaiting owner confirmation of the blank fields
(founded year, funding, team size) before any submission.

---

## 5. Owner actions required

1. Decide on Arabic/RTL scope (parallel route tree, or drop the `ar_EG` claim).
2. Confirm the blank profile fields before any platform submission.
3. Submit the sitemap in Google Search Console.
4. Run PageSpeed Insights on the three priority pages for a Web Vitals baseline.
