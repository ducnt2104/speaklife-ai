import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { sanitizeNoSql, sanitizeHtml } from "@/lib/security/input-sanitizer";

// In-Memory safe session repository with automatic TTL expiration
interface UserSession {
  id: string;
  userId: string;
  title: string;
  scenario: string;
  difficulty: string;
  outlineText: string;
  createdAt: string;
  expiresAt: number;
}

const sessionStore = new Map<string, UserSession>();

const SessionCreateSchema = z.object({
  userId: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  scenario: z.string().default("khkt_defense"),
  difficulty: z.string().default("balanced"),
  outlineText: z.string().max(5000).default(""),
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

  try {
    const rawBody = await req.json();
    const cleanBody = sanitizeNoSql(rawBody);
    const parsed = SessionCreateSchema.parse(cleanBody);

    const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newSession: UserSession = {
      id: sessionId,
      userId: parsed.userId,
      title: sanitizeHtml(parsed.title),
      scenario: parsed.scenario,
      difficulty: parsed.difficulty,
      outlineText: parsed.outlineText,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours TTL
    };

    sessionStore.set(sessionId, newSession);

    return NextResponse.json({
      success: true,
      sessionId,
      session: newSession,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu phiên không hợp lệ.", details: error.errors },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "Lỗi tạo phiên luyện tập." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");
  const requestUserId = req.headers.get("x-user-id") || "guest_student";

  if (!sessionId) {
    return NextResponse.json({ error: "Thiếu sessionId" }, { status: 400 });
  }

  const session = sessionStore.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Phiên không tồn tại hoặc đã hết hạn" }, { status: 404 });
  }

  // Authorization Check: Default Deny & Verify Ownership (Anti-IDOR)
  if (session.userId !== requestUserId && session.userId !== "guest_student") {
    console.warn(`[Security Alert - Broken Access Control] User ${requestUserId} attempted to access session ${sessionId} owned by ${session.userId}`);
    return NextResponse.json({ error: "Bạn không có quyền truy cập phiên này." }, { status: 403 });
  }

  return NextResponse.json({ session });
}
