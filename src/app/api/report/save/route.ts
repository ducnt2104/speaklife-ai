import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/session";
import { saveReport } from "@/lib/db/reports";
import { createSession, getSessionById, completeSession } from "@/lib/db/sessions";
import { calculateMPREScore } from "@/lib/rubric/mpre-calculator";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { sanitizeNoSql } from "@/lib/security/input-sanitizer";

const SaveReportSchema = z.object({
  sessionId: z.string().min(1).max(100),
  durationSeconds: z.number().min(5).max(7200),
  eyeContactRatio: z.number().min(0).max(1),
  averageWpm: z.number().min(20).max(300),
  fillerOccurrences: z.array(
    z.object({
      word: z.string(),
      timestampSec: z.number(),
      contextSnippet: z.string().default(""),
    })
  ).default([]),
  judgeQuestions: z.array(z.any()).default([]),
  dataCoverageRatio: z.number().min(0).max(1).default(0.95),
  shoulderTiltVariance: z.number().default(4),
  pitchF0StdDev: z.number().default(16),
  averageRmsDecibels: z.number().default(-18),
  rebuttalRounds: z.array(
    z.object({
      reactionTimeSeconds: z.number(),
      score: z.number(),
    })
  ).default([]),
  aiContentScore: z.number().min(0).max(20).optional(),
  title: z.string().max(500).optional(),
  scenario: z.string().max(50).optional(),
  difficulty: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || "client-local";
  const rateLimit = rateLimiter.check(`report-save:${clientIp}`, 10, 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều báo cáo. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  const authSession = await getSessionFromRequest(req);
  const userId = authSession?.userId;

  // Only save reports for authenticated users
  if (!userId) {
    return NextResponse.json(
      { success: true, saved: false, reason: "guest_mode" },
      { status: 200 }
    );
  }

  try {
    const rawBody = await req.json();
    const cleanBody = sanitizeNoSql(rawBody);
    const parsed = SaveReportSchema.parse(cleanBody);

    // Calculate MPRE evaluation
    const evaluation = calculateMPREScore({
      durationSeconds: parsed.durationSeconds,
      totalWords: Math.round((parsed.durationSeconds / 60) * parsed.averageWpm),
      faceDetectedFrames: 900,
      totalAnalyzedFrames: 900,
      eyeContactFrames: Math.round(900 * parsed.eyeContactRatio),
      shoulderTiltVariance: parsed.shoulderTiltVariance,
      averageRmsDecibels: parsed.averageRmsDecibels,
      pitchF0StdDev: parsed.pitchF0StdDev,
      fillerWordCount: parsed.fillerOccurrences.length,
      aiContentScore: parsed.aiContentScore,
      rebuttalRounds: parsed.rebuttalRounds,
    });

    // Ensure session exists in DB (create if needed, e.g. when client sends local_ prefixed IDs)
    let dbSession = getSessionById(parsed.sessionId);
    let sessionId = parsed.sessionId;

    if (!dbSession) {
      // Auto-create session record so foreign key is satisfied
      const newSession = createSession({
        userId,
        title: parsed.title || "Buổi luyện tập",
        scenario: parsed.scenario || "khkt_defense",
        difficulty: parsed.difficulty || "balanced",
        outlineText: "",
      });
      sessionId = newSession.id;
    }

    // Save report to database
    const report = saveReport(sessionId, userId, evaluation);

    // Mark session as completed
    completeSession(sessionId, userId, parsed.durationSeconds);

    return NextResponse.json({
      success: true,
      saved: true,
      reportId: report.id,
      evaluation,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu báo cáo không hợp lệ.", details: error.errors },
        { status: 422 }
      );
    }
    console.error("[Report Save Error]", error);
    return NextResponse.json(
      { error: "Không thể lưu báo cáo." },
      { status: 500 }
    );
  }
}
