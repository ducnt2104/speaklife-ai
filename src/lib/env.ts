/**
 * SpeakLife AI — Environment Variable Validation
 * Validates all required environment variables at startup using Zod.
 * Prevents silent failures from missing or malformed configuration.
 */

import { z } from "zod";

const envSchema = z.object({
  // Database (supports DATABASE_PATH for SQLite or DATABASE_URL for Postgres/MySQL)
  DATABASE_PATH: z.string().default("./data/speaklife.db"),
  DATABASE_URL: z.string().optional(),

  // Authentication (supports JWT_SECRET or NEXTAUTH_SECRET)
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters for HS256 security").optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  JWT_EXPIRY: z.string().default("24h"),

  // Google Gemini AI
  GEMINI_API_KEY: z.string().min(10, "GEMINI_API_KEY is required").optional(),

  // Application
  APP_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_APP_NAME: z.string().default("SpeakLife AI"),
  NEXT_PUBLIC_APP_VERSION: z.string().default("2.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
}).refine(data => data.JWT_SECRET || data.NEXTAUTH_SECRET, {
  message: "Either JWT_SECRET or NEXTAUTH_SECRET must be provided (min 32 chars)",
  path: ["JWT_SECRET"],
});

export type Env = z.infer<typeof envSchema>;

let _validated: Env | null = null;

/**
 * Validates and returns typed environment variables.
 * Caches the result after first successful validation.
 * Throws descriptive error if any required variable is missing or invalid.
 */
export function getEnv(): Env {
  if (_validated) return _validated;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error(
      `\n╔══════════════════════════════════════════════════╗\n` +
      `║  SpeakLife AI — Environment Validation Failed   ║\n` +
      `╚══════════════════════════════════════════════════╝\n` +
      `\nMissing or invalid environment variables:\n${errors}\n` +
      `\nCopy .env.example to .env.local and fill in the values.\n`
    );
    throw new Error(`Environment validation failed: ${result.error.message}`);
  }

  _validated = result.data;
  return _validated;
}
