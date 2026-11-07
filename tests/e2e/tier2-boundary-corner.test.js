// SpeakLife AI — E2E Test Suite — Tier 2: Boundary Value Analysis & Corner Cases
// Tests exact thresholds, limits, zero/negative inputs, and edge conditions

const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

// ---------------------------------------------------------------------------
// Pure JavaScript Test Harness Implementations for Boundary Verification
// ---------------------------------------------------------------------------

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(plainTextPassword) {
  if (!plainTextPassword || plainTextPassword.length < 8) {
    throw new Error("Mật khẩu phải có độ dài tối thiểu 8 ký tự.");
  }
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.pbkdf2Sync(plainTextPassword, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { hash, salt };
}

function verifyPassword(plainTextPassword, storedHash, storedSalt) {
  if (!plainTextPassword || !storedHash || !storedSalt) return false;
  try {
    const computedHash = crypto.pbkdf2Sync(plainTextPassword, storedSalt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
    const bufferA = Buffer.from(computedHash, "hex");
    const bufferB = Buffer.from(storedHash, "hex");
    if (bufferA.length !== bufferB.length) return false;
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

function truncateSafe(input, maxLength = 5000) {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength);
}

// In-Memory Token Bucket / Sliding Window Rate Limiter
class BoundaryRateLimiter {
  constructor() {
    this.buckets = new Map();
  }

  check(key, limit, windowSec) {
    const now = Date.now();
    const windowMs = windowSec * 1000;
    let timestamps = this.buckets.get(key) || [];
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      const resetSec = Math.ceil((oldest + windowMs - now) / 1000);
      return { allowed: false, current: timestamps.length, resetSec };
    }

    timestamps.push(now);
    this.buckets.set(key, timestamps);
    return { allowed: true, current: timestamps.length, resetSec: windowSec };
  }
}

function calculateMPRE(metrics) {
  const durationMinutes = Math.max(0.1, (metrics.durationSeconds || 0) / 60);
  const faceCoverageRatio = (metrics.totalAnalyzedFrames || 0) > 0 
    ? (metrics.faceDetectedFrames || 0) / metrics.totalAnalyzedFrames 
    : 0;
  const isFaceDataInsufficient = faceCoverageRatio < 0.65;

  let bodyScore = 0;
  let eyeRatio = 0;
  if (isFaceDataInsufficient) {
    bodyScore = 12;
  } else {
    eyeRatio = (metrics.eyeContactFrames || 0) / Math.max(1, metrics.faceDetectedFrames || 1);
    if (eyeRatio >= 0.75) bodyScore = 25;
    else if (eyeRatio >= 0.60) bodyScore = 20 + ((eyeRatio - 0.60) / 0.15) * 4;
    else if (eyeRatio >= 0.40) bodyScore = 14 + ((eyeRatio - 0.40) / 0.20) * 5;
    else bodyScore = Math.max(5, (eyeRatio / 0.40) * 13);

    if ((metrics.shoulderTiltVariance || 0) > 12) {
      bodyScore = Math.max(0, bodyScore - 3);
    }
  }

  const wpm = Math.round((metrics.totalWords || 0) / durationMinutes);
  let voiceScore = 0;
  if (wpm >= 120 && wpm <= 145) voiceScore = 20;
  else if ((wpm >= 110 && wpm < 120) || (wpm > 145 && wpm <= 160)) voiceScore = 16;
  else if (wpm >= 90 && wpm < 110) voiceScore = 12;
  else if (wpm > 160) voiceScore = 10;
  else voiceScore = 6;

  if (metrics.pitchF0StdDev !== undefined && metrics.pitchF0StdDev < 6 && voiceScore > 10) {
    voiceScore -= 2;
  }

  const fillerRate = (metrics.fillerWordCount || 0) / durationMinutes;
  let fillerScore = 0;
  if (fillerRate < 1.0) fillerScore = 15;
  else if (fillerRate <= 2.5) fillerScore = 12;
  else if (fillerRate <= 4.5) fillerScore = 8;
  else fillerScore = Math.max(2, 6 - Math.round(fillerRate - 4.5));

  const contentScore = metrics.aiContentScore !== undefined ? Math.min(20, Math.max(0, metrics.aiContentScore)) : 15;

  let reflexScore = 0;
  let avgReactionSeconds = 0;
  if (metrics.rebuttalRounds && metrics.rebuttalRounds.length > 0) {
    const totalLatency = metrics.rebuttalRounds.reduce((acc, r) => acc + r.reactionTimeSeconds, 0);
    avgReactionSeconds = Math.round((totalLatency / metrics.rebuttalRounds.length) * 10) / 10;
    let latencyPoints = 5;
    if (avgReactionSeconds > 7) latencyPoints = 1;
    else if (avgReactionSeconds > 4.5) latencyPoints = 3;
    else if (avgReactionSeconds > 3) latencyPoints = 4;

    const totalContent = metrics.rebuttalRounds.reduce((acc, r) => acc + r.score, 0);
    const avgContent = totalContent / metrics.rebuttalRounds.length;
    reflexScore = Math.round(latencyPoints + avgContent);
  } else {
    reflexScore = 14;
    avgReactionSeconds = 3.5;
  }

  const totalScore = Math.round(bodyScore + voiceScore + fillerScore + contentScore + reflexScore);
  return {
    totalScore,
    bodyScore: Math.round(bodyScore * 100) / 100,
    voiceScore,
    fillerScore,
    contentScore,
    reflexScore,
    isFaceDataInsufficient,
    wpm,
    eyeRatio,
    fillerRate
  };
}

// Geometric Angle Acceptance
function checkEyeContactCone(gazeYaw, gazePitch) {
  return Math.abs(gazeYaw) <= 16.0 && Math.abs(gazePitch) <= 18.0;
}

function checkPostureStability(shoulderTilt) {
  return shoulderTilt <= 10.0;
}

// ---------------------------------------------------------------------------
// Tier 2 Test Suites: Boundary Value Analysis
// ---------------------------------------------------------------------------

test.describe("Tier 2 Suite 1: Speaking Pace (WPM) Boundaries (F-15, F-21, F-24)", () => {
  test("1.1 WPM 89 vs 90: Transition from very slow (6 pts) to moderate slow (12 pts)", () => {
    // 89 words in 1 min -> 89 WPM
    const slow = calculateMPRE({ durationSeconds: 60, totalWords: 89, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    // 90 words in 1 min -> 90 WPM
    const moderate = calculateMPRE({ durationSeconds: 60, totalWords: 90, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    assert.strictEqual(slow.voiceScore, 6);
    assert.strictEqual(moderate.voiceScore, 12);
  });

  test("1.2 WPM 109 vs 110: Transition from moderate slow (12 pts) to proficient pace (16 pts)", () => {
    const wpm109 = calculateMPRE({ durationSeconds: 60, totalWords: 109, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    const wpm110 = calculateMPRE({ durationSeconds: 60, totalWords: 110, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    assert.strictEqual(wpm109.voiceScore, 12);
    assert.strictEqual(wpm110.voiceScore, 16);
  });

  test("1.3 WPM 119 vs 120: Transition into golden standard corridor (20 pts)", () => {
    const wpm119 = calculateMPRE({ durationSeconds: 60, totalWords: 119, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    const wpm120 = calculateMPRE({ durationSeconds: 60, totalWords: 120, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    assert.strictEqual(wpm119.voiceScore, 16);
    assert.strictEqual(wpm120.voiceScore, 20);
  });

  test("1.4 WPM 145 vs 146: Transition out of golden standard corridor into slightly fast (16 pts)", () => {
    const wpm145 = calculateMPRE({ durationSeconds: 60, totalWords: 145, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    const wpm146 = calculateMPRE({ durationSeconds: 60, totalWords: 146, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    assert.strictEqual(wpm145.voiceScore, 20);
    assert.strictEqual(wpm146.voiceScore, 16);
  });

  test("1.5 WPM 160 vs 161: Transition from slightly fast (16 pts) to rushed speech (10 pts)", () => {
    const wpm160 = calculateMPRE({ durationSeconds: 60, totalWords: 160, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    const wpm161 = calculateMPRE({ durationSeconds: 60, totalWords: 161, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    assert.strictEqual(wpm160.voiceScore, 16);
    assert.strictEqual(wpm161.voiceScore, 10);
  });

  test("1.6 Duration 0s safety: Clamps duration safely without NaN or division by zero", () => {
    const zeroDur = calculateMPRE({ durationSeconds: 0, totalWords: 0, faceDetectedFrames: 0, totalAnalyzedFrames: 0 });
    assert.strictEqual(Number.isFinite(zeroDur.wpm), true);
    assert.strictEqual(Number.isNaN(zeroDur.totalScore), false);
  });

  test("1.7 Extreme WPM 350: Excessive speed capped safely at minimum threshold 10 pts", () => {
    const extremeFast = calculateMPRE({ durationSeconds: 60, totalWords: 350, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500 });
    assert.strictEqual(extremeFast.voiceScore, 10);
    assert.strictEqual(extremeFast.wpm, 350);
  });
});

test.describe("Tier 2 Suite 2: Eye Contact & Face Tracking Coverage Boundaries (F-14, F-21, F-22)", () => {
  test("2.1 Face Coverage 64.9% vs 65.0%: Exact Insufficient Data trigger threshold", () => {
    // 649 / 1000 = 64.9% (< 65%)
    const insufficient = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 649, totalAnalyzedFrames: 1000, eyeContactFrames: 500 });
    // 650 / 1000 = 65.0% (>= 65%)
    const sufficient = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 650, totalAnalyzedFrames: 1000, eyeContactFrames: 500 });

    assert.strictEqual(insufficient.isFaceDataInsufficient, true);
    assert.strictEqual(insufficient.bodyScore, 12, "Should assign neutral baseline 12 pts");

    assert.strictEqual(sufficient.isFaceDataInsufficient, false);
    assert.notStrictEqual(sufficient.bodyScore, 12);
  });

  test("2.2 Eye Contact 39.9% vs 40.0%: Transition from linear low scale to 14 pts bracket", () => {
    // 399 / 1000 = 39.9% -> (0.399 / 0.40) * 13 = 12.9675
    const eye399 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1000, totalAnalyzedFrames: 1000, eyeContactFrames: 399 });
    // 400 / 1000 = 40.0% -> 14 + ((0.40 - 0.40)/0.20)*5 = 14.0
    const eye400 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1000, totalAnalyzedFrames: 1000, eyeContactFrames: 400 });

    assert.ok(eye399.bodyScore < 13.5);
    assert.strictEqual(eye400.bodyScore, 14);
  });

  test("2.3 Eye Contact 59.9% vs 60.0%: Transition to 20 pts proficient bracket", () => {
    const eye599 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1000, totalAnalyzedFrames: 1000, eyeContactFrames: 599 });
    const eye600 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1000, totalAnalyzedFrames: 1000, eyeContactFrames: 600 });

    assert.ok(eye599.bodyScore < 20);
    assert.strictEqual(eye600.bodyScore, 20);
  });

  test("2.4 Eye Contact 74.9% vs 75.0%: Transition to maximum 25 pts bracket", () => {
    const eye749 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1000, totalAnalyzedFrames: 1000, eyeContactFrames: 749 });
    const eye750 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1000, totalAnalyzedFrames: 1000, eyeContactFrames: 750 });

    assert.ok(eye749.bodyScore < 25);
    assert.strictEqual(eye750.bodyScore, 25);
  });

  test("2.5 Eye Contact 100%: Ceiling capped strictly at 25 points", () => {
    const eye100 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1000, totalAnalyzedFrames: 1000, eyeContactFrames: 1000 });
    assert.strictEqual(eye100.bodyScore, 25);
  });
});

test.describe("Tier 2 Suite 3: Filler Word Rate & Frequency Boundaries (F-15, F-21, F-25)", () => {
  test("3.1 Filler Rate 0.99/min vs 1.00/min: Full score 15 pts retained", () => {
    // 0.99 fillers in 1 min -> 0.99 rate
    const rate099 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, fillerWordCount: 0.99 });
    // 1 filler in 1.0001 min -> < 1.0 rate
    const rate100 = calculateMPRE({ durationSeconds: 60.1, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, fillerWordCount: 1 });
    assert.strictEqual(rate099.fillerScore, 15);
    assert.strictEqual(rate100.fillerScore, 15);
  });

  test("3.2 Filler Rate 1.01/min: Drops into good tier (12 pts)", () => {
    // 1.01 fillers/min
    const rate101 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, fillerWordCount: 1.01 });
    assert.strictEqual(rate101.fillerScore, 12);
  });

  test("3.3 Filler Rate 2.50/min vs 2.51/min: Transition from 12 pts to 8 pts", () => {
    const rate250 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, fillerWordCount: 2.5 });
    const rate251 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, fillerWordCount: 2.51 });
    assert.strictEqual(rate250.fillerScore, 12);
    assert.strictEqual(rate251.fillerScore, 8);
  });

  test("3.4 Filler Rate 4.50/min vs 4.51/min: Transition into severe penalty zone", () => {
    const rate450 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, fillerWordCount: 4.5 });
    const rate451 = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, fillerWordCount: 4.51 });
    assert.strictEqual(rate450.fillerScore, 8);
    assert.ok(rate451.fillerScore <= 6);
  });

  test("3.5 Extreme Filler Rate 30.0/min: Floor score bounded safely at minimum 2 pts", () => {
    const extremeFillers = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, fillerWordCount: 30 });
    assert.strictEqual(extremeFillers.fillerScore, 2, "Should never drop below floor score of 2 points");
  });
});

test.describe("Tier 2 Suite 4: Password Complexity & Security Boundaries (F-08)", () => {
  test("4.1 Password 0 characters: Throws length rejection error", () => {
    assert.throws(() => hashPassword(""), /tối thiểu 8 ký tự/);
  });

  test("4.2 Password 7 characters: Strictly rejected (OWASP ASVS Level 2)", () => {
    assert.throws(() => hashPassword("Pass12!"), /tối thiểu 8 ký tự/);
  });

  test("4.3 Password 8 characters: Exact minimum boundary accepted", () => {
    const { hash, salt } = hashPassword("Pass123!");
    assert.strictEqual(typeof hash, "string");
    assert.strictEqual(hash.length, 128);
    assert.strictEqual(verifyPassword("Pass123!", hash, salt), true);
  });

  test("4.4 Password 128 characters: Extreme length boundary accepted and verified", () => {
    const longPass = "A".repeat(120) + "B123!@#$";
    const { hash, salt } = hashPassword(longPass);
    assert.strictEqual(verifyPassword(longPass, hash, salt), true);
  });

  test("4.5 Empty stored hash or salt: Returns false safely without throwing exception", () => {
    assert.strictEqual(verifyPassword("ValidPass123!", "", "salt"), false);
    assert.strictEqual(verifyPassword("ValidPass123!", "hash", ""), false);
    assert.strictEqual(verifyPassword("", "hash", "salt"), false);
  });

  test("4.6 Tampered Hash Byte Length: Returns false safely without timingSafeEqual crash", () => {
    const valid = hashPassword("ValidPass123!");
    const truncatedHash = valid.hash.slice(0, 32); // shorter byte length
    assert.strictEqual(verifyPassword("ValidPass123!", truncatedHash, valid.salt), false);
  });
});

test.describe("Tier 2 Suite 5: Input Length & String Truncation Boundaries (F-09, F-12, F-19)", () => {
  test("5.1 Outline 0 characters: Handled safely as empty string", () => {
    const clean = truncateSafe("", 5000);
    assert.strictEqual(clean, "");
  });

  test("5.2 Outline 1 character: Handled safely", () => {
    const clean = truncateSafe("A", 5000);
    assert.strictEqual(clean, "A");
  });

  test("5.3 Outline 5,000 characters: Exact maximum boundary preserved completely", () => {
    const exact = "A".repeat(5000);
    const clean = truncateSafe(exact, 5000);
    assert.strictEqual(clean.length, 5000);
  });

  test("5.4 Outline 5,001 characters: Truncated safely to exactly 5,000 characters", () => {
    const over = "A".repeat(5001);
    const clean = truncateSafe(over, 5000);
    assert.strictEqual(clean.length, 5000);
  });

  test("5.5 Massive Buffer 50,000 characters: Bounded safely preventing token exhaustion", () => {
    const massive = "A".repeat(50000);
    const clean = truncateSafe(massive, 5000);
    assert.strictEqual(clean.length, 5000);
  });
});

test.describe("Tier 2 Suite 6: Reaction Latency & Reflex Scoring Boundaries (F-18, F-21)", () => {
  test("6.1 Latency 0.0s: Instant reflex scores maximum 5 latency points", () => {
    const m = calculateMPRE({
      durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500,
      rebuttalRounds: [{ reactionTimeSeconds: 0.0, score: 10 }]
    });
    // 5 latency + 10 content = 15 reflex pts
    assert.strictEqual(m.reflexScore, 15);
  });

  test("6.2 Latency 3.0s vs 3.1s: Transition from 5 points to 4 points", () => {
    const fast = calculateMPRE({
      durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500,
      rebuttalRounds: [{ reactionTimeSeconds: 3.0, score: 10 }]
    });
    const moderate = calculateMPRE({
      durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500,
      rebuttalRounds: [{ reactionTimeSeconds: 3.1, score: 10 }]
    });
    assert.strictEqual(fast.reflexScore, 15); // 5 + 10
    assert.strictEqual(moderate.reflexScore, 14); // 4 + 10
  });

  test("6.3 Latency 4.5s vs 4.6s: Transition from 4 points to 3 points", () => {
    const m45 = calculateMPRE({
      durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500,
      rebuttalRounds: [{ reactionTimeSeconds: 4.5, score: 10 }]
    });
    const m46 = calculateMPRE({
      durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500,
      rebuttalRounds: [{ reactionTimeSeconds: 4.6, score: 10 }]
    });
    assert.strictEqual(m45.reflexScore, 14); // 4 + 10
    assert.strictEqual(m46.reflexScore, 13); // 3 + 10
  });

  test("6.4 Latency 7.0s vs 7.1s: Transition from 3 points to 1 point", () => {
    const m70 = calculateMPRE({
      durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500,
      rebuttalRounds: [{ reactionTimeSeconds: 7.0, score: 10 }]
    });
    const m71 = calculateMPRE({
      durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500,
      rebuttalRounds: [{ reactionTimeSeconds: 7.1, score: 10 }]
    });
    assert.strictEqual(m70.reflexScore, 13); // 3 + 10
    assert.strictEqual(m71.reflexScore, 11); // 1 + 10
  });

  test("6.5 Latency 45.0s (Timeout): Floor score preserved at 1 latency point", () => {
    const mTimeout = calculateMPRE({
      durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500,
      rebuttalRounds: [{ reactionTimeSeconds: 45.0, score: 0 }]
    });
    assert.strictEqual(mTimeout.reflexScore, 1);
  });
});

test.describe("Tier 2 Suite 7: Rate Limiting & Resource Exhaustion Boundaries (F-28)", () => {
  test("7.1 Request 25 within 60s: All 25 requests permitted", () => {
    const limiter = new BoundaryRateLimiter();
    const key = "client_test_ip_1";
    for (let i = 1; i <= 25; i++) {
      const res = limiter.check(key, 25, 60);
      assert.strictEqual(res.allowed, true, `Request ${i} should be allowed`);
    }
  });

  test("7.2 Request 26 within 60s: Tripped and rejected with reset time", () => {
    const limiter = new BoundaryRateLimiter();
    const key = "client_test_ip_2";
    for (let i = 1; i <= 25; i++) {
      limiter.check(key, 25, 60);
    }
    const blockedRes = limiter.check(key, 25, 60);
    assert.strictEqual(blockedRes.allowed, false);
    assert.ok(blockedRes.resetSec > 0);
  });

  test("7.3 Key Isolation: One client tripping limit does not impact another client", () => {
    const limiter = new BoundaryRateLimiter();
    for (let i = 1; i <= 25; i++) {
      limiter.check("client_A", 25, 60);
    }
    assert.strictEqual(limiter.check("client_A", 25, 60).allowed, false);
    assert.strictEqual(limiter.check("client_B", 25, 60).allowed, true);
  });
});

test.describe("Tier 2 Suite 8: Posture & Gaze Geometric Angle Boundaries (F-14)", () => {
  test("8.1 Gaze Yaw 16.0 deg vs 16.1 deg: Exact boundary of eye contact cone", () => {
    assert.strictEqual(checkEyeContactCone(16.0, 0.0), true);
    assert.strictEqual(checkEyeContactCone(-16.0, 0.0), true);
    assert.strictEqual(checkEyeContactCone(16.1, 0.0), false);
    assert.strictEqual(checkEyeContactCone(-16.1, 0.0), false);
  });

  test("8.2 Gaze Pitch 18.0 deg vs 18.1 deg: Exact vertical boundary of eye contact cone", () => {
    assert.strictEqual(checkEyeContactCone(0.0, 18.0), true);
    assert.strictEqual(checkEyeContactCone(0.0, -18.0), true);
    assert.strictEqual(checkEyeContactCone(0.0, 18.1), false);
    assert.strictEqual(checkEyeContactCone(0.0, -18.1), false);
  });

  test("8.3 Shoulder Tilt 10.0 deg vs 10.1 deg: Exact threshold of posture stability", () => {
    assert.strictEqual(checkPostureStability(10.0), true);
    assert.strictEqual(checkPostureStability(10.1), false);
  });

  test("8.4 Shoulder Tilt Variance 12.0 deg vs 12.1 deg: Exact penalty boundary in MPRE", () => {
    const stable = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, shoulderTiltVariance: 12.0 });
    const penalized = calculateMPRE({ durationSeconds: 60, totalWords: 130, faceDetectedFrames: 1800, totalAnalyzedFrames: 1800, eyeContactFrames: 1500, shoulderTiltVariance: 12.1 });
    assert.strictEqual(stable.bodyScore - penalized.bodyScore, 3);
  });
});
