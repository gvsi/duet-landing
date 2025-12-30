import type { APIRoute } from "astro"

const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`

const getDisallowRobotsTxt = () => `
User-agent: *
Disallow: /
`

export const GET: APIRoute = ({ site }) => {
    // Check if we are in a production environment
    // Note: in Astro, import.meta.env.PROD is true for any "astro build" run.
    // It does not distinguish between staging vs production deployments.

    // We try to detect standard CI/CD environment variables for production branches.
    // You should ensure your deployment platform sets one of these, or sets SITE_ENV=production.
    const isProduction = import.meta.env.SITE_ENV === "production" || import.meta.env.PUBLIC_SITE_ENV === "production"

    const isProdBuild = import.meta.env.context === "production" // Netlify/Vercel
        || process.env.CF_PAGES_BRANCH === "main" // Cloudflare Pages
        || process.env.CF_PAGES_BRANCH === "master"

    const sitemapURL = new URL("sitemap-index.xml", site)

    // If we are definitely in a production build/environment, allow indexing.
    // Otherwise, disallow to prevent staging/preview crawling.
    // Note: If you run `astro build` locally without these env vars, it will produce the Disallow version.
    // This is generally safe for local development artifacts.
    // When deploying to production, ensure one of the above conditions is met.
    const shouldAllow = isProduction || isProdBuild

    const body = shouldAllow ? getRobotsTxt(sitemapURL) : getDisallowRobotsTxt()

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    })
}
