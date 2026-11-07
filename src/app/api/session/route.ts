import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/session";
import { createSession, getSessionById, completeSession } from "@/lib/db/sessions";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { sanitizeHtml, sanitizeNoSql } from "@/lib/security/input-sanitizer";

const SessionCreateSchema = z.object({
  title: z.string().min(1).max(200),
  scenario: z.string().default("khkt_defense"),
  difficulty: z.string().default("balanced"),
  outlineText: z.string().max(5000).default(""),
});

const SessionCompleteSchema = z.object({
  sessionId: z.string().min(1),
  durationSeconds: z.number().min(0).max(7200),
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || "client-local";
  const rateLimit = rateLimiter.check(`session:${clientIp}`, 40, 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Thao tác quá nhanh. Vui lòng thử lại sau giây lát." },
      { status: 429 }
    );
  }

  // Auth check — allow guest mode for unauthenticated users
  const session = await getSessionFromRequest(req);
  const userId = session?.userId || "guest_student";

  try {
    const rawBody = await req.json();
    const cleanBody = sanitizeNoSql(rawBody);
    const parsed = SessionCreateSchema.parse(cleanBody);

    const newSession = createSession({
      userId,
      title: sanitizeHtml(parsed.title),
      scenario: parsed.scenario,
      difficulty: parsed.difficulty,
      outlineText: parsed.outlineText,
    });

    return NextResponse.json({
      success: true,
      sessionId: newSession.id,
      session: newSession,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu phiên không hợp lệ.", details: error.errors },
        { status: 422 }
      );
    }
    console.error("[Session Create Error]", error);
    return NextResponse.json({ error: "Lỗi tạo phiên luyện tập." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return NextResponse.json({ error: "Thiếu sessionId" }, { status: 400 });
  }

  const rehearsalSession = getSessionById(sessionId);
  if (!rehearsalSession) {
    return NextResponse.json({ error: "Phiên không tồn tại hoặc đã hết hạn" }, { status: 404 });
  }

  // Auth check — verify ownership
  const authSession = await getSessionFromRequest(req);
  const requestUserId = authSession?.userId || "guest_student";
  
  if (rehearsalSession.user_id !== requestUserId && rehearsalSession.user_id !== "guest_student") {
    console.warn(`[Security Alert] User ${requestUserId} attempted to access session ${sessionId} owned by ${rehearsalSession.user_id}`);
    return NextResponse.json({ error: "Bạn không có quyền truy cập phiên này." }, { status: 403 });
  }

  return NextResponse.json({ session: rehearsalSession });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SessionCompleteSchema.parse(body);
    
    const authSession = await getSessionFromRequest(req);
    const userId = authSession?.userId || "guest_student";

    const success = completeSession(parsed.sessionId, userId, parsed.durationSeconds);
    if (!success) {
      return NextResponse.json({ error: "Không tìm thấy phiên hoặc không có quyền." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 422 });
    }
    return NextResponse.json({ error: "Lỗi cập nhật phiên." }, { status: 500 });
  }
}
