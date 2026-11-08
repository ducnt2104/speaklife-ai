import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import {
  createSession,
  getSessionsWithReportsByUser,
} from "@/lib/db/sessions";
import { z } from "zod";
import { sanitizeHtml, sanitizeNoSql } from "@/lib/security/input-sanitizer";

const createSessionSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề").max(200),
  scenario: z.string().default("stem_khkt"),
  difficulty: z.string().default("standard"),
  documentText: z.string().max(50000).optional().default(""),
});

export async function GET(req: NextRequest) {
  try {
    const authSession = await getSessionFromRequest(req);
    if (!authSession) {
      return NextResponse.json({
        success: true,
        sessions: [],
        total: 0,
        authenticated: false,
      });
    }

    const sessions = getSessionsWithReportsByUser(authSession.userId, 50, 0);

    const formatted = sessions.map((s) => ({
      _id: s.id,
      id: s.id,
      title: s.title,
      scenario: s.scenario,
      difficulty: s.difficulty,
      status: s.status,
      durationSeconds: s.duration_seconds,
      createdAt: s.created_at,
      reportId: s.report_id,
      metrics: s.total_score != null ? { overallScore: Math.round(s.total_score) } : undefined,
      tier: s.tier,
    }));

    return NextResponse.json({
      success: true,
      sessions: formatted,
      total: formatted.length,
      authenticated: true,
    });
  } catch (error) {
    console.error("[API Practice Sessions Error]", error);
    return NextResponse.json(
      { error: "Lỗi tải danh sách phiên luyện tập" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authSession = await getSessionFromRequest(req);
    const userId = authSession?.userId || "guest_student";

    const body = await req.json();
    const cleanBody = sanitizeNoSql(body);
    const parsed = createSessionSchema.parse(cleanBody);

    const newSession = createSession({
      userId,
      title: sanitizeHtml(parsed.title),
      scenario: parsed.scenario,
      difficulty: parsed.difficulty,
      outlineText: parsed.documentText || "",
    });

    return NextResponse.json(
      {
        success: true,
        sessionId: newSession.id,
        session: newSession,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[API Practice Session Create Error]", error);
    return NextResponse.json(
      { error: "Lỗi tạo phiên luyện tập" },
      { status: 500 }
    );
  }
}
