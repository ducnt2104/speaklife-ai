import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateMultimodalRubric } from "@/lib/ai/rubric-evaluator";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { sanitizeNoSql } from "@/lib/security/input-sanitizer";

const ReportRequestSchema = z.object({
  sessionId: z.string().min(1).max(100),
  presentationTitle: z.string().max(200).default("Bài thuyết trình thực chiến"),
  scenario: z.string().default("khkt_defense"),
  difficulty: z.string().default("balanced"),
  durationSec: z.number().min(5).max(7200),
  eyeContactRatio: z.number().min(0).max(1),
  averageWpm: z.number().min(20).max(300),
  fillerOccurrences: z.array(
    z.object({
      word: z.string(),
      timestampSec: z.number(),
      contextSnippet: z.string(),
    })
  ).default([]),
  judgeQuestions: z.array(z.any()).default([]),
  dataCoverageRatio: z.number().min(0).max(1).default(0.95),
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || "client-local";
  const rateLimit = rateLimiter.check(`report:${clientIp}`, 30, 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều báo cáo được tạo. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  try {
    const rawBody = await req.json();
    const cleanBody = sanitizeNoSql(rawBody);
    const parsed = ReportRequestSchema.parse(cleanBody);

    const report = evaluateMultimodalRubric(parsed);
    return NextResponse.json(report);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu báo cáo không hợp lệ.", details: error.errors },
        { status: 422 }
      );
    }
    console.error("[Report API Error]", error);
    return NextResponse.json(
      { error: "Không thể tạo báo cáo chẩn đoán." },
      { status: 500 }
    );
  }
}
