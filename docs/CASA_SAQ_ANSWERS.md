# CASA Self-Assessment Questionnaire (SAQ) — Duet Mail

**Application:** Duet Mail (Gmail AI Assistant)
**Scan Target:** https://duetmail.com
**Date:** Feb 5, 2026
**Prepared by:** Giovanni Alcantara

**Context:** Duet Mail is a Gmail AI assistant. The scan target (duetmail.com) is a static Astro marketing site on Cloudflare Pages with zero JavaScript interactivity. The broader application includes a React web app (app.duetmail.com), Python/Quart API (api.duetmail.com), and Chrome extension. Authentication is exclusively Google OAuth 2.0 — there are no user-set passwords.

---

## Answers

### Q1. Verify documentation and justification of all the application's trust boundaries, components, and significant data flows.

**Answer:** Yes

**Comment:** Trust boundaries are clearly defined: (1) Client/server boundary — React web app and Chrome extension communicate with the backend API via HTTPS only. (2) Third-party API boundaries — backend integrates with Google OAuth, Gmail API, OpenAI/Azure, Stripe, and Customer.io via authenticated API calls. (3) Data encryption boundary — MongoDB CSFLE (Client-Side Field Level Encryption) encrypts Gmail message bodies and OAuth tokens at rest. (4) Cookie domain boundary — JWT and CSRF cookies scoped to .duetmail.com domain. (5) Chrome extension/Gmail boundary — extension injects into mail.google.com using InboxSDK with Manifest V3 permissions model.

---

### Q2. Verify the application does not use unsupported, insecure, or deprecated client-side technologies such as NSAPI plugins, Flash, Shockwave, ActiveX, Silverlight, NACL, or client-side Java applets.

**Answer:** Yes

**Comment:** No deprecated client-side technologies are used. Tech stack: React 19 with TypeScript (web app), Astro with Tailwind CSS (landing page), Chrome Extension using Manifest V3 (MV2 is deprecated — we use MV3). All dependencies are current and actively maintained.

---

### Q3. Verify that trusted enforcement points, such as access control gateways, servers, and serverless functions, enforce security controls.

**Answer:** Yes

**Comment:** All security controls are enforced server-side on the Python/Quart backend (api.duetmail.com) deployed on GCP Cloud Run. Every protected API endpoint uses the @jwt_required decorator for authentication. CSRF protection uses a double-submit cookie pattern (JWT_COOKIE_CSRF_PROTECT = True). Background job processing uses Google Cloud Tasks with OIDC token verification. The frontend and Chrome extension never make security decisions — they rely entirely on server-side enforcement.

---

### Q4. Verify that all sensitive data is identified and classified into protection levels.

**Answer:** Yes

**Comment:** Sensitive data is classified and protected accordingly: (1) HIGH — Gmail message bodies (full HTML) encrypted with CSFLE using AES-256-CBC-HMAC-SHA-512. (2) HIGH — Google OAuth access/refresh tokens encrypted with CSFLE. (3) MEDIUM — User email addresses stored in plaintext for indexing but transmitted only over TLS. (4) LOW — User profile metadata (job title, company), thread metadata, subscription data stored unencrypted. Payment processing is fully delegated to Stripe (no card data touches our servers).

---

### Q5. Verify that all protection levels have an associated set of protection requirements, such as encryption requirements, integrity requirements, retention, privacy and other confidentiality requirements.

**Answer:** Yes

**Comment:** Protection requirements by level: HIGH data (Gmail content, OAuth tokens) — encrypted at rest via MongoDB CSFLE with GCP KMS-managed master keys, transmitted over TLS, never logged. MEDIUM data (email addresses) — transmitted over TLS, used for authentication and communication only. LOW data (metadata) — standard database storage with MongoDB Atlas encryption at rest. All data transmitted exclusively over HTTPS. HttpOnly + Secure + SameSite cookies for session tokens. Client event tracking data has a 90-day TTL retention policy.

---

### Q6. Verify that the application employs integrity protections, such as code signing or subresource integrity, to verify the integrity of third-party libraries and resources.

**Answer:** Yes

**Comment:** The Chrome extension is signed by the Chrome Web Store before distribution. All package dependencies use pinned lockfiles (pnpm-lock.yaml for JS, uv.lock for Python) ensuring reproducible builds with verified checksums. Docker images use multi-stage builds from official base images. External resources are minimal — Google Fonts is the only external CDN resource loaded by the web app.

---

### Q7. Verify that the application has protection from subdomain takeovers if the application relies upon DNS entries or DNS subdomains.

**Answer:** Yes

**Comment:** All subdomains point to actively managed infrastructure: duetmail.com → Cloudflare Pages, app.duetmail.com → GCP Cloud Run, api.duetmail.com → GCP Cloud Run. No dangling CNAME records exist — all DNS entries resolve to live services. CORS is explicitly restricted to legitimate origins only (duetmail.com and app.duetmail.com).

---

### Q8. Verify that the application has anti-automation controls to protect against excessive calls such as data exfiltration, business logic requests, file uploads or denial of service attacks.

**Answer:** Yes

**Comment:** Rate limiting is implemented on public-facing endpoints: waitlist submissions are limited to 30 requests/minute per IP, public event intake is limited to 120 requests/minute per IP. Rate limiting uses Redis for distributed enforcement across instances. All authenticated API endpoints require valid JWT tokens, which limits abuse surface. Google Cloud Run provides built-in DDoS protection and request throttling. Cloudflare provides additional edge-level protection for the landing site.

---

### Q9. Verify that files obtained from untrusted sources are stored outside the web root, with limited permissions.

**Answer:** Yes

**Comment:** The application does not accept direct file uploads from users. Gmail attachments are downloaded server-side via the Gmail API (trusted source) and stored in MongoDB GridFS — completely outside the web root and not directly accessible via URL. Attachments are served through an authenticated endpoint with HMAC-SHA256 signed URLs that include expiration timestamps.

---

### Q10. Verify that files obtained from untrusted sources are scanned by antivirus scanners to prevent upload and serving of known malicious content.

**Answer:** No

**Comment:** Not applicable. The application does not accept file uploads from untrusted sources. Gmail attachments are obtained from Google's servers via the Gmail API (Google performs its own malware scanning on Gmail attachments). Files are stored in MongoDB GridFS and served through authenticated, signed endpoints — never executed server-side.

---

### Q11. Verify API URLs do not expose sensitive information, such as the API key, session tokens etc.

**Answer:** Yes

**Comment:** No sensitive information is exposed in API URLs. Authentication uses HttpOnly cookies (JWT tokens), not URL parameters or Authorization headers. The only URL parameters used are for pagination, filtering, and time-bound HMAC-signed attachment URLs. API keys, session tokens, and credentials are never included in query strings or URL paths.

---

### Q12. Verify that authorization decisions are made at both the URI, enforced by programmatic or declarative security at the controller level, and at the resource level.

**Answer:** Yes

**Comment:** Authorization is enforced at multiple levels: (1) URI/route level — @jwt_required decorator on all protected endpoints ensures authentication. (2) Controller level — each endpoint extracts the authenticated user_id from the JWT and uses it to scope all database queries. (3) Resource level — all database queries include owner_id filters (e.g., db.ai_drafts.find_one({"_id": draft_id, "owner_id": user_id_obj})), ensuring users can only access their own resources. Admin endpoints additionally check the is_internal flag.

---

### Q13. Verify that enabled RESTful HTTP methods are a valid choice for the user or action, such as preventing normal users from using DELETE or PUT on protected API or resources.

**Answer:** Yes

**Comment:** All API routes explicitly declare their allowed HTTP methods (e.g., methods=["GET"], methods=["POST"], methods=["DELETE"]). Read operations use GET, create/action operations use POST, updates use PUT, and deletions use DELETE. No endpoints accept unintended methods. All state-changing operations (POST/PUT/DELETE) require CSRF token validation in addition to JWT authentication.

---

### Q14. Verify that the application build and deployment processes are performed in a secure and repeatable way, such as CI/CD automation, automated configuration management, and automated deployment scripts.

**Answer:** Yes

**Comment:** All components use automated CI/CD: (1) duet-server and duet-react auto-deploy to GCP Cloud Run on push to main via Google Cloud Build. (2) duet-landing auto-deploys to Cloudflare Pages on push to main. (3) GitHub Actions run tests on every PR: pytest for backend, Vitest for frontend, TypeScript checks for Chrome extension. (4) Dependencies are pinned via lockfiles (pnpm-lock.yaml, uv.lock). (5) Docker multi-stage builds ensure consistent, reproducible artifacts. (6) Cloud Build applies commit SHA labels for traceability.

---

### Q15. Verify that the application, configuration, and all dependencies can be re-deployed using automated deployment scripts, built from a documented and tested runbook in a reasonable time, or restored from backups in a timely fashion.

**Answer:** Yes

**Comment:** All deployments are automated and repeatable. Backend and frontend can be redeployed by pushing to the main branch — Cloud Build handles Docker image creation and Cloud Run deployment automatically. The landing page redeploys via Cloudflare Pages on git push. Configuration is managed through environment variables in GCP Secret Manager. MongoDB Atlas provides automated backups. All dependencies are version-pinned for reproducible builds.

---

### Q16. Verify that authorized administrators can verify the integrity of all security-relevant configurations to detect tampering.

**Answer:** Yes

**Comment:** All security-relevant configuration is version-controlled in git (security headers in _headers file, CORS settings in app.py, JWT configuration in config.py). Infrastructure configuration is managed through GCP Console and Cloudflare Dashboard with audit logs. Environment variables and secrets are managed through GCP Secret Manager with access logging. Changes to production configuration require git commits (code) or authenticated dashboard access (infrastructure).

---

### Q17. Verify that web or application server and application framework debug modes are disabled in production to eliminate debug features, developer consoles, and unintended security disclosures.

**Answer:** Yes

**Comment:** Production environment is configured with ENV=production and FLASK_ENV=production. No Flask/Quart debug mode is enabled (FLASK_DEBUG is not set). React production builds are compiled with optimizations and without source maps (GENERATE_SOURCEMAP=false). The Chrome extension production manifest excludes localhost from CSP. Application logging uses structured observability (Logfire) with reduced sampling in production (20% vs 100% in development).

---

### Q18. Verify that the supplied Origin header is not used for authentication or access control decisions, as the Origin header can easily be changed by an attacker.

**Answer:** Yes

**Comment:** The Origin header is not used for authentication or access control. Authentication relies exclusively on JWT tokens stored in HttpOnly cookies. CSRF protection uses a double-submit cookie pattern (separate CSRF token validated via X-CSRF-TOKEN header). The Origin header is captured in auth event logs for analytics/monitoring purposes only — never for authorization decisions.

---

### Q19. Verify that user set passwords are at least 12 characters in length.

**Answer:** No

**Comment:** Not applicable. Duet Mail uses Google OAuth 2.0 as its exclusive authentication mechanism. There are no user-set passwords — users authenticate entirely through their Google account. Password policies are enforced by Google's identity platform.

---

### Q20. Verify that system generated initial passwords or activation codes SHOULD be securely randomly generated, SHOULD be at least 6 characters long, and MAY contain letters and numbers.

**Answer:** No

**Comment:** Not applicable. The application does not generate passwords or activation codes. Authentication is handled exclusively through Google OAuth 2.0. No password generation, reset, or activation code functionality exists in the application.

---

### Q21. Verify that passwords are stored in a form that is resistant to offline attacks. Passwords SHALL be salted and hashed using an approved one-way key derivation or password hashing function.

**Answer:** No

**Comment:** Not applicable. No passwords are stored in the application. Authentication is exclusively via Google OAuth 2.0. Google handles all credential storage and verification. The only credentials stored are Google OAuth access/refresh tokens, which are encrypted at rest using MongoDB CSFLE with AES-256-CBC-HMAC-SHA-512.

---

### Q22. Verify shared or default accounts are not present (e.g. "root", "admin", or "sa").

**Answer:** Yes

**Comment:** No shared or default accounts exist. All user accounts are created through Google OAuth sign-in and are tied to individual Google accounts. Administrative access is controlled by an is_internal flag on specific user records — there are no generic admin accounts. Database access uses dedicated service accounts with scoped permissions.

---

### Q23. Verify that lookup secrets can be used only once.

**Answer:** Yes

**Comment:** OAuth authorization codes from Google are single-use by design — they are exchanged for tokens exactly once during the OAuth callback. HMAC-signed attachment URLs include expiration timestamps and are time-bound (3600 seconds default). The application does not use other lookup secrets or one-time codes.

---

### Q24. Verify that the out of band verifier expires out of band authentication requests, codes, or tokens after a usable period.

**Answer:** Yes

**Comment:** Not directly applicable — the application does not implement out-of-band authentication (no SMS/email OTP codes). Google OAuth handles all multi-factor authentication on their platform. JWT access tokens expire after 1 hour. Refresh tokens expire after 180 days.

---

### Q25. Verify that the initial authentication code is generated by a secure random number generator, containing at least 20 bits of entropy.

**Answer:** Yes

**Comment:** The application delegates initial authentication to Google OAuth 2.0, which generates authorization codes using Google's cryptographic infrastructure. Server-side random generation uses Python's secrets module (CSPRNG backed by os.urandom). JWT secret keys are configured as environment variables generated with sufficient entropy.

---

### Q26. Verify that logout and expiration invalidate the session token, such that the back button or a downstream relying party does not resume an authenticated session.

**Answer:** Yes

**Comment:** The logout endpoint (/google/logout) clears all JWT cookies by setting Max-Age=0 via unset_jwt_cookies(), and resets the token expiry cookie to 0. After logout, subsequent requests will not carry valid JWT tokens. Access tokens have a 1-hour expiration enforced server-side. The Chrome extension clears all cached data on logout (remote config, thread cache, usage cache, authentication state).

---

### Q27. Verify that the application gives the option to terminate all other active sessions after a successful password change, or other security-related event.

**Answer:** No

**Comment:** The application does not currently support terminating other active sessions, as there is no server-side session store or token blacklist — JWT tokens are stateless. However, since authentication is via Google OAuth, users can revoke Duet Mail's access from their Google Account settings (myaccount.google.com/permissions), which invalidates the OAuth refresh token and prevents new access token generation. The 1-hour access token expiry limits the window of exposure.

---

### Q28. Verify the application uses session tokens rather than static API secrets and keys, except with legacy implementations.

**Answer:** Yes

**Comment:** All user authentication uses JWT session tokens with 1-hour expiration (access tokens) and 180-day expiration (refresh tokens). No static API keys are used for user authentication. Server-to-server authentication uses Google OIDC token verification (for Cloud Tasks and Pub/Sub webhooks) and Stripe webhook signature verification — all time-bound, not static. All API secrets are stored as environment variables in GCP Secret Manager, never exposed to clients.

---

### Q29. Verify the application ensures a full, valid login session or requires re-authentication or secondary verification before allowing any sensitive transactions or account modifications.

**Answer:** Yes

**Comment:** All sensitive operations require a valid JWT session (enforced by @jwt_required on every protected endpoint). Payment operations go through Stripe's hosted checkout (Stripe handles PCI compliance and payment authentication). Account-level changes (Google OAuth token refresh) require the refresh token cookie. Since authentication is delegated to Google OAuth, Google's own security measures (MFA, suspicious activity detection) provide additional protection for the underlying account.

---

### Q30. Verify that the application enforces access control rules on a trusted service layer, especially if client-side access control is present and could be bypassed.

**Answer:** Yes

**Comment:** All access control is enforced server-side on the Python/Quart backend. The React frontend has route guards (RequireAuth, AdminRoute) for UX purposes only — these are never relied upon for security. Every API endpoint validates the JWT token server-side, extracts the user identity, and scopes all database queries to that user. Admin endpoints verify the is_internal flag from the database, not from client-provided data.

---

### Q31. Verify that all user and data attributes and policy information used by access controls cannot be manipulated by end users unless specifically authorized.

**Answer:** Yes

**Comment:** Access control attributes cannot be manipulated by users. The user_id is extracted server-side from the JWT token (signed with JWT_SECRET_KEY). The is_internal admin flag is stored in MongoDB and can only be modified with direct database access. JWT tokens are stored in HttpOnly cookies (not accessible to JavaScript). CSRF protection prevents cross-site request forgery. No access control decisions are based on client-provided headers, cookies, or request parameters that a user could tamper with.

---

### Q32. Verify that the principle of least privilege exists - users should only be able to access functions, data files, URLs, controllers, services, and other resources, for which they possess specific authorization.

**Answer:** Yes

**Comment:** Strict least-privilege access control: all database queries filter by owner_id ensuring users can only access their own data (threads, drafts, contacts, settings). Admin endpoints require is_internal flag verification. The Chrome extension requests only necessary permissions. Google OAuth scopes are strictly whitelisted — the application validates that granted scopes match the expected allowlist and rejects unauthorized scopes.

---

### Q33. Verify that access controls fail securely including when an exception occurs.

**Answer:** Yes

**Comment:** Access control failures result in denial by default: invalid/expired JWT returns 401, unauthorized access returns 403, resource not found returns 404 (preventing enumeration). Exception handlers return generic error messages to clients (e.g., "An error occurred") while logging detailed errors server-side only. Database queries that don't match the owner_id filter return empty results. The application follows a deny-by-default pattern — access is only granted when explicitly validated.

---

### Q34. Verify that sensitive data and APIs are protected against Insecure Direct Object Reference (IDOR) attacks, specifically targeting creation, reading, updating and deleting of records.

**Answer:** Yes

**Comment:** All CRUD operations validate resource ownership. Examples: draft access requires both _id AND owner_id match (db.ai_drafts.find_one({"_id": draft_id, "owner_id": user_id_obj})). Thread queries filter by owner_id. Contact queries filter by owner_id. Settings are scoped to the authenticated user. Calendar operations require admin verification for cross-user access. No endpoint allows accessing another user's resources by changing an ID parameter.

---

### Q35. Verify administrative interfaces use appropriate multi-factor authentication to prevent unauthorized use.

**Answer:** Yes

**Comment:** Administrative access requires Google OAuth authentication (which supports Google's MFA) plus server-side verification of the is_internal flag. Admin endpoints use the check_admin_access() function that verifies the requesting user has the is_internal flag set in the database. Since all authentication goes through Google OAuth, admin users benefit from Google's security features including 2-Step Verification, security keys, and suspicious activity detection.

---

### Q36. Verify that the application has defenses against HTTP parameter pollution attacks, particularly if the application framework makes no distinction about the source of request parameters.

**Answer:** Yes

**Comment:** The Quart framework (Python) handles request parameters via explicit extraction methods (request.args.get(), request.get_json()) that return single values, not arrays, preventing parameter pollution. Request body validation uses Pydantic models that enforce strict type checking and reject unexpected fields. No endpoints iterate over raw request parameters — all values are explicitly extracted by name.

---

### Q37. Verify that the application sanitizes user input before passing to mail systems to protect against SMTP injection.

**Answer:** Yes

**Comment:** Email sending uses the Mailgun HTTP API (not SMTP), which inherently prevents SMTP injection. Email parameters are passed as structured HTTP POST data (dict format), not string-concatenated SMTP commands. The application sends system emails (e.g., waitlist confirmations) with controlled sender addresses and templates — user input is passed as structured data fields, not raw email headers.

---

### Q38. Verify that the application avoids the use of eval() or other dynamic code execution features. Where there is no alternative, any user input being included must be sanitized or sandboxed before being executed.

**Answer:** Yes

**Comment:** No eval(), exec(), or dynamic code execution is used in production code. JSON parsing uses safe json.loads() calls. No pickle deserialization is used. No __import__() calls or unsafe getattr/setattr patterns found. The only "eval" references in the codebase are AI prompt evaluation test frameworks (evals/) used in development, not production code paths.

---

### Q39. Verify that the application protects against SSRF attacks, by validating or sanitizing untrusted data or HTTP file metadata.

**Answer:** Yes

**Comment:** The application does not make HTTP requests to user-supplied URLs. All external API calls use hardcoded, whitelisted endpoints: Gmail API (googleapis.com), OpenAI/Azure endpoints, Stripe API, Mailgun API, Customer.io API. Gmail attachment downloads go through the Gmail API using Google's authenticated endpoints. Webhook endpoints (Stripe, Google Pub/Sub) validate signatures before processing — they don't follow redirects or fetch user-specified URLs.

---

### Q40. Verify that the application sanitizes, disables, or sandboxes user-supplied Scalable Vector Graphics (SVG) scriptable content, especially as they relate to XSS.

**Answer:** Yes

**Comment:** SVG content is explicitly stripped by the server-side HTML sanitizer (sanitation_utils.py). The sanitize_html() and sanitize_signature_html() functions include "svg" in the dangerous tags list with the comment "Can contain script via onload" — SVG elements are fully decomposed (removed) from any user-supplied HTML content. Frontend DOMPurify configurations also do not allow SVG elements.

---

### Q41. Verify that output encoding is relevant for the interpreter and context required. For example, use encoders specifically for HTML values, HTML attributes, JavaScript, URL parameters, HTTP headers, SMTP, and other contexts.

**Answer:** Yes

**Comment:** React's default JSX rendering automatically escapes text content, preventing XSS in standard rendering. For HTML content display (email bodies, AI-generated drafts), DOMPurify sanitization is applied with context-appropriate configurations — ThreadSummaryPanel restricts to only b/i/a tags, SignatureEditor uses default DOMPurify config. Server-side HTML sanitization (BeautifulSoup-based) strips dangerous tags and attributes, validates URL schemes (blocks javascript:/data:/vbscript:), and removes event handlers.

---

### Q42. Verify that the application protects against JSON injection attacks, JSON eval attacks, and JavaScript expression evaluation.

**Answer:** Yes

**Comment:** All JSON parsing uses safe standard library methods (json.loads() in Python, JSON.parse() in JavaScript/TypeScript). No JSON content is passed to eval(). Pydantic models validate and type-check all incoming JSON request bodies. API responses use Quart's jsonify() which produces safe JSON output. No dynamic JavaScript expression evaluation is used anywhere in the application.

---

### Q43. Verify that the application protects against LDAP injection vulnerabilities, or that specific security controls to prevent LDAP injection have been implemented.

**Answer:** Yes

**Comment:** Not applicable. The application does not use LDAP or any directory services. Authentication is exclusively via Google OAuth 2.0. User data is stored in MongoDB (NoSQL). All MongoDB queries use parameterized dict-based queries (PyMongo), not string concatenation, which also prevents NoSQL injection.

---

### Q44. Verify that regulated private data is stored encrypted while at rest, such as Personally Identifiable Information (PII), sensitive personal information, or data assessed likely to be subject to GDPR.

**Answer:** Yes

**Comment:** Sensitive data is encrypted at rest using MongoDB CSFLE (Client-Side Field Level Encryption) with AES-256-CBC-HMAC-SHA-512-Random algorithm. Encrypted fields include: all Gmail message bodies (full HTML content) and Google OAuth access/refresh tokens. The master encryption key is managed by GCP Cloud KMS (isolated from the application). MongoDB Atlas additionally provides storage-level encryption. All data is transmitted over TLS.

---

### Q45. Verify that all cryptographic operations are constant-time, with no 'short-circuit' operations in comparisons, calculations, or returns, to avoid leaking information.

**Answer:** Yes

**Comment:** Cryptographic operations delegate to battle-tested libraries: MongoDB's native CSFLE library (mongo_crypt shared library) for encryption, Google's OAuth library for token verification, and Python's hmac.compare_digest() for HMAC signature comparisons (constant-time by design). The application does not implement custom cryptographic algorithms. Webhook signature verification (Stripe, Mailgun) uses hmac.compare_digest() which is resistant to timing attacks.

---

### Q46. Verify that random GUIDs are created using the GUID v4 algorithm, and a Cryptographically-secure Pseudo-Random Number Generator (CSPRNG).

**Answer:** Yes

**Comment:** Server-side random generation uses Python's secrets module (secrets.SystemRandom()), which is a CSPRNG backed by os.urandom(). MongoDB ObjectIds are used for database record identifiers. CSFLE key IDs use base64-encoded UUIDs generated by MongoDB's encryption library. JWT secret keys are configured as environment variables with sufficient entropy.

---

### Q47. Verify that key material is not exposed to the application but instead uses an isolated security module like a vault for cryptographic operations.

**Answer:** Yes

**Comment:** The master encryption key is stored in GCP Cloud KMS, completely isolated from the application. The application never has direct access to the master key — CSFLE operations are performed by the MongoDB driver which communicates with GCP KMS for key wrapping/unwrapping. Data Encryption Keys (DEKs) are stored in MongoDB's encryption.__keyVault collection, encrypted by the KMS master key. Application secrets (JWT key, API keys) are stored in GCP Secret Manager and injected as environment variables at deployment time.

---

### Q48. Verify that the application does not log credentials or payment details. Session tokens should only be stored in irreversible, hashed form.

**Answer:** Yes

**Comment:** The application does not log credentials, tokens, or payment details. Verified: access tokens, refresh tokens, JWT tokens, and CSRF tokens are never written to logs. Auth event logging captures only event types, timestamps, and user identifiers. Payment processing is fully delegated to Stripe — no card data touches our servers. Stripe webhook event logging stores event metadata only, not payment credentials. The token expiry cookie contains only a timestamp (milliseconds since epoch), not the token itself.

---

### Q49. Verify the application protects sensitive data from being cached in server components such as load balancers and application caches.

**Answer:** Yes

**Comment:** Sensitive API responses do not include cache-friendly headers — dynamic endpoints return responses that are not cached by CDN or load balancers. Redis is used only for job deduplication and rate limiting, not for caching sensitive data. GCP Cloud Run does not cache application responses. Google OAuth tokens are stored only in encrypted MongoDB documents and HttpOnly cookies. The landing site's _headers file sets appropriate Cache-Control directives (no-cache for HTML, immutable for static assets).

---

### Q50. Verify that data stored in browser storage (such as localStorage, sessionStorage, IndexedDB, or cookies) does not contain sensitive data.

**Answer:** Yes

**Comment:** JWT tokens are stored exclusively in HttpOnly cookies (not accessible to JavaScript). Browser localStorage/sessionStorage is used only for UI state (sidebar position, panel size) and analytics metadata (UTM parameters, event tracking). The Chrome extension stores only an isAuthenticated boolean flag in browser.storage.local. User details in the extension are cached in-memory (volatile service worker memory with TTL), not persisted to storage. No sensitive data (tokens, email content, credentials) is stored in client-accessible browser storage.

---

### Q51. Verify that sensitive data is sent to the server in the HTTP message body or headers, and that query string parameters from any HTTP verb do not contain sensitive data.

**Answer:** Yes

**Comment:** All sensitive data is transmitted in HTTP request/response bodies or HttpOnly cookies — never in URL query strings. Authentication uses HttpOnly cookies (JWT tokens automatically included by browser). CSRF tokens are sent via the X-CSRF-TOKEN header. API request payloads use JSON request bodies (POST/PUT). The only URL parameters used are for pagination, filtering, and time-bound HMAC-signed attachment URLs (which contain a signature, not sensitive data).

---

### Q52. Verify accessing sensitive data is audited (without logging the sensitive data itself), if the data is collected under relevant data protection directives or where logging of access is required.

**Answer:** Yes

**Comment:** Authentication events are audited via the auth_event_service (login success/failure, source, timestamps). Payment events are logged to a dedicated stripe_webhook_logs collection. Pricing configuration changes are tracked with audit notes in pricing_version_history. API access is logged through structured observability (Logfire) with request metadata. Sensitive data content (email bodies, tokens) is never included in audit logs — only event types, user IDs, and timestamps are recorded.

---

### Q53. Verify that connections to and from the server use trusted TLS certificates. Where locally generated or self-signed certificates are used, the server must be configured to only trust specific internal CAs and specific self-signed certificates. All others should be rejected.

**Answer:** Yes

**Comment:** All production connections use trusted TLS certificates: GCP Cloud Run provides managed TLS certificates for api.duetmail.com and app.duetmail.com. Cloudflare provides managed TLS for duetmail.com. MongoDB Atlas connections use SSL/TLS (ssl=True). All cookie flags include Secure=True, enforcing HTTPS-only transmission. Self-signed certificates are only allowed in the development environment (tlsAllowInvalidCertificates = is_development) and never in production.

---

### Q54. Verify that proper certification revocation, such as Online Certificate Status Protocol (OCSP) Stapling, is enabled and configured.

**Answer:** Yes

**Comment:** Certificate management is handled by managed infrastructure providers: GCP Cloud Run uses Google-managed certificates with automatic renewal and revocation handling. Cloudflare manages TLS certificates for the landing site with OCSP stapling enabled by default. MongoDB Atlas uses AWS/Azure/GCP managed certificates with automatic rotation. The application relies on these managed services for certificate lifecycle management, including revocation checks, rather than implementing custom certificate management.
