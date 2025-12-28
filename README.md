# Duet Landing (`duetmail.com`)

This folder will host the standalone marketing site that replaces the current Framer site at `https://duetmail.com`.

Primary goals:
- Best‑in‑class SEO and PageSpeed scores (Core Web Vitals, Lighthouse)
- Low operational overhead + low cost (static + CDN)
- Preserve existing URLs to avoid SEO loss

Non‑goals:
- Server‑side rendering for personalization (not needed for a marketing site)
- Reusing Cloud Run for `duetmail.com` (static hosting/CDN is typically faster + cheaper)

## Current State (Framer)

Production: `https://duetmail.com`  
Staging: `https://small-patterns-189703.framer.app`

### Routes to Preserve (SEO)

Current sitemap: `https://duetmail.com/sitemap.xml`

At time of writing, it includes:
- `/` (home)
- `/blog` (listing)
- `/blog/:slug` (22 posts in Framer CMS)
- `/disclaimer`, `/cookies`, `/privacy`, `/terms` (legal pages)
- `/404`

### Content Sources (Framer CMS)

Framer CMS collections (via Framer MCP):
- `Blog` (collectionId `fohBer2YP`): 22 items with fields:
  - `Title` (`eCEbkznWv`)
  - `Meta Description` (`mA9NnWls8`)
  - `Content` (`s_G3CgW2e`) — HTML formatted text
- `Legal` (collectionId `djof_tKdG`): 4 items with fields:
  - `Title` (`sBloKFMQV`)
  - `Date` (`BnOgbYZxW`)
  - `Image` (`LvGkcoW2x`)
  - `Content` (`ok4sGF4mG`) — HTML formatted text

### Custom Code to Carry Over

These snippets should be preserved (or intentionally replaced) during migration:
- GTM + UTM capture: `framer/custom-code/global/start_of_head_tag.html`
  - GTM container: `GTM-MHRH38HP`
  - UTM persistence:
    - Cookie: `duet_utms` (1y, `Domain=.duetmail.com`, `SameSite=Lax`, `Secure`)
    - localStorage: `duet__utm_params`
- GTM `<noscript>` fallback: `framer/custom-code/global/start_of_body_tag.html`
- Home JSON‑LD: `framer/custom-code/pages/home/end_of_head_tag.html`

Notes:
- Framer currently inlines a lot of CSS + font faces per page.
- The migration should explicitly control fonts and loading to improve LCP/TBT.

## Recommended Tech Stack

Target: static output + global CDN.

- Package manager: **pnpm**
- Framework: **Astro** (SSG) — currently `astro@5.16.6`
- Styling: **Tailwind CSS** (planned `tailwindcss@4.1.18`)
  - Use `@tailwindcss/vite@4.1.18` (Astro uses Vite under the hood)
- Interactivity: “islands” (React only where needed)
- Content pipeline:
  - Option A (recommended): export CMS content into repo as markdown/MDX or HTML files at build time
  - Option B: keep content in a headless CMS (not Framer) and pull at build time

Why Astro:
- Ships minimal JS by default (best lever for Lighthouse)
- Easy to keep pages fully static

## Migration Plan (High Level)

For the detailed home page (`/`) plan and component breakdown, see:
- `duet-landing/docs/home-page-migration.md`

1. **Freeze URL map**
   - Ensure the new site outputs identical routes to the current sitemap.
   - Add 301 redirects only if a slug must change (avoid if possible).

2. **Rebuild Home page as semantic HTML**
   - Map Framer sections to hand-authored components.
   - Prefer CSS animations over JS; avoid heavy client JS in the hero.

3. **Port blog + legal content**
   - Export Framer CMS `formattedText` HTML and render safely in Astro.
   - Ensure each blog post has:
     - `<title>`
     - meta description
     - canonical URL
     - OG/Twitter tags

4. **SEO + crawlability**
   - `robots.txt` with sitemap link
   - `sitemap.xml` generation
   - structured data (JSON‑LD) on home (and possibly blog posts)

5. **Performance hardening**
   - Images: responsive, modern formats, correct sizing, lazy-load below fold
   - Fonts: self-host or use a minimal set; preload critical weights
   - JS: keep near-zero; lazy-load any optional tracking beyond GTM

6. **Deploy on Cloudflare Pages**
   - Map `duetmail.com` + `www.duetmail.com` to Pages
   - Keep `app.duetmail.com` on Cloud Run (no change)

## CTA Behavior (Landing → App)

Current behavior (and target for the migrated site):
- CTAs are **static links** to `https://app.duetmail.com` (and related app routes)
- No Google OAuth popup/flow on the marketing site (better for Lighthouse and simpler to maintain)

## Deployment + Cutover (Cloudflare)

Target state:
- `duetmail.com` served from Cloudflare Pages (static)
- `app.duetmail.com` continues to serve from Cloud Run

Checklist:
- Verify sitemap parity vs current (`https://duetmail.com/sitemap.xml`)
- Verify robots parity (`https://duetmail.com/robots.txt`)
- Ensure canonical tags are correct per route
- Smoke test: `/`, `/blog`, a blog post, and each legal page
- Run PageSpeed Insights against production after DNS cutover

## References in This Repo

Existing artifacts that can help migration:
- Framer code snapshots + custom code: `framer/`
- Unframer sample export (reference only; not the target stack): `duet-mail-landing-8ad3b/`
