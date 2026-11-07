// SpeakLife AI — Cryptographic Password Hashing & Verification
// Standard: PBKDF2 with SHA-512, 100,000 iterations, 32-byte salt (OWASP ASVS V2.4.1)

import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export interface HashedPassword {
  hash: string;
  salt: string;
}

export function hashPassword(plainTextPassword: string): HashedPassword {
  if (!plainTextPassword || plainTextPassword.length < 8) {
    throw new Error("Mật khẩu phải có độ dài tối thiểu 8 ký tự.");
  }
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.pbkdf2Sync(plainTextPassword, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { hash, salt };
}

export function verifyPassword(plainTextPassword: string, storedHash: string, storedSalt: string): boolean {
  if (!plainTextPassword || !storedHash || !storedSalt) return false;
  try {
    const computedHash = crypto.pbkdf2Sync(plainTextPassword, storedSalt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
    // Constant-time buffer comparison to prevent timing side-channel attacks
    const bufferA = Buffer.from(computedHash, "hex");
    const bufferB = Buffer.from(storedHash, "hex");
    if (bufferA.length !== bufferB.length) return false;
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}
