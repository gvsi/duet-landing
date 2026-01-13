# Duet Landing (`duetmail.com`)

This folder hosts the standalone Astro marketing site at `https://duetmail.com`.

Primary goals:
- Best‑in‑class SEO and PageSpeed scores (Core Web Vitals, Lighthouse)
- Low operational overhead + low cost (static + CDN)
- Preserve existing URLs to avoid SEO loss

Non‑goals:
- Server‑side rendering for personalization (not needed for a marketing site)
- Reusing Cloud Run for `duetmail.com` (static hosting/CDN is typically faster + cheaper)

## Migration Status

**Status:** Migrated from legacy Framer site to Astro.
**Hosting:** Cloudflare Pages (Production).

### Content Sources

Content was migrated from the legacy CMS into local Markdown/HTML files:
- **Blog**: 22 posts migrated to `src/content/blog/*.md`.
- **Legal**: 4 pages (Terms, Privacy, Cookies, Disclaimer) migrated to `src/snippets/legal/*.html`.

### Routes (SEO)

The sitemap `https://duetmail.com/sitemap.xml` includes:
- `/` (home)
- `/blog` (listing)
- `/blog/:slug` (22 posts)
- `/disclaimer`, `/cookies`, `/privacy`, `/terms` (legal pages)
- `/404`

## Tech Stack

- Package manager: **pnpm**
- Framework: **Astro** (SSG) — `astro@5.16.6`
- Styling: **Tailwind CSS** — `tailwindcss@4.x` (via `@tailwindcss/vite`)
- Interactivity: “islands” (React only where needed)
- Content pipeline: Markdown/MDX + HTML snippets

Why Astro:
- Ships minimal JS by default (best lever for Lighthouse)
- Easy to keep pages fully static

## Development

```bash
pnpm install
pnpm dev
```

## CTA Behavior (Landing → App)

Current behavior:
- CTAs are **static links** to `https://app.duetmail.com` (and related app routes)
- No Google OAuth popup/flow on the marketing site (better for Lighthouse and simpler to maintain)

## Deployment (Cloudflare)

- `duetmail.com` served from Cloudflare Pages (static)
- `app.duetmail.com` continues to serve from Cloud Run

