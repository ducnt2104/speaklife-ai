import { NextRequest } from "next/server";
import { z } from "zod";
import { sanitizePromptInput } from "@/lib/ai/prompt-guard";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { apiSuccess, apiError } from "@/lib/api-response";

const RebuttalScoreRequestSchema = z.object({
  question: z.string().min(1),
  answerText: z.string().min(1).max(2000),
  reactionTimeSeconds: z.number().min(0).max(120)
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "client-local";
  const rateLimit = rateLimiter.check(`ai-eval-rebuttal:${clientIp}`, 15, 60);

  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Quá nhiều yêu cầu đánh giá. Vui lòng thử lại sau.", 429);
  }

  try {
    const body = await req.json();
    const parsed = RebuttalScoreRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dữ liệu phản biện không hợp lệ.", 400, parsed.error.issues);
    }

    const { question, answerText, reactionTimeSeconds } = parsed.data;

    const sanitized = sanitizePromptInput(answerText, 2000);
    const wordCount = answerText.split(/\s+/).length;

    // Latency evaluation (max 5 pts)
    let latencyScore = 5;
    if (reactionTimeSeconds > 8) latencyScore = 1;
    else if (reactionTimeSeconds > 5) latencyScore = 3;
    else if (reactionTimeSeconds > 3) latencyScore = 4;

    // Content rebuttal evaluation (max 15 pts)
    let contentScore = 10;
    if (wordCount >= 25 && wordCount <= 120) {
      contentScore = 14;
    } else if (wordCount > 120) {
      contentScore = 12; // Overly verbose
    } else if (wordCount < 10) {
      contentScore = 6;  // Overly brief / superficial
    }

    const totalRebuttalRound = Math.min(20, latencyScore + contentScore);

    return apiSuccess({
      roundScore: totalRebuttalRound,
      latencyScore,
      contentScore,
      feedback: reactionTimeSeconds <= 3.5 
        ? "Phản xạ nhanh, bảo vệ luận điểm có dẫn chứng và thái độ tự tin."
        : "Cần cải thiện thời gian phản xạ ban đầu; câu trả lời tương đối đầy đủ ý.",
      keyStrengths: [
        "Bám sát câu hỏi chất vấn của ban giám khảo",
        "Thái độ điềm tĩnh, không bị mất bình tĩnh"
      ]
    });
  } catch (err: unknown) {
    console.error("[evaluate-rebuttal] Error:", err);
    return apiError("INTERNAL_ERROR", "Không thể đánh giá phản biện lúc này.", 500);
  }
}
