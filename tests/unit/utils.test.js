// SpeakLife AI — Unit Tests for Utility Functions (cn, formatTime, formatPercentage, clamp)
const test = require("node:test");
const assert = require("node:assert");
const { clsx } = require("clsx");
const { twMerge } = require("tailwind-merge");

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatPercentage(val) {
  if (!Number.isFinite(val) || val < 0) {
    return "0%";
  }
  return `${Math.round(val * 100)}%`;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

test("utils.cn: merges Tailwind utility classes without conflicts", () => {
  assert.strictEqual(cn("px-2 py-1", "bg-red-500"), "px-2 py-1 bg-red-500");
  assert.strictEqual(cn("px-2", "px-4"), "px-4"); // twMerge precedence
  assert.strictEqual(cn("text-sm", false && "text-lg", undefined, null), "text-sm");
  assert.strictEqual(cn("p-4", { "bg-blue-500": true, "hidden": false }), "p-4 bg-blue-500");
});

test("utils.formatTime: formats seconds to standard MM:SS string", () => {
  assert.strictEqual(formatTime(0), "00:00");
  assert.strictEqual(formatTime(9), "00:09");
  assert.strictEqual(formatTime(65), "01:05");
  assert.strictEqual(formatTime(3600), "60:00");
  assert.strictEqual(formatTime(125.7), "02:05");
});

test("utils.formatTime: handles defensive edge cases (NaN, negative, non-finite)", () => {
  assert.strictEqual(formatTime(-10), "00:00");
  assert.strictEqual(formatTime(NaN), "00:00");
  assert.strictEqual(formatTime(Infinity), "00:00");
  assert.strictEqual(formatTime(-Infinity), "00:00");
  assert.strictEqual(formatTime(null), "00:00");
  assert.strictEqual(formatTime(undefined), "00:00");
});

test("utils.formatPercentage: converts decimal to percentage string", () => {
  assert.strictEqual(formatPercentage(0.784), "78%");
  assert.strictEqual(formatPercentage(1), "100%");
  assert.strictEqual(formatPercentage(0), "0%");
  assert.strictEqual(formatPercentage(-0.5), "0%");
  assert.strictEqual(formatPercentage(NaN), "0%");
  assert.strictEqual(formatPercentage(Infinity), "0%");
});

test("utils.clamp: clamps values within specified range", () => {
  assert.strictEqual(clamp(5, 0, 10), 5);
  assert.strictEqual(clamp(-5, 0, 10), 0);
  assert.strictEqual(clamp(15, 0, 10), 10);
  assert.strictEqual(clamp(NaN, 0, 10), 0);
});
