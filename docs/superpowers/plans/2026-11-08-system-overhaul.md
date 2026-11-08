# Master Overhaul: AI Core, Camera, Microphone & Stadium Realism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform SpeakLife AI into a fully functional, production-ready system with real Gemini AI connectivity & diagnostics, hardware-verified Camera & Microphone with real-time Speech-to-Text (WPM, filler detection) & Gaze tracking, an immersive 3D stadium amphitheater with animated crowd and audio ambiance, and OWASP-level security.

**Architecture:** 
- AI Core: Modular Provider Adapter (`GeminiGateway`) supporting DB-persisted configuration, key validation, connection test endpoint (`/api/ai/test-connection`), and real API error mapping.
- Vision & Camera Engine: Resilient device access with `enumerateDevices()`, multi-stream fallback, and real-time canvas-based facial centroid & iris displacement gaze tracking.
- Audio & Speech Engine: Web Audio API frequency/dB analysis combined with Web Speech API (`SpeechRecognition`) for live Vietnamese transcription, dynamic WPM calculation, real-time filler detection, and Web Speech TTS for audible judge questioning.
- 3D Stadium: Three.js amphitheater with tiered stadium seating, realistic spectator geometry, dynamic lighting/shadows, animated LED competition ribbon banner, and Web Audio API synthesized crowd acoustics.

**Tech Stack:** Next.js 14, React 18, TypeScript, Three.js 0.169, Web Audio API, Web Speech API, Better-SQLite3, Tailwind CSS, Google Gemini 2.0 Flash.

**Spec:** MASTER PROMPT — ĐẠI TU SỬA CHỮA VÀ NÂNG CẤP TOÀN DIỆN DỰ ÁN.

## Global Constraints
- Zero fake/demo data or hardcoded mock responses in production paths.
- All secrets masked in UI and never committed to Git or leaked in bundles.
- WebAssembly and client-side processing for Zero-Data video privacy compliance.
- Support both authenticated users (DB persistence) and guest users (session storage).
- Maintain 60 FPS performance budget for 3D stadium and vision tracking.

## Review Focus
1. Camera or Microphone permission denied by browser $\to$ Graceful edge-state UI with instruction on how to grant permissions without crashing.
2. Invalid or quota-exhausted Gemini API Key $\to$ Clear error categorization (`INVALID_KEY`, `QUOTA_EXCEEDED`) instead of silent fallback.
3. Browser without Web Speech API (e.g. Firefox) $\to$ Graceful fallback to volume-based speech cadence estimation with clear indicator.
4. Low-end GPU / Classroom PC $\to$ Automatic fallback from 3D WebGL to 2D lightweight canvas without breaking rehearsal flow.
5. Rapid start/stop of media streams $\to$ Proper track stopping and AudioContext cleanup preventing memory leaks.

---

### Task 1: AI Core Infrastructure, Settings & Verification Suite

**Files:**
- Modify: `src/lib/ai/gemini-gateway.ts`
- Create: `src/app/api/ai/config/route.ts`
- Create: `src/app/api/ai/test-connection/route.ts`
- Modify: `src/app/settings/page.tsx`
- Test: `tests/ai-core.test.js`

**Interfaces:**
- Consumes: Google Gemini API `v1beta/models/gemini-2.0-flash:generateContent`
- Produces: `/api/ai/test-connection` $\to$ `{ status: "CONNECTED" | "INVALID_KEY" | "QUOTA_EXCEEDED" | "NETWORK_ERROR", latencyMs: number, model: string }`

- [ ] **Step 1: Write test for AI Core test-connection & config**
- [ ] **Step 2: Implement `/api/ai/config` and `/api/ai/test-connection`**
- [ ] **Step 3: Update `GeminiGateway` to read API key from DB `ai_config` with env fallback**
- [ ] **Step 4: Build AI Configuration & Real Connection Test UI in `src/app/settings/page.tsx`**
- [ ] **Step 5: Verify AI connectivity with real test ping**

---

### Task 2: Camera Hardware Management & Real-Time Gaze Tracking

**Files:**
- Modify: `src/components/rehearsal/CameraHUD.tsx`
- Modify: `src/lib/vision/gaze-tracker.ts`
- Create: `src/lib/vision/face-detector.ts`
- Test: `tests/vision-gaze.test.js`

**Interfaces:**
- Consumes: `navigator.mediaDevices.getUserMedia`, `navigator.mediaDevices.enumerateDevices`
- Produces: `onMetricsUpdate({ eyeContactRatio, dbLevel, isGazeCentered, postureStable })`

- [ ] **Step 1: Write test for gaze math and frame evaluation**
- [ ] **Step 2: Build `face-detector.ts` with Canvas CV & FaceDetector API**
- [ ] **Step 3: Refactor `CameraHUD.tsx` with device selector, separate video/audio permissions, mirror toggle, and frame-by-frame gaze analysis loop**
- [ ] **Step 4: Verify camera feed, green center ring pulse, and gaze calculation**

---

### Task 3: Microphone Engine, Speech-to-Text & Audible AI Judge

**Files:**
- Create: `src/lib/audio/speech-recognizer.ts`
- Create: `src/lib/audio/speech-synthesizer.ts`
- Modify: `src/components/rehearsal/CameraHUD.tsx`
- Modify: `src/components/evaluation/AIJudgePanel.tsx`
- Modify: `src/app/rehearse/page.tsx`
- Test: `tests/speech-audio.test.js`

**Interfaces:**
- Consumes: Web Speech API `SpeechRecognition`, `speechSynthesis`, Web Audio API `AudioContext`
- Produces: Live transcript, real-time WPM, live filler detection count, spoken judge questions

- [ ] **Step 1: Write unit tests for speech transcript tokenization, WPM calculation, and filler integration**
- [ ] **Step 2: Implement `speech-recognizer.ts` (Vietnamese & English STT)**
- [ ] **Step 3: Implement `speech-synthesizer.ts` (Vietnamese TTS for AI Judges)**
- [ ] **Step 4: Connect live transcription to `RehearsePage` for real WPM and live filler word count**
- [ ] **Step 5: Add Speech-to-Text mic button to `AIJudgePanel.tsx` and enable audible question speak**

---

### Task 4: High-Realism 3D Stadium & Crowd Acoustics

**Files:**
- Modify: `src/components/3d/VirtualAuditorium.tsx`
- Create: `src/lib/audio/crowd-audio.ts`
- Test: `tests/stadium-render.test.js`

**Interfaces:**
- Consumes: Three.js `WebGLRenderer`, Web Audio API `AudioContext`
- Produces: 3D tiered amphitheater, procedural spectator crowd, dynamic arena lighting, LED ribbon banner, synthesized crowd acoustics (`applause`, `murmur`, `cheer`)

- [ ] **Step 1: Write test for stadium geometric construction and reaction transitions**
- [ ] **Step 2: Implement `crowd-audio.ts` (Web Audio procedural synthesis of applause, cheers, and murmurs)**
- [ ] **Step 3: Build realistic 3D amphitheater in `VirtualAuditorium.tsx` (tiered seats, handrails, aisles, judge desk, overhead trusses, stage lights, animated LED ribbon)**
- [ ] **Step 4: Implement enhanced audience animation (cheering, wave, attentive nods, distracted head turns)**
- [ ] **Step 5: Add audio control toggle (Mute/Unmute stadium atmosphere) and graphic quality presets**

---

### Task 5: UI/UX Harmonization & Settings Integration

**Files:**
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/rehearse/page.tsx`
- Modify: `src/components/ui/Navbar.tsx`

- [ ] **Step 1: Add Camera, Microphone, and Stadium Graphics Settings tabs to `SettingsPage`**
- [ ] **Step 2: Harmonize dark/light theme consistency across CameraHUD, AIJudgePanel, and VirtualAuditorium**
- [ ] **Step 3: Verify all tooltips, empty states, and error alerts**

---

### Task 6: Full Regression Testing & System Verification

**Files:**
- Create: `tests/full-system-e2e.test.js`
- Create: `SYSTEM_UPGRADE_REPORT.md`

- [ ] **Step 1: Run complete test suite covering all modules**
- [ ] **Step 2: Run production build (`npm run build`) and verify 0 errors**
- [ ] **Step 3: Commit and push all enhancements to GitHub**
- [ ] **Step 4: Generate comprehensive `SYSTEM_UPGRADE_REPORT.md`**
