import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";
import { getAIConfig, getEffectiveGeminiApiKey } from "@/lib/db/ai-config";

export async function GET() {
  const dbHealth = checkDatabaseHealth();
  const memUsage = process.memoryUsage();
  const aiConfig = getAIConfig();
  const effectiveKey = getEffectiveGeminiApiKey();

  return NextResponse.json({
    status: dbHealth.connected ? "healthy" : "degraded",
    application: "SpeakLife AI",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: Math.round(process.uptime()),
    subsystems: {
      database: {
        status: dbHealth.connected ? "connected" : "disconnected",
        engine: "SQLite (WAL mode)",
        tables: dbHealth.tables,
      },
      ai: {
        status: aiConfig.last_status || (effectiveKey ? "CONFIGURED" : "NOT_CONFIGURED"),
        provider: "Google Gemini",
        model: aiConfig.model || "gemini-3.8-flash",
        isConfigured: Boolean(effectiveKey && effectiveKey.length > 0),
        lastTestedAt: aiConfig.last_tested_at,
        note: effectiveKey
          ? "API Key is configured and ready for live AI inference"
          : "No GEMINI_API_KEY — using pedagogical offline fallback",
      },
      zeroDataRetention: {
        status: "enforced",
        description: "Video/audio processed client-side only via WebAssembly",
      },
      mpreScoringEngine: {
        status: "active",
        rubricMaxPoints: 100,
        axes: 5,
      },
    },
    memory: {
      rssMb: Math.round(memUsage.rss / 1024 / 1024),
      heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
    },
  });
}
