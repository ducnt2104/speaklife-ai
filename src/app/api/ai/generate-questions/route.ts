import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sanitizePromptInput } from "@/lib/ai/prompt-guard";
import { getEffectiveGeminiApiKey } from "@/lib/db/ai-config";
import { callGeminiWithFallback, extractCleanJson } from "@/lib/ai/gemini-gateway";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { apiSuccess, apiError } from "@/lib/api-response";

const generateSchema = z.object({
  documentSummary: z.string().min(1, "Nội dung tóm tắt không được để trống").max(10000),
  scenario: z.string().default("khkt"),
  difficulty: z.string().default("medium"),
  previousQuestions: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "client-local";
  const rateLimit = rateLimiter.check(`ai-generate-questions:${clientIp}`, 10, 60);

  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "Quá nhiều yêu cầu tạo câu hỏi. Vui lòng thử lại sau 1 phút.", 429);
  }

  try {
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ", 400, parsed.error.issues);
    }

    const { documentSummary, scenario, difficulty, previousQuestions } = parsed.data;
    const promptAudit = sanitizePromptInput(documentSummary, 5000);

    const apiKey = getEffectiveGeminiApiKey();
    if (apiKey) {
      try {
        const { data: aiData } = await callGeminiWithFallback(apiKey, {
          contents: [
            {
              parts: [
                {
                  text: `Bạn là giám khảo phản biện AI (Bối cảnh: ${scenario}, Độ khó: ${difficulty}).
                      
Tóm tắt bài thuyết trình:
"""${promptAudit.sanitizedText}"""

Các câu hỏi đã hỏi trước đó (tránh lặp):
${previousQuestions.map((q) => `- ${q}`).join("\n")}

Hãy tạo 3 câu hỏi phản biện sắc bén và trả về JSON:
{
  "questions": [
    {
      "question": "nội dung câu hỏi bằng tiếng Việt",
      "type": "factual" | "analytical" | "adversarial",
      "expectedFocus": "trọng tâm câu trả lời mong đợi"
    }
  ]
}
CHỈ trả về JSON.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.5,
            maxOutputTokens: 2048,
          },
        });

        const jsonText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = extractCleanJson(jsonText);
          return apiSuccess({ questions: parsed.questions || [] });
        }
      } catch (err) {
        console.warn("Gemini generateQuestions fallback:", err);
      }
    }

    // Heuristic Fallback
    return apiSuccess({
      questions: [
        {
          question: `Đối với đề tài này, cơ sở thực nghiệm nào giúp nhóm tự tin giải pháp đạt độ chính xác cao khi triển khai tại trường học?`,
          type: "analytical",
          expectedFocus: "Số liệu thực nghiệm, độ tin cậy của thuật toán",
        },
        {
          question: `Nếu hội đồng cho rằng chi phí triển khai hoặc rào cản kỹ thuật là quá lớn với học sinh THPT, bạn sẽ phản biện thế nào?`,
          type: "adversarial",
          expectedFocus: "Tính khả thi về mặt kinh tế và dễ sử dụng",
        },
        {
          question: `Điểm sáng tạo cốt lõi nhất của sản phẩm so với các giải pháp hiện hành là gì?`,
          type: "factual",
          expectedFocus: "Tính mới và tính đột phá của đề tài",
        },
      ],
    });
  } catch (error) {
    console.error("Generate questions error:", error);
    return apiError("INTERNAL_ERROR", "Không thể tạo câu hỏi phản biện lúc này. Vui lòng thử lại.", 500);
  }
}
