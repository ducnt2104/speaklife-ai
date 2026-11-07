// SpeakLife AI — Unit Tests for Multimodal Presentation Reflex Engine (MPRE)
const test = require("node:test");
const assert = require("node:assert");

// Pure JS reproduction of MPRE scoring algorithm for direct test execution
function calculateMPREScore(metrics) {
  const durationMinutes = Math.max(0.1, metrics.durationSeconds / 60);
  const faceCoverageRatio = metrics.totalAnalyzedFrames > 0 
    ? metrics.faceDetectedFrames / metrics.totalAnalyzedFrames 
    : 0;
  const isFaceDataInsufficient = faceCoverageRatio < 0.65;

  let bodyScore = 0;
  let eyeRatio = 0;
  if (isFaceDataInsufficient) {
    bodyScore = 12;
  } else {
    eyeRatio = metrics.eyeContactFrames / Math.max(1, metrics.faceDetectedFrames);
    if (eyeRatio >= 0.75) bodyScore = 25;
    else if (eyeRatio >= 0.60) bodyScore = 20 + ((eyeRatio - 0.60) / 0.15) * 4;
    else if (eyeRatio >= 0.40) bodyScore = 14 + ((eyeRatio - 0.40) / 0.20) * 5;
    else bodyScore = Math.max(5, (eyeRatio / 0.40) * 13);

    if (metrics.shoulderTiltVariance > 12) {
      bodyScore = Math.max(0, bodyScore - 3);
    }
  }

  const wpm = Math.round(metrics.totalWords / durationMinutes);
  let voiceScore = 0;
  if (wpm >= 120 && wpm <= 145) voiceScore = 20;
  else if ((wpm >= 110 && wpm < 120) || (wpm > 145 && wpm <= 160)) voiceScore = 16;
  else if (wpm >= 90 && wpm < 110) voiceScore = 12;
  else if (wpm > 160) voiceScore = 10;
  else voiceScore = 6;

  const fillerRate = metrics.fillerWordCount / durationMinutes;
  let fillerScore = 0;
  if (fillerRate < 1.0) fillerScore = 15;
  else if (fillerRate <= 2.5) fillerScore = 12;
  else if (fillerRate <= 4.5) fillerScore = 8;
  else fillerScore = Math.max(2, 6 - Math.round(fillerRate - 4.5));

  const contentScore = metrics.aiContentScore !== undefined ? Math.min(20, Math.max(0, metrics.aiContentScore)) : 15;

  let reflexScore = 0;
  if (metrics.rebuttalRounds && metrics.rebuttalRounds.length > 0) {
    const totalLatency = metrics.rebuttalRounds.reduce((acc, r) => acc + r.reactionTimeSeconds, 0);
    const avgLatency = totalLatency / metrics.rebuttalRounds.length;
    let latencyPoints = 5;
    if (avgLatency > 7) latencyPoints = 1;
    else if (avgLatency > 4.5) latencyPoints = 3;
    else if (avgLatency > 3) latencyPoints = 4;

    const totalContent = metrics.rebuttalRounds.reduce((acc, r) => acc + r.score, 0);
    const avgContent = totalContent / metrics.rebuttalRounds.length;
    reflexScore = Math.round(latencyPoints + avgContent);
  } else {
    reflexScore = 14;
  }

  const total = Math.round(bodyScore + voiceScore + fillerScore + contentScore + reflexScore);
  return { total, bodyScore: Math.round(bodyScore), voiceScore, fillerScore, contentScore, reflexScore, isFaceDataInsufficient, wpm };
}

test("MPRE Engine: High performance rehearsal scores in Xuất Sắc tier (>=85)", () => {
  const result = calculateMPREScore({
    durationSeconds: 180, // 3 mins
    totalWords: 390,      // 130 WPM (perfect)
    faceDetectedFrames: 5400,
    totalAnalyzedFrames: 5400,
    eyeContactFrames: 4320, // 80% (perfect)
    shoulderTiltVariance: 4,
    averageRmsDecibels: -18,
    pitchF0StdDev: 18,
    fillerWordCount: 2,   // 0.67/min (perfect)
    aiContentScore: 19,
    rebuttalRounds: [
      { reactionTimeSeconds: 2.4, score: 14 },
      { reactionTimeSeconds: 2.8, score: 14 }
    ]
  });

  assert.strictEqual(result.bodyScore, 25, "Body language score should be maximum 25");
  assert.strictEqual(result.voiceScore, 20, "Voice prosody score should be maximum 20");
  assert.strictEqual(result.fillerScore, 15, "Filler words score should be maximum 15");
  assert.strictEqual(result.contentScore, 19, "Content score should be 19");
  assert.ok(result.total >= 90, `Total score should be >= 90, received ${result.total}`);
  assert.strictEqual(result.isFaceDataInsufficient, false);
});

test("MPRE Engine: Flags Insufficient Data and avoids 0 score when face occluded", () => {
  const result = calculateMPREScore({
    durationSeconds: 180,
    totalWords: 390,
    faceDetectedFrames: 1000,
    totalAnalyzedFrames: 5400, // <20% face coverage
    eyeContactFrames: 500,
    shoulderTiltVariance: 0,
    averageRmsDecibels: -18,
    pitchF0StdDev: 15,
    fillerWordCount: 1,
    aiContentScore: 15
  });

  assert.strictEqual(result.isFaceDataInsufficient, true, "Should flag face data as insufficient");
  assert.strictEqual(result.bodyScore, 12, "Should assign neutral benchmark of 12 instead of 0");
});

test("MPRE Engine: Correctly penalizes excessive filler words", () => {
  const result = calculateMPREScore({
    durationSeconds: 120, // 2 mins
    totalWords: 260,
    faceDetectedFrames: 3600,
    totalAnalyzedFrames: 3600,
    eyeContactFrames: 2800,
    shoulderTiltVariance: 5,
    averageRmsDecibels: -18,
    pitchF0StdDev: 15,
    fillerWordCount: 16, // 8 fillers/min (very high)
    aiContentScore: 15
  });

  assert.ok(result.fillerScore <= 4, `Filler score should be penalized to <= 4, received ${result.fillerScore}`);
});
