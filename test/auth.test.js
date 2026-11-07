const { test, describe } = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(plainTextPassword) {
  if (!plainTextPassword || plainTextPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
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

describe("Cryptographic Authentication & Password Tests (OWASP ASVS Level 2)", () => {
  test("Password Hashing: Generates unique salt and strong 512-bit hash", () => {
    const password = "StrongStudentPassword@2026";
    const result1 = hashPassword(password);
    const result2 = hashPassword(password);

    assert.ok(result1.hash.length >= 64);
    assert.ok(result1.salt.length >= 32);
    // Unique salt ensures hashes differ for identical passwords
    assert.notStrictEqual(result1.salt, result2.salt);
    assert.notStrictEqual(result1.hash, result2.hash);
  });

  test("Password Verification: Validates correct password and rejects invalid attempts", () => {
    const password = "DongNaiAiContest#2026";
    const { hash, salt } = hashPassword(password);

    assert.strictEqual(verifyPassword(password, hash, salt), true);
    assert.strictEqual(verifyPassword("WrongPassword123", hash, salt), false);
    assert.strictEqual(verifyPassword("", hash, salt), false);
  });

  test("Short Password Rejection: Throws error when password is under 8 chars", () => {
    assert.throws(() => hashPassword("short"), /at least 8 characters/);
  });
});
