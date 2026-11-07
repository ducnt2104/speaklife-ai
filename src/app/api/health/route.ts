import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";

export async function GET() {
  const dbHealth = checkDatabaseHealth();
  const memUsage = process.memoryUsage();

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
        status: process.env.GEMINI_API_KEY ? "configured" : "not_configured",
        provider: "Google Gemini",
        model: "gemini-2.0-flash",
        note: process.env.GEMINI_API_KEY
          ? "API key present, ready for real AI calls"
          : "No GEMINI_API_KEY — using pedagogical fallback questions",
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
