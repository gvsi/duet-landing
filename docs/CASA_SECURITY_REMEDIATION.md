# CASA Security Scan — Remediation Tracker

**Source:** TAC Security ESOF AppSec ADA CASA — Premium Report
**Report File:** `TAC_Security_ReportDuetMailScan_2026_1770181213.pdf`
**Scan Date:** Feb 3, 2026
**Target:** https://duetmail.com (Astro landing site, Cloudflare Pages)
**Scan Type:** DAST
**Cyber Score:** 8.5 / 10 (Low risk)

## Current Status

- **Step 4 — Remediation:** Code changes complete, Cloudflare dashboard changes complete (with caveats)
- **Step 5 — Rescanning:** Pending (deploy code changes + submit SAQ)
- **Step 6 — Letter of Validation:** Pending

> **All 12 vulnerabilities need to be patched to pass CASA Tier 2 & Tier 3 assessments.**

---

## Findings Summary

| Severity | Count | Resolved | Pending |
|----------|-------|----------|---------|
| Critical | 0     | —        | —       |
| High     | 0     | —        | —       |
| Medium   | 0     | —        | —       |
| Low      | 5     | 4        | 1       |
| Info     | 7     | 4        | 3       |
| **Total**| **12**| **8**    | **4**   |

**Resolved (code):** #1, #2, #3, #5, #6, #7, #8 — via `_headers` file + comment removal
**Resolved (Cloudflare):** #4 partially — WAF rule blocking TRACE/TRACK deployed
**Pending (deploy + verify):** #10, #11 (cache headers in `_headers`, need live verification)
**Not fully resolvable:** #4 Server header — Cloudflare blocks removal (see limitations below)
**No action required:** #9, #12 (informational)

---

## Low Severity (5)

### 1. CORS Misconfiguration
- **CWE:** 942
- **Status:** ✅ Resolved (code)
- **Fix applied:** `! Access-Control-Allow-Origin` detach directive in `public/_headers` removes the wildcard header. If detach doesn't work post-deploy, fallback: Cloudflare Transform Rule to strip the header (see Part B3).
- **Problem:** `Access-Control-Allow-Origin: *` allows any domain to make AJAX requests to the site.
- **Evidence URLs:**
  - `https://duetmail.com`
  - `https://duetmail.com/`
  - `https://duetmail.com/blog`
  - `https://duetmail.com/faq`
  - `https://duetmail.com/_astro/_slug_.RQlQpf4.css`

---

### 2. Cross-Domain Misconfiguration
- **CWE:** 264
- **Status:** ✅ Resolved (code) — same fix as #1
- **Fix applied:** `! Access-Control-Allow-Origin` in `public/_headers`.
- **Problem:** CORS misconfiguration permits cross-domain read requests from arbitrary third-party domains.
- **Evidence URLs:**
  - `https://duetmail.com` — `Access-Control-Allow-Origin: *`
  - `https://duetmail.com/` — `Access-Control-Allow-Origin: *`
  - `https://duetmail.com/blog` — `Access-Control-Allow-Origin: *`
  - `https://duetmail.com/privacy` — `Access-Control-Allow-Origin: *`
  - `https://duetmail.com/sitemap.xml` — `Access-Control-Allow-Origin: *`
  - `https://duetmail.com/robots.txt` — `Access-Control-Allow-Origin: *`

---

### 3. Missing Anti-clickjacking Header
- **CWE:** 1021
- **Status:** ✅ Resolved (code)
- **Fix applied:** `X-Frame-Options: DENY` + `Content-Security-Policy: frame-ancestors 'none'` in `public/_headers`.
- **Problem:** Response does not protect against ClickJacking attacks.
- **Evidence URLs:**
  - `https://duetmail.com`
  - `https://duetmail.com/`
  - `https://duetmail.com/blog`
  - `https://duetmail.com/privacy`
  - `https://duetmail.com/sitemap.xml`

---

### 4. Proxy Disclosure
- **CWE:** 204
- **Status:** ⏳ Partially resolved — TRACE/TRACK blocked, Server header cannot be removed
- **Fix applied (code):** `! Server` detach directive in `public/_headers`.
- **Fix applied (Cloudflare):**
  - **B1: ✅ Deployed** — WAF Custom Rule "Block TRACE and TRACK methods" (Security > Security Rules > Custom Rules)
    - Expression: `(http.request.method eq "TRACE") or (http.request.method eq "TRACK")`
    - Action: Block (403)
    - Status: Active
  - **B2: ❌ Not possible** — Cloudflare does not allow removing the `Server` header:
    - "Remove Server header" is NOT available as a Managed Transform (Rules > Transform Rules > Managed Transforms only offers "Remove X-Powered-By" and "Add security headers")
    - Creating a custom Response Header Transform Rule to remove `server` fails with error: `'remove' is not a valid value for operation because it cannot be used on header 'server'`
    - The `! Server` detach directive in `_headers` is our only mechanism — effectiveness depends on whether Cloudflare Pages honors it for edge-injected headers
  - **Bonus hardening: ✅** Enabled "Remove X-Powered-By headers" Managed Transform
- **Problem:** Proxy server (Cloudflare) detected/fingerprinted via TRACE, OPTIONS, and TRACK methods.
- **Note:** Cloudflare will always be identifiable via `cf-ray` header and IP ranges. The `Server: cloudflare` header is edge-injected and Cloudflare actively prevents its removal. Goal is to reduce method + header leakage, not hide Cloudflare entirely. This finding may persist on rescan — if so, document the limitation in the SAQ response.

---

### 5. Relative Path Confusion
- **CWE:** 20
- **Status:** ✅ Resolved (code)
- **Fix applied:** `X-Content-Type-Options: nosniff` + `X-Frame-Options: DENY` in `public/_headers`. No `<base>` tag added (breaks fragment links on non-root pages).
- **Contingency:** If rescan still flags this, add `<base href="https://duetmail.com/">` to `BaseLayout.astro` and audit all fragment links.
- **Problem:** Browser could be tricked into interpreting HTML as CSS via relative path confusion.

---

## Info Severity (7)

### 6. Permissions Policy Header Not Set
- **CWE:** 693
- **Status:** ✅ Resolved (code)
- **Fix applied:** `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()` in `public/_headers`.
- **Problem:** Missing header that restricts browser feature access.

---

### 7. Strict-Transport-Security Header Not Set
- **CWE:** 319
- **Status:** ✅ Resolved (code)
- **Fix applied:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` in `public/_headers`.
- **Important:** Do NOT also enable HSTS in Cloudflare dashboard (SSL/TLS > Edge Certificates) — that would produce duplicate headers.
- **Problem:** HSTS header not set, browsers don't enforce HTTPS-only connections.

---

### 8. Information Disclosure — Suspicious Comments
- **CWE:** 615
- **Status:** ✅ Resolved (code)
- **Fix applied:** Removed 44 HTML comments from 16 source files. Only GTM integration markers remain in build output (standard, not flagged).
- **Files modified:**
  - `src/components/sections/AgentChatShowcase.astro` (6 comments)
  - `src/components/sections/CategorizationShowcase.astro` (8 comments)
  - `src/components/sections/DraftShowcase.astro` (10 comments)
  - `src/components/sections/Pricing.astro` (3 comments)
  - `src/components/sections/FAQ.astro` (3 comments)
  - `src/components/sections/FinalCTA.astro` (3 comments)
  - `src/components/ui/ThemeToggle.astro` (2 comments)
  - `src/layouts/BaseLayout.astro` (1 comment)
  - `src/layouts/BlogLayout.astro` (9 comments)
  - `src/pages/index.astro` (1 comment)
  - `src/snippets/legal/terms.html` (header block)
  - `src/snippets/legal/privacy.html` (header block)
  - `src/snippets/legal/cookies.html` (header block)
  - `src/snippets/legal/disclaimer.html` (header block)
- **Problem:** HTML comments with patterns like `\bUSER\b`, `\bFROM\b`, and `Migrated from legacy CMS` survived into production HTML.

---

### 9. Modern Web Application
- **CWE:** -1
- **Status:** ℹ️ No action needed — informational
- **Problem:** Application identified as a modern web app.

---

### 10. Re-examine Cache-Control Directives
- **CWE:** 525
- **Status:** ✅ Resolved (code) — needs live verification after deploy
- **Fix applied:** Cache-Control rules in `public/_headers`:
  - `/_astro/*` → `public, max-age=31536000, immutable` (hashed assets)
  - `/*.webp`, `/*.jpg`, `/*.jpeg`, `/*.png`, `/*.svg` → `public, max-age=2592000` (30-day cache for images)
- **Problem:** Cache-control not set properly for static assets.

---

### 11. Storable but Non-Cacheable Content
- **CWE:** 524
- **Status:** ✅ Resolved (code) — needs live verification after deploy
- **Fix applied:** Same cache rules as #10 in `public/_headers`.
- **Problem:** Response contents storable but not retrievable from cache without upstream validation.

---

### 12. User Agent Fuzzer
- **CWE:** N/A
- **Status:** ℹ️ No action needed — informational
- **Problem:** Responses vary by user agent, expected for responsive/modern sites.

---

## Implementation Details

### Header Ownership Table

Each security header is owned by exactly ONE mechanism to avoid duplicate headers.

| Header | Owner | Findings |
|--------|-------|----------|
| `X-Frame-Options: DENY` | `_headers` | #3 |
| `Content-Security-Policy: frame-ancestors 'none'` | `_headers` | #3 |
| `X-Content-Type-Options: nosniff` | `_headers` | #5 |
| `Referrer-Policy: strict-origin-when-cross-origin` | `_headers` | hardening |
| `Permissions-Policy` | `_headers` | #6 |
| `Strict-Transport-Security` | `_headers` | #7 |
| `! Access-Control-Allow-Origin` (detach) | `_headers` | #1, #2 |
| `! Server` (detach) | `_headers` | #4 |
| `Cache-Control` (per-path) | `_headers` | #10, #11 |
| TRACE/TRACK blocking | Cloudflare WAF Custom Rule (deployed) | #4 |
| Server header removal | ❌ Not possible — Cloudflare blocks removal | #4 |
| Remove `X-Powered-By` | Cloudflare Managed Transform (enabled) | hardening |

### Post-Deploy Verification Checklist

```bash
# Security headers present
curl -sI https://duetmail.com | grep -i "x-frame-options"           # DENY
curl -sI https://duetmail.com | grep -i "x-content-type-options"    # nosniff
curl -sI https://duetmail.com | grep -i "permissions-policy"        # camera=(), ...
curl -sI https://duetmail.com | grep -i "strict-transport-security" # max-age=31536000; ...
curl -sI https://duetmail.com | grep -i "content-security-policy"   # frame-ancestors 'none'

# CORS header absent
curl -sI https://duetmail.com | grep -i "access-control-allow-origin"  # NO output

# Server header — likely still present (Cloudflare prevents removal)
curl -sI https://duetmail.com | grep -i "^server:"  # Will likely show "cloudflare" — cannot be removed

# TRACE/TRACK blocked (after Cloudflare WAF rule)
curl -sI -X TRACE https://duetmail.com  # 403 Forbidden
curl -sI -X TRACK https://duetmail.com  # 403 Forbidden

# Cache-Control for hashed assets
curl -sI "https://duetmail.com/_astro/<any-file>" | grep -i "cache-control"  # immutable

# Cache-Control for images
curl -sI https://duetmail.com/hero-bg-light-lg.webp | grep -i "cache-control"  # max-age=2592000
```

### Cloudflare Dashboard Changes (Feb 5, 2026)

**Completed:**
1. **WAF Custom Rule** — "Block TRACE and TRACK methods" deployed and active
   - Location: Security > Security Rules > Custom Rules
   - Expression: `(http.request.method eq "TRACE") or (http.request.method eq "TRACK")`
   - Action: Block (403, default Cloudflare WAF block page)
2. **Managed Transform** — "Remove X-Powered-By headers" enabled
   - Location: Rules > Transform Rules > Managed Transforms

**Not possible (Cloudflare limitations):**
1. **Server header removal** — Cloudflare actively prevents removing the `Server` header:
   - No "Remove Server header" option exists in Managed Transforms (only "Remove X-Powered-By" and "Add security headers" are available)
   - Custom Response Header Transform Rules reject `server` as a header name: error `'remove' is not a valid value for operation because it cannot be used on header 'server'`
   - The `! Server` detach directive in `_headers` may work for origin-set Server headers but NOT for Cloudflare's edge-injected `Server: cloudflare` header
   - This is a known Cloudflare platform limitation — the `Server` header is considered a protected/reserved header
2. **Cloudflare fingerprinting** — Even with all mitigations, Cloudflare remains identifiable via:
   - `cf-ray` response header (cannot be removed)
   - Cloudflare IP ranges (publicly documented)
   - Behavioral patterns in error pages and challenge pages

**Impact on CASA rescan:** Finding #4 (Proxy Disclosure) will likely persist at "Low" severity due to the Server header limitation. Document this in the SAQ as a platform-level constraint that cannot be mitigated further.

---

### References
- OWASP CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- X-Frame-Options: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
- HSTS: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html
- Permissions-Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy
- Cache-Control: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
