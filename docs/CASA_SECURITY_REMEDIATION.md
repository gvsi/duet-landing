# CASA Security Scan — Remediation Tracker

**Source:** TAC Security ESOF AppSec ADA CASA — Premium Report
**Report File:** `TAC_Security_ReportDuetMailScan_2026_1770181213.pdf`
**Scan Date:** Feb 3, 2026
**Target:** https://duetmail.com (Astro landing site, Cloudflare Pages)
**Scan Type:** DAST
**Cyber Score:** 8.5 / 10 (Low risk)

## Current Status

- **Step 4 — Remediation:** Complete. All code changes deployed and verified live.
- **Step 5 — Rescanning:** Ready to submit SAQ and trigger rescan.
- **Step 6 — Letter of Validation:** Pending rescan.

> **11 of 12 findings resolved. Finding #4 (Server header) is a Cloudflare platform limitation — document in SAQ.**

---

## Findings Summary

| Severity | Count | Resolved | Not resolvable | No action needed |
|----------|-------|----------|----------------|------------------|
| Critical | 0     | —        | —              | —                |
| High     | 0     | —        | —              | —                |
| Medium   | 0     | —        | —              | —                |
| Low      | 5     | 4        | 1 (#4 partial) | —                |
| Info     | 7     | 5        | —              | 2                |
| **Total**| **12**| **9**    | **1**          | **2**            |

**Resolved and verified live:** #1, #2, #3, #5, #6, #7, #8, #10, #11
**Not fully resolvable:** #4 — `Server: cloudflare` header cannot be removed (Cloudflare platform limitation, see details below)
**No action required:** #9, #12 (informational)

---

## Low Severity (5)

### 1. CORS Misconfiguration
- **CWE:** 942
- **Status:** ✅ Resolved (code)
- **Fix applied:** `! Access-Control-Allow-Origin` detach directive in `public/_headers`. Verified absent in live response headers.
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
- **Status:** ⚠️ Partially resolved — `Server: cloudflare` header **not removable** (platform limitation)
- **Mitigations applied:**
  - TRACE → 405 (blocked natively by Cloudflare)
  - TRACK → 501 (blocked natively by Cloudflare)
  - **✅ Managed Transform** — "Remove X-Powered-By headers" enabled
- **Server header — all four approaches tested and failed:**
  1. `! Server` detach directive in `_headers` — no effect on edge-injected headers (confirmed via curl post-deploy)
  2. Response Header Transform Rule — Cloudflare rejects `remove` operation on `server`: `'remove' is not a valid value for operation because it cannot be used on header 'server'`
  3. "Remove Server header" Managed Transform — does not exist (only "Remove X-Powered-By" is available)
  4. Pages Functions middleware (`headers.delete('server')`) — Cloudflare re-injects `Server: cloudflare` after the Function returns (confirmed via curl post-deploy)
- **WAF rule not needed:** TRACE (405) and TRACK (501) are rejected natively by Cloudflare without a custom WAF rule. WAF rule was disabled after confirming native blocking.
- **Problem:** Proxy server (Cloudflare) detected/fingerprinted via TRACE, OPTIONS, and TRACK methods.
- **SAQ response:** The `Server: cloudflare` header is edge-injected by Cloudflare's reverse proxy and cannot be removed on any plan below Enterprise. Cloudflare remains identifiable regardless via `cf-ray` header, IP ranges, and behavioral patterns. All feasible mitigations have been applied (X-Powered-By removal). TRACE and TRACK methods are rejected natively by Cloudflare (405/501). This is a platform-level constraint, not an application-level vulnerability.

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
- **Status:** ✅ Resolved and verified live
- **Fix applied:** Cache-Control rules in `public/_headers`:
  - `/_astro/*` → `public, max-age=31536000, immutable` (hashed assets) — verified live
  - `/*.webp`, `/*.jpg`, `/*.jpeg`, `/*.png`, `/*.svg` → `public, max-age=2592000` (30-day cache for images)
- **Problem:** Cache-control not set properly for static assets.

---

### 11. Storable but Non-Cacheable Content
- **CWE:** 524
- **Status:** ✅ Resolved and verified live
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
| `! Server` (detach) | `_headers` | #4 (no effect on edge-injected header) |
| `Cache-Control` (per-path) | `_headers` | #10, #11 |
| TRACE/TRACK blocking | Cloudflare native (405/501) | #4 (no WAF rule needed) |
| Server header removal | ❌ Not possible — Cloudflare platform limitation | #4 |
| Remove `X-Powered-By` | Cloudflare Managed Transform (enabled) | hardening |

### Post-Deploy Verification (Feb 5, 2026 — all passing)

```bash
# Security headers — all present ✅
curl -sI https://duetmail.com | grep -i "x-frame-options"           # DENY ✅
curl -sI https://duetmail.com | grep -i "x-content-type-options"    # nosniff ✅
curl -sI https://duetmail.com | grep -i "permissions-policy"        # camera=(), ... ✅
curl -sI https://duetmail.com | grep -i "strict-transport-security" # max-age=31536000; ... ✅
curl -sI https://duetmail.com | grep -i "content-security-policy"   # frame-ancestors 'none' ✅
curl -sI https://duetmail.com | grep -i "referrer-policy"           # strict-origin-when-cross-origin ✅

# CORS header absent ✅
curl -sI https://duetmail.com | grep -i "access-control-allow-origin"  # NO output ✅

# Server header — still present (Cloudflare platform limitation, see #4)
curl -sI https://duetmail.com | grep -i "^server:"  # "cloudflare" — cannot be removed

# TRACE/TRACK blocked natively by Cloudflare ✅
curl -sI -X TRACE https://duetmail.com  # 405 Method Not Allowed ✅
curl -sI -X TRACK https://duetmail.com  # 501 Not Implemented ✅

# Cache-Control for hashed assets ✅
curl -sI "https://duetmail.com/_astro/" | grep -i "cache-control"  # public, max-age=31536000, immutable ✅

# Cache-Control for images
curl -sI https://duetmail.com/hero-bg-light-lg.webp | grep -i "cache-control"  # max-age=2592000
```

### Cloudflare Dashboard Changes (Feb 5, 2026)

**Active:**
1. **Managed Transform** — "Remove X-Powered-By headers" enabled
   - Location: Rules > Transform Rules > Managed Transforms

**Disabled (not needed):**
1. **WAF Custom Rule** — "Block TRACE and TRACK methods" — disabled after confirming Cloudflare natively rejects TRACE (405) and TRACK (501) without any custom rules.

**Not possible (Cloudflare platform limitations):**
1. **Server header removal** — four approaches tested, all failed:
   - `! Server` detach in `_headers` — no effect on edge-injected headers
   - Response Header Transform Rule — `server` is a restricted header, `remove` operation rejected
   - "Remove Server header" Managed Transform — does not exist
   - Pages Functions middleware `headers.delete('server')` — Cloudflare re-injects header after Function execution
   - This is a known Cloudflare platform limitation requiring Enterprise plan to resolve
2. **Cloudflare fingerprinting** — Cloudflare remains identifiable regardless via `cf-ray` header, IP ranges, and behavioral patterns

**Impact on CASA rescan:** Finding #4 (Proxy Disclosure) will likely persist at "Low" severity due to the Server header limitation. Document in SAQ as a platform-level constraint.

---

### References
- OWASP CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- X-Frame-Options: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
- HSTS: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html
- Permissions-Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy
- Cache-Control: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
