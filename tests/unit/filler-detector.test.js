// SpeakLife AI — Unit Tests for Vietnamese & English Filler Detector
const test = require("node:test");
const assert = require("node:assert");

const VIETNAMESE_PATTERNS = [
  { word: "à", pattern: /(?:^|\s)(à|aaa+)(?:\s|[.,!?]|$)/iu },
  { word: "ừm", pattern: /(?:^|\s)(ừm|umm+|ờm)(?:\s|[.,!?]|$)/iu },
  { word: "kiểu như", pattern: /(?:^|\s)(kiểu\s+như|kiểu\s+là)(?:\s|[.,!?]|$)/iu },
  { word: "thì", pattern: /(?:^|\s)(thì\s+là|thì)(?:\s+thì)+(?:\s|[.,!?]|$)/iu }
];

function detectFillers(text, durationSeconds = 60) {
  const instances = [];
  const durationMinutes = Math.max(0.1, durationSeconds / 60);

  VIETNAMESE_PATTERNS.forEach((def) => {
    const regex = new RegExp(def.pattern.source, "giu");
    let match;
    while ((match = regex.exec(text)) !== null) {
      instances.push({
        word: def.word,
        matched: match[1] || match[0].trim(),
        index: match.index
      });
    }
  });

  return {
    total: instances.length,
    rate: Math.round((instances.length / durationMinutes) * 10) / 10,
    instances
  };
}

test("Filler Detector: Detects classic Vietnamese pauses ('à', 'ừm')", () => {
  const speech = "Kính thưa thầy cô, à nhóm chúng em ừm xin trình bày về dự án SpeakLife AI.";
  const result = detectFillers(speech, 60);
  assert.strictEqual(result.total, 2, `Should detect exactly 2 filler words, found ${result.total}`);
  assert.strictEqual(result.instances[0].word, "à");
  assert.strictEqual(result.instances[1].word, "ừm");
});

test("Filler Detector: Detects phrase crutch words ('kiểu như')", () => {
  const speech = "Giải pháp của chúng em kiểu như là một phòng luyện ảo 3D giúp học sinh.";
  const result = detectFillers(speech, 60);
  assert.ok(result.instances.some(i => i.word === "kiểu như"), "Should detect 'kiểu như'");
});

test("Filler Detector: Does not falsely flag legitimate Vietnamese words", () => {
  const speech = "Chúng ta cần nâng cao năng lực thuyết trình và phản biện trong nhà trường.";
  const result = detectFillers(speech, 60);
  assert.strictEqual(result.total, 0, "Legitimate speech without filler words should return 0");
});
