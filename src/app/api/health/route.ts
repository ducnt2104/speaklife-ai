import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    application: "SpeakLife AI",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    subsystems: {
      zeroDataRetention: { status: "enforced", rawMediaUploads: "disabled" },
      mpreScoringEngine: { status: "active", rubricMaxPoints: 100 },
      geminiGateway: { status: "configured", model: "gemini-2.0-flash" }
    }
  });
}
