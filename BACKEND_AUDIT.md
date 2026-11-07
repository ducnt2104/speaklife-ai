# SPEAKLIFE AI — BACKEND ARCHITECTURAL AUDIT & DATA FLOW MAP
## Modular Monolith Engineering, API Contracts, and Resilience

Document ID: `AUDIT-BE-2026-v2.1` | Target Runtime: Node.js 20+ / Next.js 14 on Render Free | Date: 2026-11-07

---

## 1. Architectural Topology & Layer Boundaries

SpeakLife AI employs a **Modular Monolith** architecture optimized for high reliability, minimal operational complexity, and resource-bounded deployment on Render's free compute tier:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│    Next.js 14 App Router (RSC + Client Components)          │
│    WebAssembly Edge Vision & Web Audio In-Memory Workers     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON (Zod Validated)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│    • Helmet Security Headers & Content-Security-Policy      │
│    • Sliding Window In-Memory Rate Limiter (Sliding Window) │
│    • NoSQL / HTML Input Sanitizers & Control Strip          │
│    • Anti-Prompt-Injection Demarcation Guard                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN SERVICES                        │
│    • MPRE 5-Axis Rubric Evaluator Engine                    │
│    • Vietnamese & English Filler Word Lexicon Matcher       │
│    • Gaze Vector Deviation & Angular Math Engine            │
│    • Adversarial Judge Q&A Prompt Chaining Service          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE & EXTERNAL                   │
│    • Google Gemini 2.0 Flash Gateway (Strict JSON Schema)   │
│    • PBKDF2 SHA-512 Password Engine (100k rounds)           │
│    • MongoDB Session Repository (Least Privilege TLS)       │
│    • Resilient Heuristic Fallback Provider                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. API Endpoint Audit & Specifications

### 2.1. System Health & Readiness (`GET /api/health`)
- **Purpose**: Cold-start latency mitigation, uptime tracking, and memory diagnostics.
- **Access Level**: Public (Unauthenticated).
- **Rate Limit**: 60 requests/min.
- **Contract**:
  ```json
  {
    "status": "healthy",
    "uptimeSec": 452,
    "environment": "production",
    "privacyStatus": "Zero-Data Retention Verified",
    "edgeAiStatus": "MediaPipe WASM + Web Audio Active",
    "memory": { "rssMb": 48, "heapUsedMb": 28 },
    "version": "2.1.0"
  }
  ```

### 2.2. Adversarial AI Judge Gateway (`POST /api/judge`)
- **Purpose**: Generates targeted counter-questions and evaluates student rebuttal responses.
- **Access Level**: Authenticated student session or verified guest token.
- **Rate Limit**: 25 calls/minute per IP (Prevents token budget exhaustion).
- **Security Defenses**:
  - `wrapUntrustedContent`: Demarcates student outline within `<presentation_outline>` tags.
  - `detectPromptInjection`: Intercepts system prompt overrides, developer mode hacks, and score-tampering keywords.
  - `truncateSafe`: Limits input to 3000 chars.
  - `responseMimeType: "application/json"` with Zod schema verification.
  - **Graceful Degradation**: Transparently serves high-fidelity pedagogical fallbacks on API key absence, HTTP 429, or network timeout.

### 2.3. Multimodal Diagnostic Report Engine (`POST /api/report`)
- **Purpose**: Normalizes 5-axis presentation telemetry into an official 100-point rubric score.
- **Access Level**: Authenticated session owner.
- **Rate Limit**: 30 reports/minute per IP.
- **Security Defenses**: Validates all incoming telemetry (eyeContactRatio, WPM, timestamps) using Zod. Rejects NaN, negative timestamps, or out-of-bound scores.

### 2.4. Session Governance & Access Control (`POST / GET /api/session`)
- **Purpose**: Secure session persistence with ownership enforcement.
- **Access Level**: Authenticated owner (`Default Deny`).
- **Anti-IDOR Control**: Validates that `session.userId === request.headers['x-user-id']`. Cross-user access returns `HTTP 403 Forbidden` and logs a security event.
- **TTL Expiration**: Sessions automatically expire and purge after 24 hours.

---

## 3. Cryptographic Security & Authentication Audit

- **Algorithm**: PBKDF2 with SHA-512, 100,000 iterations, 32-byte cryptographically secure random salt (OWASP ASVS V2.4.1 compliance).
- **Timing Attack Resistance**: Uses `crypto.timingSafeEqual` for all hash comparisons to eliminate timing side-channel leakage.
- **Password Complexity**: Enforces 8+ character length requirement; prevents blank or whitespace passwords.
- **Session Tokens**: 128-bit cryptographically random tokens stored in HttpOnly, Secure, SameSite=Lax cookies in production.

---

## 4. Resilience & Graceful Degradation Strategy

| Failure Scenario | Backend Behavior | User Experience Impact |
|---|---|---|
| **Gemini API Outage / 429 Quota Exceeded** | Transparently invokes `mock-evaluator` with realistic GDPT 2018 feedback. | Student rehearsal completes uninterrupted; report generated without error. |
| **Render Free Tier Spin-Down (Cold Start)** | Healthcheck warmup endpoint (`/api/health`) pre-heats app during landing page viewing. | UI displays graceful loading skeleton instead of blank screen. |
| **MongoDB Atlas Connection Interruption** | In-memory session fallback retains rehearsal telemetry for current browser session. | No data lost; student can review and export report. |
| **Weak Camera / Low-End Hardware** | MediaPipe throttles processing frequency; HUD switches to 2D low-GPU mode. | Frame rate remains smooth (>25 FPS); scores remain mathematically sound. |
