const { test, describe } = require("node:test");
const assert = require("node:assert");

function calculateRubricScore({ eyeContactRatio, averageWpm, fillersPerMin, questionAvgScore }) {
  // 1. Body Language (25 max)
  let bodyScore = 0;
  if (eyeContactRatio >= 0.70) bodyScore = 25;
  else if (eyeContactRatio >= 0.50) bodyScore = Math.round(18 + ((eyeContactRatio - 0.50) / 0.20) * 7);
  else bodyScore = Math.round(Math.max(8, eyeContactRatio * 36));

  // 2. Voice Prosody (20 max)
  let voiceScore = 0;
  if (averageWpm >= 120 && averageWpm <= 145) voiceScore = 20;
  else if (averageWpm >= 105 && averageWpm <= 160) voiceScore = 16;
  else voiceScore = 12;

  // 3. Filler Words (15 max)
  let fillerScore = 0;
  if (fillersPerMin <= 1.0) fillerScore = 15;
  else if (fillersPerMin <= 2.5) fillerScore = 11;
  else if (fillersPerMin <= 4.0) fillerScore = 8;
  else fillerScore = 4;

  // 4. Content Logic (20 max)
  const contentScore = 18;

  // 5. Critical QA (20 max)
  const qaScore = Math.round((questionAvgScore / 10) * 20);

  return {
    bodyScore,
    voiceScore,
    fillerScore,
    contentScore,
    qaScore,
    total: bodyScore + voiceScore + fillerScore + contentScore + qaScore,
  };
}

describe("MPRE 5-Axis Rubric Engine Tests", () => {
  test("Exemplary Presentation: Achieves high score (> 85/100)", () => {
    const result = calculateRubricScore({
      eyeContactRatio: 0.82,
      averageWpm: 135,
      fillersPerMin: 0.5,
      questionAvgScore: 8.8,
    });

    assert.strictEqual(result.bodyScore, 25);
    assert.strictEqual(result.voiceScore, 20);
    assert.strictEqual(result.fillerScore, 15);
    assert.ok(result.total >= 88);
  });

  test("Sub-optimal Eye Contact (< 50%): Penalized proportionally", () => {
    const result = calculateRubricScore({
      eyeContactRatio: 0.42,
      averageWpm: 130,
      fillersPerMin: 0.8,
      questionAvgScore: 7.5,
    });

    assert.ok(result.bodyScore < 18);
    assert.strictEqual(result.voiceScore, 20);
  });

  test("Excessive Filler Words (> 4.0/min): Drops filler component score", () => {
    const result = calculateRubricScore({
      eyeContactRatio: 0.75,
      averageWpm: 125,
      fillersPerMin: 5.2,
      questionAvgScore: 8.0,
    });

    assert.strictEqual(result.fillerScore, 4);
    assert.ok(result.total < 85);
  });
});
