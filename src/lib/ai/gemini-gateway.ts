/**
 * SpeakLife AI — Google Gemini 2.0 Flash Adversarial AI Gateway
 * Clean abstraction with Prompt Chaining, Token Budgets, Zod Schema Enforcement, and Heuristic Fallback.
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
    // Check for prompt injection
    const injectionCheck = detectPromptInjection(outlineText);
    if (injectionCheck.isSuspicious) {
      console.warn(`[Prompt Guard Alert] Prompt injection pattern detected in outline: ${injectionCheck.matchedPattern}`);
    }

    const safeOutline = wrapUntrustedContent("presentation_outline", truncateSafe(outlineText, 3000));

    const apiKey = this.getApiKey();
    // If no API key or in offline environment, return pedagogical questions calibrated for THPT
    if (!apiKey) {
      return this.getFallbackQuestions(scenario, difficulty);
    }

    const systemPrompt = `
Bạn là Ban Giám Khảo phản biện chuyên môn của cuộc thi Gameshow “Đấu trường AI” và nghiên cứu KHKT dành cho học sinh THPT.
Nhiệm vụ của bạn: Dựa trên dàn ý bài thuyết trình của học sinh, hãy tìm ra đúng 2 câu hỏi phản biện sắc bén nhất nhắm vào các lỗ hổng logic, thiếu số liệu thực nghiệm, hoặc giải pháp chưa khả thi trong thực tế lớp học.

Các thành viên Ban Giám Khảo:
1. Thầy Vũ Xuân Định (Chuyên gia Phương pháp luận & Toán học): Chất vấn tính khả thi và số liệu đối chứng.
2. Cô Nguyễn Thị Thu Hà (Chuyên gia Ngôn ngữ & Sư phạm): Chất vấn chiều sâu nội dung và tính thuyết phục.

Yêu cầu trả về đúng định dạng JSON:
{
  "questions": [
    {
      "id": "q1",
      "judgeName": "Thầy Vũ Xuân Định",
      "judgeRole": "Giám khảo Phương pháp luận",
      "avatarColor": "bg-brand-primary",
      "questionText": "<Câu hỏi chất vấn cụ thể>",
      "targetedFlaw": "<Lỗ hổng luận cứ cần làm rõ>",
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
                { text: `Bối cảnh: ${scenario} | Độ khó: ${difficulty}\nTiêu đề bài nói: ${title}\n${safeOutline}` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        console.warn(`Gemini API returned status ${response.status}, using robust fallback`);
        return this.getFallbackQuestions(scenario, difficulty);
      }

      const rawData = await response.json();
      const rawText = rawData?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedJson = JSON.parse(rawText);
      const validated = JudgeQuestionsSchema.parse(parsedJson);

      return validated.questions.map((q) => ({
        ...q,
        judgeAvatar: "",
      }));
    } catch (err) {
      console.warn("Gemini call failed, utilizing graceful heuristic fallback", err);
      return this.getFallbackQuestions(scenario, difficulty);
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
            temperature: 0.3,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        return this.getFallbackEvaluation(userAnswer, responseTimeSec);
      }

      const rawData = await response.json();
      const rawText = rawData?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText);
      return AnswerEvaluationSchema.parse(parsed);
    } catch (err) {
      return this.getFallbackEvaluation(userAnswer, responseTimeSec);
    }
  }

  /**
   * Resilient, high-standard fallback questions for school competitions.
   */
  private getFallbackQuestions(scenario: string, difficulty: string): JudgeQuestion[] {
    return [
      {
        id: "q1",
        judgeName: "Thầy Vũ Xuân Định",
        judgeRole: "Giám khảo Phương pháp luận & Toán học",
        avatarColor: "bg-brand-primary",
        questionText:
          "Thầy nhận thấy đề tài của nhóm có tính thời sự cao. Tuy nhiên, trong điều kiện phòng học thực tế ánh sáng yếu hoặc học sinh ngồi nghiêng, cơ sở khoa học nào chứng minh giải pháp của em vẫn duy trì độ chính xác trên 85%?",
        targetedFlaw: "Điều kiện biên và tính ổn định thực nghiệm",
        timeLimitSec: 30,
        judgeAvatar: "",
      },
      {
        id: "q2",
        judgeName: "Cô Nguyễn Thị Thu Hà",
        judgeRole: "Giám khảo Sư phạm & Ngôn ngữ học",
        avatarColor: "bg-brand-secondary",
        questionText:
          "Trong phần trình bày, em có khẳng định giải pháp giúp 'loại bỏ hoàn toàn nỗi sợ hãi'. Em hãy làm rõ sự khác biệt giữa việc giảm lo âu tạm thời và việc hình thành kỹ năng phản xạ bền vững ở người học?",
        targetedFlaw: "Khái quát hóa quá mức luận điểm tâm lý học",
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
        ? "Có thể bổ sung thêm số liệu đo đạc cụ thể từ đợt khảo sát thực tế tại Đồng Nai để câu trả lời thêm đanh thép."
        : "Cần vận dụng cấu trúc: Lắng nghe $\to$ Đưa số liệu thực nghiệm $\to$ Khẳng định giải pháp.",
      suggestedResponse:
        "Thưa Thầy/Cô, em hoàn toàn ghi nhận băn khoăn rất xác đáng về điều kiện phòng học. Để khắc phục điều này, trong thử nghiệm trên 30 học sinh tại THPT Trấn Biên, chúng em đã hiệu chuẩn ngưỡng thích ứng ánh sáng và độ chính xác vẫn duy trì đạt 89.4%.",
    };
  }
}

export const geminiGateway = new GeminiGateway();
