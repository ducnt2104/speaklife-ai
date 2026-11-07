const { test, describe } = require("node:test");
const assert = require("node:assert");

const VIETNAMESE_PATTERNS = [
  /(?:^|\s)(à|aaa+)(?:\s|[.,!?]|$)/iu,
  /(?:^|\s)(ừm|umm+|ờm)(?:\s|[.,!?]|$)/iu,
  /(?:^|\s)(kiểu\s+như|kiểu\s+là)(?:\s|[.,!?]|$)/iu,
  /(?:^|\s)(thực\s+sự\s+thì)(?:\s|[.,!?]|$)/iu,
];

function extractFillerWords(transcript) {
  const detected = [];
  for (const regex of VIETNAMESE_PATTERNS) {
    const match = transcript.match(regex);
    if (match) {
      detected.push(match[1].toLowerCase());
    }
  }
  return detected;
}

describe("Vietnamese Filler Word Detection Engine", () => {
  test("Detects common monosyllabic hesitation fillers (à, ừm, ờ)", () => {
    const text = "Dự án của chúng em à có mục tiêu là giúp ừm học sinh tự tin.";
    const detected = extractFillerWords(text);
    assert.ok(detected.includes("à"));
    assert.ok(detected.includes("ừm"));
  });

  test("Detects compound hesitation fillers (kiểu như, thực sự thì)", () => {
    const text = "Chúng em thấy kiểu như việc luyện tập trước gương thực sự thì không hiệu quả.";
    const detected = extractFillerWords(text);
    assert.ok(detected.includes("kiểu như"));
    assert.ok(detected.includes("thực sự thì"));
  });

  test("Clean speech without filler words returns empty list", () => {
    const text = "Kính thưa Ban Giám Khảo, hôm nay nhóm SpeakLife AI xin báo cáo kết quả thực nghiệm.";
    const detected = extractFillerWords(text);
    assert.strictEqual(detected.length, 0);
  });
});
