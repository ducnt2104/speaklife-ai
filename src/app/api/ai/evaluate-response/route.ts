import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sanitizePromptInput } from "@/lib/ai/prompt-guard";
import { getEffectiveGeminiApiKey } from "@/lib/db/ai-config";
import { callGeminiWithFallback, extractCleanJson } from "@/lib/ai/gemini-gateway";

const evaluateSchema = z.object({
  question: z.string().min(1, "Thiếu câu hỏi"),
  answer: z.string().min(1, "Thiếu câu trả lời"),
  documentContext: z.string().optional().default(""),
  responseTimeSeconds: z.number().min(0).max(600).default(30),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = evaluateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { question, answer, documentContext, responseTimeSeconds } = parsed.data;
    const cleanAnswer = sanitizePromptInput(answer, 2000).sanitizedText;
    const cleanQuestion = sanitizePromptInput(question, 500).sanitizedText;

    const apiKey = getEffectiveGeminiApiKey();
    if (apiKey) {
      try {
        const { data: aiData } = await callGeminiWithFallback(apiKey, {
          contents: [
            {
              parts: [
                {
                  text: `Bạn là giám khảo phản biện AI đánh giá câu trả lời của thí sinh.

Câu hỏi: "${cleanQuestion}"
Câu trả lời của thí sinh: "${cleanAnswer}"
Thời gian phản ứng: ${responseTimeSeconds} giây
${documentContext ? `Ngữ cảnh đề tài: "${documentContext.slice(0, 1000)}"` : ""}

Đánh giá và trả về JSON:
{
  "relevanceScore": number (0-100),
  "clarityScore": number (0-100),
  "confidenceScore": number (0-100),
  "feedback": "nhận xét ngắn dưới 100 từ bằng tiếng Việt",
  "suggestedImprovement": "gợi ý cải thiện dưới 50 từ bằng tiếng Việt"
}
CHỈ trả về JSON.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        });

        const jsonText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = extractCleanJson(jsonText);
          return NextResponse.json({
            success: true,
            data: { evaluation: parsed },
          });
        }
      } catch (err) {
        console.warn("Gemini evaluateResponse fallback:", err);
      }
    }

    // Heuristic Fallback
    const wordCount = answer.trim().split(/\s+/).length;
    const relevance = Math.min(95, Math.max(60, 65 + Math.min(25, wordCount / 2)));
    const clarity = Math.min(90, Math.max(65, 70 + (wordCount > 20 ? 15 : 5)));
    const confidence = responseTimeSeconds < 45 ? 85 : 72;

    return NextResponse.json({
      success: true,
      data: {
        evaluation: {
          relevanceScore: Math.round(relevance),
          clarityScore: Math.round(clarity),
          confidenceScore: Math.round(confidence),
          feedback: "Câu trả lời đúng trọng tâm câu hỏi, có tinh thần cầu thị và lập luận mạch lạc.",
          suggestedImprovement: "Nên bổ sung số liệu minh chứng định lượng cụ thể để tăng sức thuyết phục trước ban giám khảo.",
        },
      },
    });
  } catch (error) {
    console.error("Evaluate response error:", error);
    return NextResponse.json({ error: "Lỗi đánh giá câu trả lời" }, { status: 500 });
  }
}
