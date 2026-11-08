import { NextRequest } from "next/server";
import { z } from "zod";
import { sanitizePromptInput } from "@/lib/ai/prompt-guard";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { apiSuccess, apiError } from "@/lib/api-response";

const QuestionRequestSchema = z.object({
  outlineTitle: z.string().min(1, "Tiêu đề không được để trống").max(500),
  scenarioId: z.string().min(1).max(100),
  difficultyId: z.string().min(1).max(100),
  roundNumber: z.number().int().min(1).max(5),
  speechSnippet: z.string().max(2000).optional()
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "client-local";
  const rateLimit = rateLimiter.check(`ai-generate-question:${clientIp}`, 15, 60);

  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Quá nhiều yêu cầu. Vui lòng thử lại sau.", 429);
  }

  try {
    const body = await req.json();
    const parsed = QuestionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dữ liệu yêu cầu không hợp lệ.", 400, parsed.error.issues);
    }

    const { outlineTitle, scenarioId, difficultyId, roundNumber } = parsed.data;

    const questionsByRound: Record<number, string> = {
      1: `Đối với đề tài "${outlineTitle}", luận điểm chính của bạn dựa trên giả định nào và làm sao bạn chứng minh giả định đó đúng trong thực tế?`,
      2: `Nếu đối thủ hoặc ban giám khảo phản bác rằng giải pháp này tốn kém hoặc khó triển khai trên diện rộng các trường THPT tại Đồng Nai, bạn sẽ bảo vệ như thế nào?`,
      3: `Điểm sáng tạo đột phá lớn nhất phân biệt đề tài này với các giải pháp hiện có trên thị trường là gì?`
    };

    const question = questionsByRound[roundNumber] || questionsByRound[1];

    return apiSuccess({
      roundNumber,
      question,
      timerSeconds: difficultyId === "adversarial" ? 30 : difficultyId === "standard" ? 45 : 60,
      suggestedApproach: "1. Xác nhận câu hỏi -> 2. Nêu dẫn chứng số liệu -> 3. Khẳng định tính khả thi"
    });
  } catch (err: unknown) {
    console.error("[generate-question] Error:", err);
    return apiError("INTERNAL_ERROR", "Không thể tạo câu hỏi phản biện lúc này.", 500);
  }
}
