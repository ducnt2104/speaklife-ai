#!/usr/bin/env node
/**
 * SpeakLife AI — Milestone 1 Adversarial Fuzzing CLI Runner
 * Executable directly via: `node tests/stress/m1-fuzzer.js`
 */

const { spawnSync } = require("child_process");
const path = require("path");

console.log("Invoking Milestone 1 Adversarial Fuzzer via tsx runtime...\n");

const scriptPath = path.resolve(__dirname, "m1-fuzzer.ts");
const result = spawnSync("npx", ["tsx", `"${scriptPath}"`], {
  stdio: "inherit",
  shell: true,
  cwd: path.resolve(__dirname, "../.."),
});

process.exit(result.status ?? 0);
