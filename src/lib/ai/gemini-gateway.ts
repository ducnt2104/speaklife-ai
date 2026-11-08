/**
 * SpeakLife AI — Google Gemini Adversarial AI Gateway
 * Clean abstraction with Markdown JSON extraction, Token Budgets, Zod Schema Enforcement, and Dynamic Contextual Fallback.
 */

import { z } from "zod";
import { wrapUntrustedContent, detectPromptInjection } from "@/lib/security/prompt-guard";
import { truncateSafe } from "@/lib/security/input-sanitizer";
import { JudgeQuestion } from "@/lib/types";
import { getEffectiveGeminiApiKey, getAIConfig } from "@/lib/db/ai-config";

// Schema for Gemini Adversarial Questions Output
export const JudgeQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      judgeName: z.string(),
      judgeRole: z.string(),
      avatarColor: z.string(),
      questionText: z.string(),
      targetedFlaw: z.string(),
      timeLimitSec: z.number().default(30),
    })
  ),
});

// Schema for Q&A Answer Evaluation Output
export const AnswerEvaluationSchema = z.object({
  score: z.number().min(0).max(10),
  strengths: z.string(),
  weaknesses: z.string(),
  suggestedResponse: z.string(),
});

/**
 * Robust JSON extraction helper that cleanly strips markdown code fences (```json ... ```)
 * and isolates JSON objects from surrounding text.
 */
export function extractCleanJson<T = any>(text: string): T {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid or empty AI response text");
  }

  let cleaned = text.trim();

  // Strip markdown code fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }

  // Find first { or [
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx > 0) {
    cleaned = cleaned.substring(startIdx);
  }

  // Find last } or ]
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const endIdx = Math.max(lastBrace, lastBracket);
  if (endIdx !== -1 && endIdx < cleaned.length - 1) {
    cleaned = cleaned.substring(0, endIdx + 1);
  }

  return JSON.parse(cleaned) as T;
}

export class GeminiGateway {
  private getApiKey(): string | null {
    return getEffectiveGeminiApiKey();
  }

  private getEndpoint(): string {
    const model = getAIConfig().model || "gemini-3.8-flash";
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  }

  /**
   * Generates 2-3 adversarial counter-questions targeted at vulnerabilities in the student's presentation outline.
   */
  public async generateCounterQuestions(
    title: string,
    scenario: string,
    difficulty: string,
    outlineText: string
  ): Promise<JudgeQuestion[]> {
    const cleanTitle = title?.trim() || "Đề tài nghiên cứu khoa học kỹ thuật";
    const cleanOutline = outlineText?.trim() || cleanTitle;

    // Check for prompt injection
    const injectionCheck = detectPromptInjection(cleanOutline);
    if (injectionCheck.isSuspicious) {
      console.warn(`[Prompt Guard Alert] Prompt injection pattern detected in outline: ${injectionCheck.matchedPattern}`);
    }

    const safeOutline = wrapUntrustedContent("presentation_outline", truncateSafe(cleanOutline, 4000));

    const apiKey = this.getApiKey();
    // If no API key or in offline environment, return dynamic pedagogical questions tailored to the student's topic
    if (!apiKey) {
      return this.getFallbackQuestions(cleanTitle, cleanOutline, scenario, difficulty);
    }

    const systemPrompt = `
Bạn là Ban Giám Khảo phản biện chuyên môn của cuộc thi KHKT và Gameshow “Đấu trường AI” dành cho học sinh THPT.
Nhiệm vụ tối quan trọng: Đọc kỹ tiêu đề và nội dung bài thuyết trình của học sinh dưới đây, sau đó đặt đúng 2 câu hỏi phản biện ngắn gọn, sắc bén NHẮM TRỰC TIẾP VÀO ĐỀ TÀI VÀ NỘI DUNG NÀY.
TUYỆT ĐỐI KHÔNG hỏi về các đề tài khác không liên quan. Mọi câu hỏi phải gắn liền với các thuật ngữ, phương pháp, và số liệu mà học sinh nêu trong dàn ý.

Các thành viên Ban Giám Khảo:
1. Thầy Vũ Xuân Định (Chuyên gia Phương pháp luận & Toán học): Chất vấn tính khả thi, độ tin cậy và số liệu đối chứng.
2. Cô Nguyễn Thị Thu Hà (Chuyên gia Ngôn ngữ & Sư phạm): Chất vấn chiều sâu nội dung và tính ứng dụng thực tiễn.

BẮT BUỘC trả về đúng định dạng JSON hợp lệ:
{
  "questions": [
    {
      "id": "q1",
      "judgeName": "Thầy Vũ Xuân Định",
      "judgeRole": "Giám khảo Phương pháp luận",
      "avatarColor": "bg-brand-primary",
      "questionText": "<Câu hỏi chất vấn cụ thể gắn liền với đề tài>",
      "targetedFlaw": "<Lỗ hổng luận cứ hoặc điều kiện biên cần làm rõ>",
      "timeLimitSec": 30
    },
    {
      "id": "q2",
      "judgeName": "Cô Nguyễn Thị Thu Hà",
      "judgeRole": "Giám khảo Sư phạm & Ứng dụng",
      "avatarColor": "bg-brand-secondary",
      "questionText": "<Câu hỏi chất vấn chiều sâu ứng dụng thực tiễn của đề tài>",
      "targetedFlaw": "<Tính khả thi trong môi trường thực tế>",
      "timeLimitSec": 30
    }
  ]
}
`.trim();

    try {
      const endpoint = this.getEndpoint();
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt },
                { text: `Bối cảnh: ${scenario} | Độ khó: ${difficulty}\nTiêu đề đề tài: ${cleanTitle}\n${safeOutline}` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        console.warn(`Gemini API returned status ${response.status}, using dynamic fallback for topic: ${cleanTitle}`);
        return this.getFallbackQuestions(cleanTitle, cleanOutline, scenario, difficulty);
      }

      const rawData = await response.json();
      const rawText = rawData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return this.getFallbackQuestions(cleanTitle, cleanOutline, scenario, difficulty);
      }

      const parsedJson = extractCleanJson(rawText);
      const validated = JudgeQuestionsSchema.parse(parsedJson);

      return validated.questions.map((q) => ({
        ...q,
        judgeAvatar: "",
      }));
    } catch (err) {
      console.warn("Gemini call or JSON parse failed, utilizing dynamic contextual fallback", err);
      return this.getFallbackQuestions(cleanTitle, cleanOutline, scenario, difficulty);
    }
  }

  /**
   * Evaluates student's verbal/textual response to a counter-question.
   */
  public async evaluateAnswer(
    questionText: string,
    targetedFlaw: string,
    userAnswer: string,
    responseTimeSec: number
  ) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.getFallbackEvaluation(userAnswer, responseTimeSec);
    }

    const systemPrompt = `
Bạn là Giám khảo AI đánh giá câu trả lời phản biện của học sinh THPT.
Đánh giá câu trả lời theo 3 tiêu chí:
1. Có lắng nghe/đồng ý trước khi phản biện không?
2. Có dẫn chứng thực tế hoặc số liệu bảo vệ quan điểm không?
3. Thái độ tự tin, điềm tĩnh và đúng trọng tâm?

Trả về JSON:
{
  "score": <điểm từ 0 đến 10>,
  "strengths": "<ưu điểm nổi bật>",
  "weaknesses": "<nhược điểm cần khắc phục>",
  "suggestedResponse": "<mẫu câu trả lời mẫu xuất sắc>"
}
`.trim();

    try {
      const endpoint = this.getEndpoint();
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt },
                {
                  text: `Câu hỏi phản biện: "${questionText}" (Mục tiêu: ${targetedFlaw})\nThời gian phản ứng: ${responseTimeSec}s\nCâu trả lời của học sinh: "${userAnswer}"`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        return this.getFallbackEvaluation(userAnswer, responseTimeSec);
      }

      const rawData = await response.json();
      const rawText = rawData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return this.getFallbackEvaluation(userAnswer, responseTimeSec);
      }

      const parsed = extractCleanJson(rawText);
      return AnswerEvaluationSchema.parse(parsed);
    } catch (err) {
      return this.getFallbackEvaluation(userAnswer, responseTimeSec);
    }
  }

  /**
   * Dynamic contextual fallback questions:
   * Generates questions calibrated strictly to the user's title and outline,
   * completely avoiding hardcoded mock topics when the user enters their own project.
   */
  private getFallbackQuestions(
    title: string,
    outlineText: string,
    scenario: string,
    difficulty: string
  ): JudgeQuestion[] {
    const topic = title.trim() || "đề tài nghiên cứu";
    const snippet = outlineText.trim().slice(0, 100);

    return [
      {
        id: "q1",
        judgeName: "Thầy Vũ Xuân Định",
        judgeRole: "Giám khảo Phương pháp luận & Thực nghiệm",
        avatarColor: "bg-brand-primary",
        questionText: `Đối với đề tài "${topic}", cơ sở thực nghiệm và thông số đo lường nào giúp nhóm chứng minh giải pháp đạt độ chính xác và tính ổn định cao trong điều kiện thực tế?`,
        targetedFlaw: "Điều kiện biên và tính ổn định thực nghiệm của giải pháp",
        timeLimitSec: 30,
        judgeAvatar: "",
      },
      {
        id: "q2",
        judgeName: "Cô Nguyễn Thị Thu Hà",
        judgeRole: "Giám khảo Sư phạm & Ứng dụng",
        avatarColor: "bg-brand-secondary",
        questionText: `Trong nội dung "${snippet || topic}", nếu hội đồng cho rằng chi phí triển khai hoặc mức độ tiếp cận của người dùng là rào cản lớn, bạn sẽ bảo vệ tính khả thi của dự án như thế nào?`,
        targetedFlaw: "Tính khả thi thực tiễn và tính kinh tế của giải pháp",
        timeLimitSec: 30,
        judgeAvatar: "",
      },
    ];
  }

  private getFallbackEvaluation(userAnswer: string, responseTimeSec: number) {
    const isDetailed = userAnswer.length >= 40;
    const isQuick = responseTimeSec <= 15;

    return {
      score: isDetailed ? (isQuick ? 8.6 : 7.8) : 5.8,
      strengths: isDetailed
        ? "Phản xạ nhanh, bảo vệ được trọng tâm luận điểm và giữ thái độ tôn trọng ban giám khảo."
        : "Nắm được câu hỏi, tuy nhiên còn ngập ngừng và thiếu dẫn chứng thực tế.",
      weaknesses: isDetailed
        ? "Có thể bổ sung thêm số liệu đo đạc cụ thể để câu trả lời thêm đanh thép."
        : "Cần vận dụng cấu trúc: Lắng nghe $\\to$ Đưa số liệu thực nghiệm $\\to$ Khẳng định giải pháp.",
      suggestedResponse:
        "Thưa Thầy/Cô, em hoàn toàn ghi nhận băn khoăn rất xác đáng của Hội đồng. Để giải quyết vấn đề này, nhóm chúng em đã tiến hành khảo sát và hiệu chuẩn ngưỡng thích ứng thực tế, qua đó chứng minh tính khả thi đạt trên 88%.",
    };
  }
}

export const geminiGateway = new GeminiGateway();
