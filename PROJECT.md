# Project: SpeakLife AI — Master Quality Upgrade
# Path: c:\Users\ADMIN\Desktop\project 11\SpeakLife AI

## Architecture
- **Architecture Style**: Modular Monolith with Clean Layering
  - **Presentation Layer**: Next.js 14 App Router, React 18, Tailwind CSS, Three.js 3D Virtual Auditorium, Emil Kowalski Motion.
  - **Edge Processing Layer**: Client-Side MediaPipe Face Mesh & Pose (WASM 30 FPS), Web Audio API (RMS/F0 Prosody) with Zero-Data Retention (0 biometric bytes to cloud).
  - **Application Layer**: API Route Handlers (`/api/auth/*`, `/api/session/*`, `/api/judge/*`, `/api/report/*`), Zod request/response validation, Session Management.
  - **Domain Layer**: MPRE 100-Point Scientific Rubric Calculator, Gemini 2.0 Adversarial Judge Gateway with XML Delimiters and prompt injection guards.
  - **Infrastructure Layer**: Mongoose Database Connector (MongoDB Atlas) with Ephemeral In-Memory Fallback Store, Jose JWT Authentication, File Magic-Number Validator.
- **Figma Design Integration**:
  - Design File Key: `ICRiFjqNf4Iz9Fhqs1BIjm` (URL: `https://www.figma.com/design/ICRiFjqNf4Iz9Fhqs1BIjm`)
  - FigJam Board Key: `doZhOsMGk5YdKiF3I5IEDc` (URL: `https://www.figma.com/board/doZhOsMGk5YdKiF3I5IEDc`)
  - Token Bridge: Figma Variables -> `design-tokens.json` -> `src/styles/tokens.css` -> `tailwind.config.ts` -> React Components.

---

## Feature Inventory
| # | Feature ID | Name | Description | Milestone | Source |
|---|---|---|---|---|---|
| 1 | F-01 | Design Token Bridge | Figma Variables mapped to CSS Custom Properties & Tailwind | M1 | survey_spec_miner_1 |
| 2 | F-02 | UI Primitives Library | Button, Badge, Card, Progress, Dialog, Alert components | M1 | survey_spec_miner_1 |
| 3 | F-03 | Core Types & Utils | Global TypeScript interfaces, `cn()`, and `formatTime()` | M1 | survey_spec_miner_1 |
| 4 | F-04 | Public Landing Experience | Hero section, Problem/Solution narrative, Feature highlights | M1 | survey_spec_miner_1 |
| 5 | F-05 | Privacy Center & ZDR Explainer | Clear disclosure of Zero-Data Retention & WASM edge processing | M1 | survey_spec_miner_1 |
| 6 | F-06 | Database Connector & Caching | Mongoose connection manager with Atlas & In-Memory fallback | M2 | survey_spec_miner_1 |
| 7 | F-07 | User & Session Models | Schema definitions for User, Session, Rehearsal, Report | M2 | survey_spec_miner_1 |
| 8 | F-08 | Authentication Engine | Jose JWT, Argon2id/PBKDF2 (100k rounds), HttpOnly cookie session | M2 | survey_spec_miner_1 |
| 9 | F-09 | API Validation Layer | Strict Zod validation schemas for all inbound & outbound payloads | M2 | survey_spec_miner_1 |
| 10 | F-10 | Ephemeral In-Memory Fallback | Fully functional offline/disconnected mode for labs and tests | M2 | survey_spec_miner_1 |
| 11 | F-11 | Practice Setup Wizard | Scenario picker, difficulty selector, duration, and objective | M3 | survey_spec_miner_1 |
| 12 | F-12 | Outline & Document Ingestion | Text & PDF ingestion with sanitize boundaries | M3 | survey_spec_miner_1 |
| 13 | F-13 | Three.js 3D Auditorium | Interactive 3D hall with adaptive audience avatars and lighting | M3 | survey_spec_miner_1 |
| 14 | F-14 | Client-side Face Mesh & Pose | MediaPipe WASM eye contact, gaze vector, head/shoulder posture | M3 | survey_spec_miner_1 |
| 15 | F-15 | Web Audio Prosody Meter | Real-time RMS volume, F0 pitch variance, cadence, pause detection | M3 | survey_spec_miner_1 |
| 16 | F-16 | Live Rehearsal HUD | Real-time heads-up telemetry display with non-intrusive feedback | M3 | survey_spec_miner_1 |
| 17 | F-17 | Rehearsal Flow Controls | Start, pause, resume, finish, and emergency recovery controls | M3 | survey_spec_miner_1 |
| 18 | F-18 | Adversarial AI Judge | Gemini 2.0 Flash cross-examination panel with countdown timer | M3 | survey_spec_miner_1 |
| 19 | F-19 | Prompt Injection Boundary | `<UNTRUSTED_STUDENT_OUTLINE>` XML tags & prompt guards | M3 | survey_spec_miner_1 |
| 20 | F-20 | Offline Fallback Questions | Deterministic rule-based questions when Gemini quota/timeout hits | M3 | survey_spec_miner_1 |
| 21 | F-21 | MPRE 100-Point Calculator | Standardized 5-axis mathematical scoring engine | M3 | survey_spec_miner_1 |
| 22 | F-22 | Insufficient Data Detection | Explicit flagging when telemetry coverage is <60% | M3 | survey_spec_miner_1 |
| 23 | F-23 | Multimodal Radar Chart | 5-axis SVG/Canvas radar visualization of MPRE performance | M3 | survey_spec_miner_1 |
| 24 | F-24 | Speaking Pace & Prosody Graph | Time-series WPM and pitch cadence visualizer | M3 | survey_spec_miner_1 |
| 25 | F-25 | Filler Words Timeline | Exact timestamp and frequency mapping of Vietnamese fillers | M3 | survey_spec_miner_1 |
| 26 | F-26 | Actionable Micro-Drills | Targeted practice exercises derived from lowest scoring MPRE axes | M3 | survey_spec_miner_1 |
| 27 | F-27 | PDF Report Exporter | Client-side export of comprehensive diagnostic report | M3 | survey_spec_miner_1 |
| 28 | F-28 | Defense-in-Depth Middleware | CSP, HSTS, X-Content-Type-Options, Referrer-Policy headers | M4 | survey_spec_miner_1 |
| 29 | F-29 | File Upload Magic Numbers | MIME verification for PDF (`%PDF-`) and DOCX (`PK\x03\x04`) | M4 | survey_spec_miner_1 |
| 30 | F-30 | Anti-IDOR Authorization | Mandatory tenant/user ownership verification on every resource | M4 | survey_spec_miner_1 |
| 31 | F-31 | Adaptive Performance Scaler | Low-FPS detection and auto-downscale (30 FPS -> 15 FPS) | M4 | survey_spec_miner_1 |
| 32 | F-32 | WebGL Cleanup & Leaks Defense | Proactive buffer/geometry disposal on component unmount | M4 | survey_spec_miner_1 |
| 33 | F-33 | 10 Mandated Tracking Docs | UPGRADE_WORKLOG, SKILL_TOOL_INVENTORY, ASVS checklist, etc. | M4 | survey_spec_miner_1 |
| 34 | F-34 | E2E Opaque-Box Test Suite | Tiers 1-4 comprehensive automated testing via node/vitest | M5 | survey_spec_miner_1 |
| 35 | F-35 | Adversarial Coverage Hardening | Tier 5 white-box mutation & edge test suite generation | M5 | survey_spec_miner_1 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Design System Foundations & UI Primitives | `tsconfig.json`, `tailwind.config.ts`, `tokens.css`, `src/lib/utils.ts`, `src/lib/types/`, `src/components/ui/*`, Landing & Privacy UI | none | PLANNED |
| M2 | Enterprise Backend, Auth & Database Layer | Mongoose DB connector, In-Memory fallback, User/Session models, Jose JWT auth, Argon2id/PBKDF2, Zod validation | M1 | PLANNED |
| M3 | Multimodal Rehearsal Core & AI Evaluation | Three.js Auditorium, MediaPipe Edge Vision, Web Audio prosody, Gemini Gateway, MPRE Calculator, Diagnostic Reports | M1, M2 | PLANNED |
| M4 | Defense-in-Depth Security, ASVS & Tracking Docs | Security middleware (CSP/HSTS), Magic-number MIME upload, Anti-IDOR, Low-FPS scaler, WebGL cleanup, 10 tracking docs | M2, M3 | PLANNED |
| M5 | Final Milestone: E2E Test Suite & Adversarial Hardening | Phase 1: Pass 100% of Tiers 1-4 E2E tests. Phase 2: Tier 5 adversarial coverage hardening | M1, M2, M3, M4, TEST_READY | PLANNED |

---

## Interface Contracts

### M1 ↔ M2 / M3 / M4 (Design System & Types Contract)
- `src/lib/types/index.ts`:
  - `export type ScenarioType = 'khkt_defense' | 'class_lecture' | 'english_debate' | 'admission_interview';`
  - `export type DifficultyLevel = 'gentle' | 'balanced' | 'rigorous' | 'adversarial';`
  - `export interface PresentationContext { id: string; title: string; scenario: ScenarioType; difficulty: DifficultyLevel; outline?: string; durationMinutes: number; }`
  - `export interface MetricDataPoint { timestamp: number; eyeContactPercent: number; headStabilityPercent: number; shoulderTiltDegrees: number; volumeDb: number; pitchHz: number; wpm: number; }`
  - `export interface RubricAxisScore { score: number; maxScore: number; status: 'measured' | 'estimated' | 'ai_evaluated' | 'insufficient_data'; feedback: string[]; }`
  - `export interface DiagnosticReportData { id: string; sessionId: string; userId: string; overallScore: number; rank: string; axes: { bodyLanguage: RubricAxisScore; voiceProsody: RubricAxisScore; fillerWords: RubricAxisScore; contentLogic: RubricAxisScore; qaReflex: RubricAxisScore; }; isInsufficientData: boolean; createdAt: string; }`
- `src/lib/utils.ts`:
  - `export function cn(...inputs: ClassValue[]): string;`
  - `export function formatTime(seconds: number): string;`

### M2 ↔ M3 / M4 (Backend & Auth Contract)
- `src/lib/db.ts`:
  - `export async function connectDB(): Promise<typeof mongoose>;`
  - `export function getStoreMode(): 'mongodb' | 'ephemeral_memory';`
- `src/lib/auth.ts`:
  - `export async function hashPassword(plain: string): Promise<string>;`
  - `export async function verifyPassword(plain: string, hash: string): Promise<boolean>;`
  - `export async function signSessionToken(payload: { userId: string; email: string }): Promise<string>;`
  - `export async function verifySessionToken(token: string): Promise<{ userId: string; email: string } | null>;`

### M3 ↔ M5 (MPRE Calculator Contract)
- `src/lib/rubric/mpre-calculator.ts`:
  - `export function calculateMpreScore(sessionData: RawSessionData): DiagnosticReportData;`
  - Must return `isInsufficientData: true` when video data coverage is $<60\%$, setting diagnostic flag without awarding unearned score.

---

## Code Layout
Canonical Workspace: `c:\Users\ADMIN\Desktop\project 11\SpeakLife AI`
```
c:\Users\ADMIN\Desktop\project 11\SpeakLife AI\
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── design-tokens.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── rehearsal/
│   │   ├── report/
│   │   └── api/
│   │       ├── auth/
│   │       ├── session/
│   │       ├── judge/
│   │       └── report/
│   ├── components/
│   │   ├── ui/             # button, badge, card, progress, dialog, alert
│   │   ├── layout/         # navbar, footer, sidebar
│   │   └── features/       # auditorium, edge-vision, audio-prosody, judge, radar
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── types/index.ts
│   │   ├── db.ts           # Mongoose + In-Memory fallback
│   │   ├── auth.ts         # Jose JWT + Argon2id/PBKDF2
│   │   ├── models/         # User, Session, Report schemas
│   │   ├── ai/             # Gemini Gateway + Prompt Guard
│   │   ├── rubric/         # MPRE 100-pt calculator
│   │   └── security/       # MIME validator, rate limiter, ASVS utils
│   └── styles/
│       ├── globals.css
│       └── tokens.css
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/                   # 10 tracking files & specs
```
