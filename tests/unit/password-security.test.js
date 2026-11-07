// SpeakLife AI — Unit Tests for Cryptographic Password Security
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password) {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  try {
    const computed = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
    const bufA = Buffer.from(computed, "hex");
    const bufB = Buffer.from(hash, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

test("Password Security: Successful hashing and verification with PBKDF2-SHA512", () => {
  const password = "DongNaiAiStudent#2026";
  const { hash, salt } = hashPassword(password);

  assert.ok(hash.length >= 128, "Hash length should be 128 hex chars (64 bytes)");
  assert.ok(salt.length >= 64, "Salt length should be 64 hex chars (32 bytes)");
  assert.strictEqual(verifyPassword(password, hash, salt), true, "Correct password must verify to true");
  assert.strictEqual(verifyPassword("WrongPassword123!", hash, salt), false, "Wrong password must verify to false");
});

test("Password Security: Enforces unique salts across identical passwords", () => {
  const password = "IdenticalPassword#99";
  const account1 = hashPassword(password);
  const account2 = hashPassword(password);

  assert.notStrictEqual(account1.salt, account2.salt, "Each hash must have a unique random salt");
  assert.notStrictEqual(account1.hash, account2.hash, "Identical passwords with different salts must yield different hashes");
});

test("Password Security: Rejects weak passwords under 8 characters", () => {
  assert.throws(() => {
    hashPassword("short1");
  }, /at least 8 characters/, "Should throw error on passwords < 8 chars");
});
