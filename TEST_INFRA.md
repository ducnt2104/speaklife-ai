# SPEAKLIFE AI — TEST INFRASTRUCTURE SPECIFICATION (`TEST_INFRA.md`)
**Standard**: Gameshow "Đấu trường AI" TP. Đồng Nai năm 2026 — Bảng B (THPT)  
**System**: SpeakLife AI — "Phòng luyện phản xạ giao tiếp và thuyết trình thực chiến"  
**Document Status**: Official Quality Assurance & Test Architecture Specification  
**Author**: E2E Testing Specialist (`teamwork_test_writer`)  
**Date**: November 2026  

---

## 1. Executive Summary & Test Philosophy

The testing infrastructure of **SpeakLife AI** is designed around an **opaque-box, requirement-driven, deterministic evaluation model**. Rather than testing internal implementation artifacts that are prone to brittle coupling, the test suite exercises the software exclusively against documented interface contracts, mathematical formulas, OWASP ASVS Level 2 security invariants, and real-world high school rehearsal workflows.

### Core Testing Pillars:
1. **Opaque-Box Verification**: Tests validate inputs against expected outputs derived from `PROJECT.md`, `ORIGINAL_REQUEST.md`, and official competition rules (`docs/SPEC_OFFICIAL_DONG_NAI_2026.md`).
2. **Deterministic Mathematical Scoring**: The 5-axis Multimodal Presentation Reflex Engine (MPRE 100-Point Rubric) is verified with exact floating-point tolerances and boundary conditions.
3. **Zero-Data Retention (ZDR) Invariant**: Verification guarantees zero raw video frames, audio PCM buffers, or facial biometric landmarks are persisted or transmitted across trust boundaries.
4. **Defense-in-Depth Security**: Rigorous assertions covering prompt injection defenses, XML demarcation encapsulation, NoSQL injection neutralization, XSS sanitization, and anti-IDOR authorization.
5. **Offline & Edge Resilience**: Verification of seamless graceful degradation when Gemini API quotas are exhausted, MongoDB Atlas is disconnected, or client hardware drops below 15 FPS.

---

## 2. Test Architecture & Directory Layout

The automated testing framework uses Node.js native test runner (`node:test`) and assertion module (`node:assert`). This architecture provides near-instant execution (sub-2 second full test suite runtime), zero third-party testing dependencies, full ESM/CommonJS compatibility, and native integration into CI/CD pipelines.

### Directory Structure:
```
c:\Users\ADMIN\Desktop\project 11\SpeakLife AI\
├── TEST_INFRA.md                                  # [This Document] Architecture & methodology
├── TEST_READY.md                                  # Readiness certificate & tier coverage summary
├── package.json                                   # NPM scripts ("test": "node --test ...")
├── test/                                          # Baseline legacy integration & unit tests
│   ├── auth.test.js
│   ├── filler.test.js
│   ├── rubric.test.js
│   └── security.test.js
├── tests/
│   ├── unit/                                      # Specialized unit tests
│   │   ├── filler-detector.test.js
│   │   ├── mpre-calculator.test.js
│   │   └── password-security.test.js
│   ├── security/                                  # Security-focused unit tests
│   │   └── prompt-guard.test.js
│   └── e2e/                                       # End-to-End Automated Test Suite
│       ├── runner.test.js                         # Master E2E Coordinator & Entrypoint
│       ├── tier1-feature-coverage.test.js         # Tier 1: Category-Partition Feature Coverage
│       ├── tier2-boundary-corner.test.js          # Tier 2: Boundary Value Analysis & Edge Cases
│       ├── tier3-pairwise-combinations.test.js    # Tier 3: Cross-Feature Pairwise Interactions
│       └── tier4-realworld-scenarios.test.js      # Tier 4: Real-World Multi-Step User Workflows
```

---

## 3. Invocation Commands & Execution Modes

The test suite supports targeted execution by individual tier, direct invocation of the E2E master runner, or execution of the entire project test suite:

### 3.1 Primary Execution Commands
| Target | Command | Purpose |
|---|---|---|
| **Master E2E Suite** | `node --test tests/e2e/runner.test.js` | Runs all 4 tiers of E2E tests via unified coordinator |
| **Full Project Suite** | `npm test` | Runs all legacy, unit, security, and E2E test suites |
| **Tier 1 Only** | `node --test tests/e2e/tier1-feature-coverage.test.js` | Fast verification of core feature functions |
| **Tier 2 Only** | `node --test tests/e2e/tier2-boundary-corner.test.js` | Verification of boundary values, nulls, and limits |
| **Tier 3 Only** | `node --test tests/e2e/tier3-pairwise-combinations.test.js` | Verification of feature combinations & matrices |
| **Tier 4 Only** | `node --test tests/e2e/tier4-realworld-scenarios.test.js` | Multi-step end-to-end user workflow simulations |

### 3.2 Pass/Fail Semantics & Exit Codes
- **Exit Code 0**: 100% of all executed test assertions passed. No unhandled rejections or uncaught exceptions occurred.
- **Exit Code 1**: Any test failure, assertion violation, timeout, or uncaught exception.
- **Strict Quality Rule**: The test runner enforces zero tolerance for flaky tests, swallowed exceptions, or soft warnings. Every failure halts pipeline promotion.

---

## 4. 4-Tier Test Methodology & Coverage Matrix

The test framework applies a 4-Tier testing methodology ensuring comprehensive coverage from individual feature behavior up to complex, multi-stage real-world applications:

```
+---------------------------------------------------------------------------------------+
|                                    4-TIER E2E HIERARCHY                               |
+---------------------------------------------------------------------------------------+
|  [Tier 4: Real-World End-to-End User Scenarios]                                       |
|  - Multi-step realistic student journeys (KHKT Gold Standard, English Debate Anxiety, |
|    Offline Interview Resilience, Adversarial Red Team Attack Audit)                   |
|                                       ^                                               |
|  [Tier 3: Cross-Feature Pairwise Combinations]                                        |
|  - Scenario x Difficulty matrix (4x4)                                                 |
|  - Media Quality x Network Resilience matrix                                          |
|  - Auth State x IDOR Access Control matrix                                            |
|                                       ^                                               |
|  [Tier 2: Boundary Value Analysis & Corner Cases]                                     |
|  - Exact thresholds: WPM (89, 90, 119, 120, 145, 146, 160, 161)                       |
|  - Gaze ratios (39.9% vs 40%, 59.9% vs 60%, 74.9% vs 75%)                             |
|  - Telemetry coverage (64.9% Insufficient Data vs 65% Valid)                          |
|  - Character limits (0, 5000, 5001 rejected, 10000 max), Passwords (7 vs 8 chars)     |
|                                       ^                                               |
|  [Tier 1: Category-Partition Feature Coverage]                                        |
|  - Core feature happy-path behaviors (>=5 tests per core feature across 35 features)   |
+---------------------------------------------------------------------------------------+
```

### 4.1 Tier 1: Category-Partition Feature Coverage
Tier 1 covers the functional contracts of features cataloged in `PROJECT.md § Feature Inventory` (F-01 through F-35), with a minimum threshold of **$\ge 5$ test cases per core feature group**:
1. **F-01 - F-03 (Design System, UI Primitives & Core Utils)**:
   - CSS token definitions, `cn()` conditional class merge, `formatTime()` formatting, `formatPercentage()` normalization, scenario & difficulty type safety.
2. **F-05 - F-07 (Privacy Center, ZDR Invariants, DB & Session Models)**:
   - Zero-Data Retention client-side RAM guarantee (0 cloud media bytes), session schema validation, default deny posture, TTL expiration.
3. **F-08 - F-10 (Authentication Engine, API Validation Layer & Fallback)**:
   - PBKDF2-SHA512 100k rounds password hashing, unique salt generation, constant-time verification, strict Zod schema rejection, in-memory repository fallback.
4. **F-11 - F-12 (Practice Setup Wizard & Document Ingestion)**:
   - Scenario validation, difficulty selection, text outline truncation, character limit enforcement, PDF text extraction metadata.
5. **F-14 - F-15 (Edge Computer Vision & Audio Prosody)**:
   - Gaze angle vector computation, acceptance cone ($|\text{yaw}| \le 16^\circ, |\text{pitch}| \le 18^\circ$), shoulder tilt symmetry, WPM pace calculation, F0 pitch variance, RMS sound level.
6. **F-18 - F-20 (Adversarial AI Judge & Prompt Guard)**:
   - Targeted counter-question generation, countdown reflex timer, heuristic offline fallback questions, prompt injection detection, XML tag encapsulation (`<UNTRUSTED_STUDENT_OUTLINE>`).
7. **F-21 - F-23 (MPRE 100-Point Rubric & Insufficient Data)**:
   - 5-axis mathematical scoring (Body: 25, Voice: 20, Fillers: 15, Content: 20, Reflex: 20), achievement tiers ("Xuất sắc", "Khá tốt", "Cần rèn luyện"), Insufficient Data flag when tracking $<65\%$, radar chart normalization.
8. **F-24 - F-26 (Pacing Graph, Filler Timeline & Micro-Drills)**:
   - Vietnamese filler word regex matching (`à`, `ừm`, `thì là`, `kiểu như`, `thực sự thì`), timestamp indexing, targeted micro-drill assignment.
9. **F-27 - F-30 (PDF Export, Security Headers, Magic Numbers & Anti-IDOR)**:
   - Printable report data structure, security headers (CSP, HSTS), MIME magic numbers (`%PDF-`, `PK\x03\x04`), anti-IDOR cross-user access restriction (403 Forbidden).

### 4.2 Tier 2: Boundary Value Analysis (BVA) & Corner Cases
Tier 2 subjects all threshold-dependent features to strict boundary value verification:
1. **Speaking Rate (WPM) Boundaries**:
   - $\text{WPM} = 89$ (Penalized slow: 6 pts) vs $\text{WPM} = 90$ (12 pts)
   - $\text{WPM} = 119$ (16 pts) vs $\text{WPM} = 120$ (Golden standard: 20 pts)
   - $\text{WPM} = 145$ (Golden standard: 20 pts) vs $\text{WPM} = 146$ (16 pts)
   - $\text{WPM} = 160$ (16 pts) vs $\text{WPM} = 161$ (Excessive fast: 10 pts)
2. **Eye Contact & Face Coverage Boundaries**:
   - Face Coverage $= 64.9\%$ ($\to$ `isFaceDataInsufficient = true`, neutral body score 12) vs $65.0\%$ (Normal evaluation enabled)
   - Eye Contact Ratio $= 39.9\%$ ($\to$ scaled linearly) vs $40.0\%$ (14 pts)
   - Eye Contact Ratio $= 59.9\%$ (18 pts) vs $60.0\%$ (20 pts)
   - Eye Contact Ratio $= 74.9\%$ (23 pts) vs $75.0\%$ (Full 25 pts)
3. **Filler Word Frequency Boundaries**:
   - $0.99 \text{ fillers/min}$ (15 pts) vs $1.00 \text{ fillers/min}$ (15 pts) vs $1.01 \text{ fillers/min}$ (12 pts)
   - $2.50 \text{ fillers/min}$ (12 pts) vs $2.51 \text{ fillers/min}$ (8 pts)
   - $4.50 \text{ fillers/min}$ (8 pts) vs $4.51 \text{ fillers/min}$ (penalized $\le 6$ pts)
4. **Input Size & String Length Boundaries**:
   - Outline length $= 5,000 \text{ characters}$ (Accepted) vs $5,001 \text{ characters}$ (Rejected / truncated)
   - Password length $= 7 \text{ characters}$ (Rejected: OWASP ASVS) vs $8 \text{ characters}$ (Accepted)
   - Duration $= 0 \text{ seconds}$ (Clamped safely to $0.1 \text{ min}$, no division by zero)
5. **Reaction Latency Boundaries**:
   - Reaction time $= 2.9\text{s}$ vs $3.0\text{s}$ ($\le 3.0\text{s} \to 5$ pts)
   - Reaction time $= 4.5\text{s}$ (4 pts) vs $4.6\text{s}$ (3 pts)
   - Reaction time $= 7.0\text{s}$ (3 pts) vs $7.1\text{s}$ (1 pt)
6. **Rate Limiting & Anti-Abuse Boundaries**:
   - Request 25 within 60s (Allowed: 200 OK) vs Request 26 within 60s (Blocked: 429 Too Many Requests)
7. **MIME Verification Magic Numbers**:
   - Valid PDF header `%PDF-` vs corrupted `!PDF-`
   - Valid DOCX header `PK\x03\x04` vs spoofed extension `image.png.docx`

### 4.3 Tier 3: Cross-Feature Pairwise Combinations
Tier 3 explores multi-dimensional interaction matrices:
1. **Scenario $\times$ Difficulty Combinations ($4 \times 4 = 16$ pairs)**:
   - Scenarios: `khkt_defense`, `class_lecture`, `english_debate`, `admission_interview`
   - Difficulties: `gentle`, `balanced`, `rigorous`, `adversarial`
   - Verifies appropriate judge tone, timer constraints (30s vs 45s), and rubric weighting.
2. **Telemetry Quality $\times$ Network Resilience Combinations**:
   - Optimal Telemetry + Online Cloud Gemini
   - Degraded Video ($<65\%$ face coverage) + Online Gemini $\to$ Flagged Insufficient Data on Body, AI Content evaluated.
   - Optimal Telemetry + Offline Network (Gemini 503 / no key) $\to$ Full sensor tracking + Deterministic heuristic judge questions.
   - Occluded Video + Offline Network $\to$ Both fallback modes active concurrently without application crash.
3. **Identity $\times$ Access Control Matrix**:
   - Authenticated User A accessing Resource A $\to$ 200 OK
   - Authenticated User B attempting to access Resource A $\to$ 403 Forbidden (Anti-IDOR)
   - Unauthenticated guest accessing public features $\to$ 200 OK
   - Unauthenticated guest accessing private reports $\to$ Redirect / 401 Unauthorized.
4. **Security $\times$ Sanitization Multi-Vector Attacks**:
   - Payload containing concurrent NoSQL operator (`$ne`) + XSS `<script>` + Prompt Injection (`DAN mode`) $\to$ All 3 vectors neutralized simultaneously.

### 4.4 Tier 4: Real-World Multi-Step E2E User Scenarios
Tier 4 executes comprehensive, multi-step user workflows simulating actual student sessions:
1. **Workflow 1: Gameshow "Đấu trường AI" Đồng Nai 2026 — THPT Tôn Đức Thắng KHKT Defense**:
   - Account registration $\to$ KHKT session setup $\to$ 3-minute speech rehearsal $\to$ Optimal sensor telemetry (WPM 132, Eye Contact 82%, Posture 4°, 1 filler) $\to$ Adversarial judge questioning by Thầy Vũ Xuân Định $\to$ 2.4s student defense response $\to$ 100-pt MPRE calculation $\to$ High score ($\ge 90/100$, "Xuất sắc" tier) $\to$ Zero biometric persistence verified.
2. **Workflow 2: High School English Debate with Extreme Anxiety & Facial Occlusion**:
   - Session setup for `english_debate` with `adversarial` difficulty $\to$ Student speaks fast (168 WPM), pauses awkwardly, uses 14 filler words $\to$ Webcam partially covered ($<40\%$ face coverage) $\to$ System detects Insufficient Data on Body Language without assigning fake 0 or 100 score $\to$ Generates targeted micro-drills for eye contact recovery and 4-7-8 breathing pauses $\to$ Compliant diagnostic report delivered.
3. **Workflow 3: University Admissions Interview under Network Disconnect**:
   - Gemini API unavailable (no API key / 503) and MongoDB Atlas disconnected $\to$ User launches `admission_interview` $\to$ Ephemeral in-memory fallback engages $\to$ Heuristic rule-based question generator produces interview questions $\to$ Student answers $\to$ Rule-based evaluation computes score $\to$ Report cached in memory with local mode flag $\to$ Complete workflow succeeds with zero uncaught exceptions.
4. **Workflow 4: Adversarial Red Team Security & Penetration Audit**:
   - Weak password rejection ($<8$ chars) $\to$ NoSQL injection stripping in session creation $\to$ Prompt injection defense neutralizing LLM override attempts $\to$ Anti-IDOR ownership verification blocking cross-user report scraping (403) $\to$ Rate limiter blocking flood attack (429) $\to$ Verification of Zero-Data Retention guarantee (zero media files on disk).

---

## 5. Pass/Fail Quality Gates & Verification Standards

| Gate | Metric | Requirement |
|---|---|---|
| **Gate 1** | Tier 1 Feature Coverage | 100% Pass ($\ge 5$ tests per core feature) |
| **Gate 2** | Tier 2 Boundary Conditions | 100% Pass (All boundary limits verified) |
| **Gate 3** | Tier 3 Pairwise Combinations | 100% Pass (All interaction pairs verified) |
| **Gate 4** | Tier 4 Real-World Workflows | 100% Pass (All multi-step journeys complete cleanly) |
| **Gate 5** | Execution Performance | Full test suite execution $< 3.0 \text{ seconds}$ |
| **Gate 6** | Zero-Data Retention Compliance | 0 audio/video files written to disk during tests |

---

## 6. Maintenance & Extensibility

- All new features added to SpeakLife AI must introduce corresponding test cases across Tiers 1-4.
- Any change to the MPRE scoring formulas must update the boundary test suites in Tier 2.
- Test suites must remain independent of external internet connectivity; all third-party AI or database dependencies must supply deterministic, pedagogical mocks and fallbacks.
