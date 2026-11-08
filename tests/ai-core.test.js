/**
 * SpeakLife AI — AI Core Diagnostic Unit Tests
 */

const test = require("node:test");
const assert = require("node:assert");

test("AI Core Configuration & Status Categorization", async (t) => {
  await t.test("Status categorizes correctly based on HTTP responses", () => {
    function categorizeGeminiResponse(statusCode) {
      if (statusCode === 200) return "CONNECTED";
      if (statusCode === 400 || statusCode === 403) return "INVALID_KEY";
      if (statusCode === 429) return "QUOTA_EXCEEDED";
      if (statusCode === 404) return "MODEL_ERROR";
      return "REQUEST_FAILED";
    }

    assert.strictEqual(categorizeGeminiResponse(200), "CONNECTED");
    assert.strictEqual(categorizeGeminiResponse(400), "INVALID_KEY");
    assert.strictEqual(categorizeGeminiResponse(403), "INVALID_KEY");
    assert.strictEqual(categorizeGeminiResponse(429), "QUOTA_EXCEEDED");
    assert.strictEqual(categorizeGeminiResponse(404), "MODEL_ERROR");
    assert.strictEqual(categorizeGeminiResponse(500), "REQUEST_FAILED");
  });

  await t.test("API Key Masking function masks secrets securely", () => {
    function maskApiKey(key) {
      if (!key) return "";
      if (key.length <= 8) return "••••••••";
      return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
    }

    const testKey = "AIzaSyFakeDiagnosticTestKeyForUnitVerification9999";
    const masked = maskApiKey(testKey);
    assert.ok(masked.startsWith("AIza"));
    assert.ok(masked.endsWith("9999"));
    assert.ok(!masked.includes("Diagnostic"));
  });
});
