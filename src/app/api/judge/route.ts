import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geminiGateway } from "@/lib/ai/gemini-gateway";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { sanitizeHtml, stripControlCharacters, sanitizeNoSql } from "@/lib/security/input-sanitizer";

const QuestionRequestSchema = z.object({
  title: z.string().max(200).optional().default("Đề tài nghiên cứu KHKT"),
  scenario: z.string().max(100).optional().default("stem_khkt"),
  difficulty: z.string().max(50).optional().default("standard"),
  outlineText: z.string().max(10000).optional().default(""),
});

const AnswerEvaluationRequestSchema = z.object({
  questionId: z.string().min(1).max(50),
  questionText: z.string().min(1).max(1000),
  targetedFlaw: z.string().min(1).max(500),
  userAnswer: z.string().max(2000),
  responseTimeSec: z.number().min(0).max(300),
});

export async function POST(req: NextRequest) {
  // Extract client IP or fallback
  const clientIp = req.headers.get("x-forwarded-for") || "client-local";

  // Rate Limiting: Max 25 AI calls per minute per IP
  const rateLimit = rateLimiter.check(`judge:${clientIp}`, 25, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
        resetSec: rateLimit.resetSec,
      },
      { status: 429 }
    );
  }

  try {
    const rawBody = await req.json();
    const sanitizedBody = sanitizeNoSql(rawBody);

    // Differentiate between generating questions vs evaluating an answer
    if ("outlineText" in sanitizedBody) {
      const parsed = QuestionRequestSchema.parse(sanitizedBody);
      const cleanTitle = stripControlCharacters(parsed.title);
      const cleanOutline = stripControlCharacters(parsed.outlineText);

      const questions = await geminiGateway.generateCounterQuestions(
        cleanTitle,
        parsed.scenario,
        parsed.difficulty,
        cleanOutline
      );

      return NextResponse.json({ questions });
    } else if ("userAnswer" in sanitizedBody) {
      const parsed = AnswerEvaluationRequestSchema.parse(sanitizedBody);
      const cleanAnswer = stripControlCharacters(parsed.userAnswer);

      const evaluation = await geminiGateway.evaluateAnswer(
        parsed.questionText,
        parsed.targetedFlaw,
        cleanAnswer,
        parsed.responseTimeSec
      );

      return NextResponse.json(evaluation);
    } else {
      return NextResponse.json(
        { error: "Yêu cầu không hợp lệ. Thiếu trường bắt buộc." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không đúng định dạng.", details: error.errors },
        { status: 422 }
      );
    }
    console.error("[Judge API Error]", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý với Giám khảo AI." },
      { status: 500 }
    );
  }
}
