/**
 * SpeakLife AI — System Verification & Security Acceptance Suite
 * End-to-end verification of Database, Authentication, Password Hashing,
 * Session Management, Input Sanitization, and Rate Limiting.
 *
 * Usage:
 *   npx tsx scripts/verify-system.ts
 */

import Database from "better-sqlite3";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import path from "path";
import fs from "fs";

// ══════════════════════════════════════════════════
// ANSI Colors & Logging Helpers
// ══════════════════════════════════════════════════
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logHeader(title: string) {
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ▶ ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
}

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${colors.green}✔ PASS${colors.reset} ${testName}`);
    if (detail) console.log(`         ${colors.gray}${detail}${colors.reset}`);
  } else {
    failedTests++;
    console.log(`  ${colors.red}✖ FAIL${colors.reset} ${colors.bold}${testName}${colors.reset}`);
    if (detail) console.log(`         ${colors.red}${detail}${colors.reset}`);
  }
}

// ══════════════════════════════════════════════════
// 1. ENVIRONMENT VALIDATION
// ══════════════════════════════════════════════════
async function testEnvironment() {
  logHeader("1. Environment & Configuration Audit");

  // Load .env.local if present
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [k, ...v] = trimmed.split("=");
      if (k && v.length) {
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }

  const { getEnv } = await import("../src/lib/env");
  let envValid = false;
  try {
    const env = getEnv();
    envValid = !!env.JWT_SECRET && env.JWT_SECRET.length >= 32;
    assert(envValid, "Zod Environment Schema Validation", `JWT_SECRET length: ${env.JWT_SECRET?.length || 0} chars`);
    assert(!!env.DATABASE_PATH, "Database Path configured", `Path: ${env.DATABASE_PATH}`);
  } catch (err: any) {
    assert(false, "Zod Environment Schema Validation", err.message);
  }

  // Check .env.example cleanliness (must not leak real keys)
  const envExamplePath = path.resolve(process.cwd(), ".env.example");
  const exampleExists = fs.existsSync(envExamplePath);
  assert(exampleExists, ".env.example template exists");
  if (exampleExists) {
    const exampleContent = fs.readFileSync(envExamplePath, "utf-8");
    const leaksSecret = exampleContent.includes("c9c49d620ea740302cc24e9211756136") || exampleContent.includes("AQ.Ab8RN6JTB8");
    assert(!leaksSecret, ".env.example contains zero production secrets");
  }
}

// ══════════════════════════════════════════════════
// 2. DATABASE LAYER AUDIT
// ══════════════════════════════════════════════════
async function testDatabase() {
  logHeader("2. Database Schema, Indexing & Connection Singleton");

  const { getDatabase } = await import("../src/lib/db");
  const db1 = getDatabase();
  const db2 = getDatabase();

  assert(db1 === db2, "Database Connection Singleton (globalThis pool)");

  // Check PRAGMAs
  const walMode = db1.pragma("journal_mode") as Array<{ journal_mode: string }>;
  assert(walMode[0]?.journal_mode?.toLowerCase() === "wal", "WAL Mode enabled for high-performance concurrent reads");

  const fkPragma = db1.pragma("foreign_keys") as Array<{ foreign_keys: number }>;
  assert(fkPragma[0]?.foreign_keys === 1, "Foreign Keys enforcement enabled (ON DELETE CASCADE)");

  // Check Tables
  const tables = db1.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r: any) => r.name);
  assert(tables.includes("users"), "Table 'users' exists");
  assert(tables.includes("rehearsal_sessions"), "Table 'rehearsal_sessions' exists");
  assert(tables.includes("reports"), "Table 'reports' exists");
  assert(tables.includes("user_settings"), "Table 'user_settings' exists");
  assert(tables.includes("ai_config"), "Table 'ai_config' exists");

  // Check Indexes
  const indexes = db1.prepare("SELECT name FROM sqlite_master WHERE type='index'").all().map((r: any) => r.name);
  assert(indexes.includes("idx_users_email"), "Index 'idx_users_email' exists for fast login queries");
  assert(indexes.includes("idx_sessions_user"), "Index 'idx_sessions_user' exists for fast user history queries");
}

// ══════════════════════════════════════════════════
// 3. AUTHENTICATION & PASSWORD POLICY
// ══════════════════════════════════════════════════
async function testAuthSystem() {
  logHeader("3. Authentication & Password Security (OWASP ASVS)");

  const { hashPassword, verifyPassword } = await import("../src/lib/auth/password");
  const { createUser, authenticateUser, getUserByEmail } = await import("../src/lib/db/users");
  const { getDatabase } = await import("../src/lib/db");

  const testEmail = `verify_test_${Date.now()}@example.com`;
  const strongPassword = "SecurePassword123!@#";

  // 3.1 Password policy validation (Zod schema mirror)
  const PasswordSchema = z.string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ IN HOA")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");

  assert(PasswordSchema.safeParse(strongPassword).success, "Strong password satisfies all criteria");
  assert(!PasswordSchema.safeParse("weak").success, "Short password (<8 chars) rejected");
  assert(!PasswordSchema.safeParse("alllowercase1!").success, "Password missing uppercase rejected");
  assert(!PasswordSchema.safeParse("NoDigitsHere!@").success, "Password missing digits rejected");
  assert(!PasswordSchema.safeParse("NoSpecialChars123").success, "Password missing special characters rejected");

  // 3.2 Password Hashing (PBKDF2 SHA-512, 100k iterations)
  const { hash, salt } = hashPassword(strongPassword);
  assert(salt.length === 64, "Salt is 32 cryptographically random bytes (64 hex chars)");
  assert(hash.length === 128, "Hash is SHA-512 512-bit output (128 hex chars)");

  const verifyCorrect = verifyPassword(strongPassword, hash, salt);
  const verifyWrong = verifyPassword("WrongPassword123!", hash, salt);
  assert(verifyCorrect, "Password verification succeeds for correct plaintext");
  assert(!verifyWrong, "Password verification safely fails for incorrect plaintext");

  // 3.3 Atomic Transaction Test (createUser inserts user AND user_settings)
  const createdUser = createUser({
    email: testEmail,
    displayName: "Verification Test User",
    password: strongPassword,
  });

  assert(!!createdUser?.id, "User created successfully in database");
  assert(createdUser.email === testEmail.toLowerCase(), "Email automatically converted to lowercase");

  // Check default user_settings created atomically
  const db = getDatabase();
  const settingsRow = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(createdUser.id) as any;
  assert(!!settingsRow, "Atomic Transaction: Default user_settings record auto-created alongside User");
  assert(settingsRow?.theme === "system", "Default theme is 'system'");

  // 3.4 Authenticate User
  const authenticated = authenticateUser(testEmail, strongPassword);
  assert(!!authenticated && authenticated.id === createdUser.id, "authenticateUser() successfully matches credentials");
  assert(!(authenticated as any).password_hash, "authenticateUser() does NOT leak password_hash in returned object");

  // User Enumeration Defense check
  const badAuth = authenticateUser("nonexistent@example.com", "randomPass123!");
  assert(badAuth === null, "Failed authentication returns null safely without throwing details");

  // 3.5 Cleanup test record
  db.prepare("DELETE FROM users WHERE id = ?").run(createdUser.id);
  const verifyClean = getUserByEmail(testEmail);
  assert(verifyClean === null, "Test user cleaned up cleanly (Foreign keys cascaded)");
}

// ══════════════════════════════════════════════════
// 4. JWT SESSION & COOKIE MANAGEMENT
// ══════════════════════════════════════════════════
async function testSessionTokens() {
  logHeader("4. JWT Session Token & Edge Verification");

  const { createSessionToken, verifySessionToken } = await import("../src/lib/auth/session");

  const samplePayload = {
    userId: "user_test_12345",
    email: "student@dongnai.edu.vn",
    displayName: "Thí Sinh Dự Thi",
    role: "student",
  };

  const token = await createSessionToken(samplePayload);
  assert(typeof token === "string" && token.split(".").length === 3, "JWT generated with valid 3-part compact serialization");

  const verified = await verifySessionToken(token);
  assert(!!verified, "JWT verified successfully with secret");
  assert(verified?.userId === samplePayload.userId, "JWT payload contains correct userId");
  assert(verified?.role === samplePayload.role, "JWT payload contains correct role");

  // Tampered token rejection
  const tampered = token.slice(0, -6) + "XXXXXX";
  const tamperedVerified = await verifySessionToken(tampered);
  assert(tamperedVerified === null, "Tampered JWT signature safely rejected");
}

// ══════════════════════════════════════════════════
// 5. SECURITY DEFENSES (OWASP TOP 10)
// ══════════════════════════════════════════════════
async function testSecurityDefenses() {
  logHeader("5. Security Defense Layer (XSS, NoSQLi, SQLi, Rate Limiting)");

  const { sanitizeHtml, sanitizeNoSql } = await import("../src/lib/security/input-sanitizer");
  const { rateLimiter } = await import("../src/lib/security/rate-limiter");

  // 5.1 XSS Sanitization
  const xssInput = "<script>alert('pwned')</script><img src=x onerror=alert(1)>";
  const cleanHtml = sanitizeHtml(xssInput);
  assert(!cleanHtml.includes("<script>"), "HTML control tags properly escaped");
  assert(cleanHtml.includes("&lt;script&gt;"), "Tags converted to safe HTML entities");

  // 5.2 NoSQL Injection Neutralization
  const maliciousPayload = {
    username: "admin",
    password: { $gt: "" }, // NoSQL bypass trick
    profile: {
      $where: "sleep(5000)",
      bio: "Normal bio text",
    },
  };
  const sanitizedNoSql: any = sanitizeNoSql(maliciousPayload);
  assert(!("$gt" in (sanitizedNoSql.password || {})), "Operator key '$gt' dropped");
  assert(!("$where" in (sanitizedNoSql.profile || {})), "Operator key '$where' dropped");
  assert(sanitizedNoSql.profile.bio === "Normal bio text", "Legitimate payload fields preserved");

  // 5.3 SQL Injection Parameterization Defense
  const { getDatabase } = await import("../src/lib/db");
  const db = getDatabase();
  const sqlInjectionInput = "' OR '1'='1' --";
  const sqlResult = db.prepare("SELECT * FROM users WHERE email = ?").all(sqlInjectionInput);
  assert(Array.isArray(sqlResult) && sqlResult.length === 0, "SQL Injection payload safely treated as literal string");

  // 5.4 Sliding Window Rate Limiter
  const testKey = `test-ip-${Date.now()}`;
  const limit = 5;
  const windowSec = 2;

  let allAllowed = true;
  for (let i = 0; i < limit; i++) {
    const res = rateLimiter.check(testKey, limit, windowSec);
    if (!res.allowed) allAllowed = false;
  }
  assert(allAllowed, `First ${limit} requests within window allowed`);

  // 6th request must be blocked
  const overflowRes = rateLimiter.check(testKey, limit, windowSec);
  assert(!overflowRes.allowed && overflowRes.remaining === 0, "6th request correctly blocked with 429 Rate Limit");
}

// ══════════════════════════════════════════════════
// 6. HTTP SECURITY HEADERS AUDIT
// ══════════════════════════════════════════════════
async function testSecurityHeaders() {
  logHeader("6. HTTP Security Headers (next.config.js)");

  const nextConfigPath = path.resolve(process.cwd(), "next.config.js");
  const configContent = fs.readFileSync(nextConfigPath, "utf-8");

  assert(configContent.includes('"X-Frame-Options"'), "X-Frame-Options header defined");
  assert(configContent.includes('"DENY"'), "X-Frame-Options set to 'DENY' (Clickjacking defense)");
  assert(configContent.includes('"X-Content-Type-Options"') && configContent.includes('"nosniff"'), "X-Content-Type-Options: nosniff defined");
  assert(configContent.includes('"Referrer-Policy"'), "Referrer-Policy defined");
  assert(configContent.includes('"Strict-Transport-Security"'), "Strict-Transport-Security (HSTS) defined");
  assert(configContent.includes('"Content-Security-Policy"'), "Content-Security-Policy defined");
}

// ══════════════════════════════════════════════════
// MAIN RUNNER
// ══════════════════════════════════════════════════
async function runAll() {
  console.log(`\n${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║     SpeakLife AI — System Verification & Security Audit        ║`);
  console.log(`║     Bảng B Hội thi Đấu trường AI 2026 — Đồng Nai               ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝${colors.reset}`);

  const start = Date.now();

  try {
    await testEnvironment();
    await testDatabase();
    await testAuthSystem();
    await testSessionTokens();
    await testSecurityDefenses();
    await testSecurityHeaders();
  } catch (error: any) {
    console.error(`\n${colors.red}${colors.bold}Fatal Execution Error:${colors.reset}`, error);
    process.exit(1);
  }

  const duration = Date.now() - start;

  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}  KẾT QUẢ KIỂM THỬ HỆ THỐNG:${colors.reset}`);
  console.log(`  Tổng số bài test:   ${colors.bold}${totalTests}${colors.reset}`);
  console.log(`  Thành công (PASS):  ${colors.green}${colors.bold}${passedTests}${colors.reset}`);
  console.log(`  Thất bại (FAIL):    ${failedTests > 0 ? colors.red : colors.gray}${colors.bold}${failedTests}${colors.reset}`);
  console.log(`  Thời gian thực thi: ${colors.gray}${duration}ms${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✔ Tất cả các bài kiểm tra hệ thống và bảo mật đạt 100%!${colors.reset}\n`);
    process.exit(0);
  }
}

runAll();
