import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sanitizePromptInput } from "@/lib/ai/prompt-guard";

const QuestionRequestSchema = z.object({
  outlineTitle: z.string().min(1),
  scenarioId: z.string().min(1),
  difficultyId: z.string().min(1),
  roundNumber: z.number().int().min(1).max(5),
  speechSnippet: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = QuestionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.issues }, { status: 400 });
    }

    const { outlineTitle, scenarioId, difficultyId, roundNumber, speechSnippet } = parsed.data;

    const questionsByRound: Record<number, string> = {
      1: `Đối với đề tài "${outlineTitle}", luận điểm chính của bạn dựa trên giả định nào và làm sao bạn chứng minh giả định đó đúng trong thực tế?`,
      2: `Nếu đối thủ hoặc ban giám khảo phản bác rằng giải pháp này tốn kém hoặc khó triển khai trên diện rộng các trường THPT tại Đồng Nai, bạn sẽ bảo vệ như thế nào?`,
      3: `Điểm sáng tạo đột phá lớn nhất phân biệt đề tài này với các giải pháp hiện có trên thị trường là gì?`
    };

    const question = questionsByRound[roundNumber] || questionsByRound[1];

    return NextResponse.json({
      success: true,
      data: {
        roundNumber,
        question,
        timerSeconds: difficultyId === "adversarial" ? 30 : difficultyId === "standard" ? 45 : 60,
        suggestedApproach: "1. Xác nhận câu hỏi -> 2. Nêu dẫn chứng số liệu -> 3. Khẳng định tính khả thi"
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
