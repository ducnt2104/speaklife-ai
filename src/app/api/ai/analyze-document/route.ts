import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sanitizePromptInput } from "@/lib/ai/prompt-guard";

const analyzeSchema = z.object({
  text: z.string().min(10, "Nội dung quá ngắn").max(50000, "Nội dung quá dài"),
  language: z.enum(["vi", "en"]).default("vi"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { text, language } = parsed.data;
    const promptAudit = sanitizePromptInput(text, 10000);

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Bạn là chuyên gia phân tích bài thuyết trình. Hãy phân tích nội dung sau và trả về JSON:
                      
"""${promptAudit.sanitizedText}"""

Trả về JSON với cấu trúc chính xác:
{
  "keyPoints": ["danh sách các luận điểm chính (tối đa 10)"],
  "structure": {
    "hasIntro": true/false,
    "hasBody": true/false,
    "hasConclusion": true/false
  },
  "weaknesses": ["các điểm yếu cần cải thiện (tối đa 5)"],
  "summary": "tóm tắt ngắn gọn dưới 200 từ"
}
${language === "vi" ? "Trả lời bằng tiếng Việt." : "Answer in English."}
CHỈ trả về JSON hợp lệ.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3,
              },
            }),
          }
        );

        if (response.ok) {
          const aiData = await response.json();
          const jsonText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            return NextResponse.json({
              success: true,
              data: { analysis: JSON.parse(jsonText) },
            });
          }
        }
      } catch (err) {
        console.warn("Gemini analyzeDocument fallback:", err);
      }
    }

    // Heuristic Fallback
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 15);
    const keyPoints = sentences.slice(0, 5).map((s) => s.trim());
    return NextResponse.json({
      success: true,
      data: {
        analysis: {
          keyPoints: keyPoints.length > 0 ? keyPoints : ["Luận điểm mở đầu đề tài", "Phương pháp giải quyết vấn đề", "Kết luận và định hướng tương lai"],
          structure: {
            hasIntro: text.length > 50,
            hasBody: text.length > 200,
            hasConclusion: text.length > 300,
          },
          weaknesses: [
            "Cần bổ sung số liệu thống kê thực chứng rõ ràng hơn",
            "Nên nhấn mạnh tính cấp thiết và giải pháp khác biệt",
          ],
          summary: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
        },
      },
    });
  } catch (error) {
    console.error("Analyze document error:", error);
    return NextResponse.json({ error: "Lỗi phân tích tài liệu" }, { status: 500 });
  }
}
