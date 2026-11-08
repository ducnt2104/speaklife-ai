/**
 * SpeakLife AI — Google Gemini Adversarial AI Gateway
 * Multi-model fallback (gemini-3.8-flash → gemini-3.5-flash-lite),
 * Markdown JSON extraction, Token Budgets, Zod Schema Enforcement,
 * and Dynamic Contextual Fallback.
 */

import { z } from "zod";
import { wrapUntrustedContent, detectPromptInjection } from "@/lib/security/prompt-guard";
import { truncateSafe } from "@/lib/security/input-sanitizer";
import { JudgeQuestion } from "@/lib/types";
import { getEffectiveGeminiApiKey, getAIConfig } from "@/lib/db/ai-config";

// ── Model Configuration ──────────────────────────────────────
/**
 * Default model and ordered fallback list.
 * When primary model returns 503 (overload) or 429 (rate limit),
 * the gateway automatically retries with the next model.
 */
export const DEFAULT_MODEL = "gemini-3.8-flash";
export const MODEL_FALLBACK_ORDER = ["gemini-3.8-flash", "gemini-3.5-flash-lite"] as const;

/**
 * Resolves the best model to use: DB config → default constant.
 * Never falls back to deprecated models.
 */
export function resolveModel(): string {
  const dbModel = getAIConfig().model;
  if (dbModel && !dbModel.startsWith("gemini-2.0") && !dbModel.startsWith("gemini-1.")) {
    return dbModel;
  }
  return DEFAULT_MODEL;
}

// ── Schemas ──────────────────────────────────────────────────
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

export const AnswerEvaluationSchema = z.object({
  score: z.number().min(0).max(10),
  strengths: z.string(),
  weaknesses: z.string(),
  suggestedResponse: z.string(),
});

// ── JSON Extraction ──────────────────────────────────────────
/**
 * Robust JSON extraction helper that cleanly strips markdown code fences
 * (```json ... ```) and isolates JSON objects from surrounding text.
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

// ── Multi-Model Fallback Call ────────────────────────────────
/**
 * Makes a Gemini API call with automatic model fallback on 503/429.
 * Returns the raw response data or throws on unrecoverable errors.
 */
export async function callGeminiWithFallback(
  apiKey: string,
  requestBody: Record<string, unknown>,
  opts?: { timeoutMs?: number }
): Promise<{ data: any; model: string; latencyMs: number }> {
  const primaryModel = resolveModel();
  const models = [primaryModel, ...MODEL_FALLBACK_ORDER.filter(m => m !== primaryModel)];
  const timeout = opts?.timeoutMs || 120_000;

  let lastError: Error | null = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const startMs = Date.now();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const latencyMs = Date.now() - startMs;

      if (res.ok) {
        return { data: await res.json(), model, latencyMs };
      }

      // Retry-eligible errors: 503 (overload), 429 (rate limit)
      if (res.status === 503 || res.status === 429) {
        console.warn(`[GeminiGateway] ${model} returned ${res.status}, trying next model...`);
        lastError = new Error(`${model}: HTTP ${res.status}`);
        continue;
      }

      // Non-retryable error
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`Gemini API ${res.status}: ${errBody?.error?.message || "Unknown error"}`);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn(`[GeminiGateway] ${model} timed out after ${timeout}ms, trying next...`);
        lastError = new Error(`${model}: timeout`);
        continue;
      }
      if (err.message?.startsWith("Gemini API")) throw err;
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

// ── Gateway Class ────────────────────────────────────────────
export class GeminiGateway {
  private getApiKey(): string | null {
    return getEffectiveGeminiApiKey();
  }

  /**
   * Generates 2-3 adversarial counter-questions targeted at vulnerabilities
   * in the student's presentation outline.
   * Uses automatic model fallback (gemini-3.8-flash → gemini-3.5-flash-lite).
   * 
   * V2.0: 3 Persona Judges with Bloom taxonomy question stratification.
   */
  public async generateCounterQuestions(
    title: string,
    scenario: string,
    difficulty: string,
    outlineText: string
  ): Promise<JudgeQuestion[]> {
    const cleanTitle = title?.trim() || "Đề tài nghiên cứu khoa học kỹ thuật";
    const cleanOutline = outlineText?.trim() || cleanTitle;

    const injectionCheck = detectPromptInjection(cleanOutline);
    if (injectionCheck.isSuspicious) {
      console.warn(`[Prompt Guard Alert] Prompt injection detected: ${injectionCheck.matchedPattern}`);
    }

    const safeOutline = wrapUntrustedContent("presentation_outline", truncateSafe(cleanOutline, 4000));

    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.getFallbackQuestions(cleanTitle, cleanOutline, scenario, difficulty);
    }

    // Determine number of judges based on difficulty
    const judgeCount = difficulty === "adversarial" ? 3 : difficulty === "standard" ? 2 : 2;

    const systemPrompt = `
Bạn là Ban Giám Khảo phản biện chuyên môn đa giác quan của cuộc thi KHKT và Gameshow "Đấu trường AI" dành cho học sinh THPT.

## HỘI ĐỒNG 3 GIÁM KHẢO CHUYÊN BIỆT

### Giám khảo A — PGS.TS Trần Minh Khoa (Nhà Khoa học Khắt khe)
- Chuyên môn: Phương pháp luận nghiên cứu, thống kê thực nghiệm, logic nhân quả
- Phong cách: Xoáy sâu vào tính chính xác số liệu, nguồn gốc thông tin, thiết kế thực nghiệm
- Màu sắc avatar: bg-blue-600

### Giám khảo B — ThS. Lê Hoàng Yến (Chuyên gia Thực tế & Nhà Đầu tư)
- Chuyên môn: Tính khả thi, chi phí triển khai, rào cản người dùng, khả năng thương mại hóa
- Phong cách: Chất vấn về ứng dụng thực tiễn trong môi trường học đường và đời sống
- Màu sắc avatar: bg-emerald-600

### Giám khảo C — TS. Hoàng Đức Anh (Người Phản biện Đối lập - Devil's Advocate)
- Chuyên môn: Tìm edge cases, phản ví dụ, góc nhìn trái chiều, điều kiện biên
- Phong cách: Đặt giả định ngược, stress-test bản lĩnh bảo vệ quan điểm
- Màu sắc avatar: bg-rose-600

## PHÂN TẦNG CÂU HỎI THEO THANG TƯ DUY BLOOM

Mỗi câu hỏi PHẢI thuộc 1 trong 2 cấp:
- **Cấp 1 (Phân tích — Deep Dive):** Yêu cầu làm rõ luận điểm mơ hồ, dẫn chứng thiếu, hoặc phương pháp chưa rõ ràng. Bắt đầu bằng "Hãy giải thích...", "Cơ sở nào...", "Làm sao chứng minh..."
- **Cấp 2 (Ứng biến — Stress Test):** Đặt giả định khi điều kiện thay đổi hoàn toàn, buộc học sinh phản xạ giải quyết. Bắt đầu bằng "Nếu xảy ra...", "Giả sử...", "Khi điều kiện X thay đổi..."

## NHIỆM VỤ
Đọc kỹ tiêu đề và nội dung bài thuyết trình, sau đó đặt đúng ${judgeCount} câu hỏi phản biện.

LUẬT BẮT BUỘC:
1. Mọi câu hỏi PHẢI gắn liền với thuật ngữ, phương pháp, số liệu CỤ THỂ trong dàn ý. Ví dụ: "Ở phần X bạn nhắc đến giải pháp Y, nhưng nếu xảy ra trường hợp Z thì sao?"
2. TUYỆT ĐỐI KHÔNG hỏi chung chung hoặc về đề tài khác.
3. Câu hỏi phải CÁ NHÂN HÓA 100% — trích xuất chi tiết thực tế từ bài nói.
4. Nếu bối cảnh là ${difficulty === "adversarial" ? "Khắt khe" : difficulty === "standard" ? "Chuẩn mực" : "Đồng hành"}, điều chỉnh mức độ gay gắt phù hợp.

BẮT BUỘC trả về JSON hợp lệ:
{
  "questions": [
    {
      "id": "q1",
      "judgeName": "<Tên giám khảo>",
      "judgeRole": "<Vai trò>",
      "avatarColor": "<bg-xxx-600>",
      "bloomLevel": "<Phân tích hoặc Ứng biến>",
      "questionText": "<Câu hỏi CỤ THỂ gắn liền đề tài>",
      "targetedFlaw": "<Lỗ hổng cụ thể đang nhắm tới>",
      "timeLimitSec": ${difficulty === "adversarial" ? 25 : difficulty === "standard" ? 35 : 45}
    }
  ]
}
`.trim();

    try {
      const { data: rawData } = await callGeminiWithFallback(apiKey, {
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
          temperature: 0.25,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      });

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
      console.warn("Gemini call failed, using dynamic contextual fallback", err);
      return this.getFallbackQuestions(cleanTitle, cleanOutline, scenario, difficulty);
    }
  }

  /**
   * Evaluates student's verbal/textual response to a counter-question.
   * Uses automatic model fallback.
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
      const { data: rawData } = await callGeminiWithFallback(apiKey, {
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
      });

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
   * using 3 Persona Judges with Bloom taxonomy stratification.
   */
  private getFallbackQuestions(
    title: string,
    outlineText: string,
    scenario: string,
    difficulty: string
  ): JudgeQuestion[] {
    const topic = title.trim() || "đề tài nghiên cứu";
    const snippet = outlineText.trim().slice(0, 100);

    const questions: JudgeQuestion[] = [
      {
        id: "q1",
        judgeName: "PGS.TS Trần Minh Khoa",
        judgeRole: "Nhà Khoa học — Phương pháp luận & Thực nghiệm",
        avatarColor: "bg-blue-600",
        questionText: `Đối với đề tài "${topic}", cơ sở thực nghiệm và thông số đo lường nào giúp nhóm chứng minh giải pháp đạt độ chính xác và tính ổn định cao trong điều kiện thực tế? Xin trình bày rõ phương pháp thu thập dữ liệu và mẫu đối chứng.`,
        targetedFlaw: "Thiết kế thực nghiệm và tính tin cậy thống kê của kết quả",
        timeLimitSec: difficulty === "adversarial" ? 25 : 35,
        judgeAvatar: "",
      },
      {
        id: "q2",
        judgeName: "ThS. Lê Hoàng Yến",
        judgeRole: "Chuyên gia Thực tế & Khả thi",
        avatarColor: "bg-emerald-600",
        questionText: `Trong nội dung "${snippet || topic}", nếu hội đồng cho rằng chi phí triển khai hoặc mức độ tiếp cận của người dùng là rào cản lớn, bạn sẽ bảo vệ tính khả thi của dự án như thế nào? Đã thử nghiệm với bao nhiêu đối tượng thực tế?`,
        targetedFlaw: "Tính khả thi thực tiễn, chi phí và khả năng tiếp cận người dùng",
        timeLimitSec: difficulty === "adversarial" ? 25 : 35,
        judgeAvatar: "",
      },
    ];

    // Add 3rd judge for adversarial difficulty
    if (difficulty === "adversarial") {
      questions.push({
        id: "q3",
        judgeName: "TS. Hoàng Đức Anh",
        judgeRole: "Phản biện Đối lập (Devil's Advocate)",
        avatarColor: "bg-rose-600",
        questionText: `Giả sử một nhóm nghiên cứu khác đã phát triển giải pháp tương tự "${topic}" nhưng đạt hiệu quả cao hơn 30%, điều gì khiến giải pháp của bạn vẫn có giá trị riêng? Và nếu toàn bộ giả thiết ban đầu bị bác bỏ, bạn có phương án B nào không?`,
        targetedFlaw: "Lợi thế cạnh tranh và kịch bản worst-case khi giả thiết sai",
        timeLimitSec: 25,
        judgeAvatar: "",
      });
    }

    return questions;
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
        : "Cần vận dụng cấu trúc: Lắng nghe → Đưa số liệu thực nghiệm → Khẳng định giải pháp.",
      suggestedResponse:
        "Thưa Thầy/Cô, em hoàn toàn ghi nhận băn khoăn rất xác đáng của Hội đồng. Để giải quyết vấn đề này, nhóm chúng em đã tiến hành khảo sát và hiệu chuẩn ngưỡng thích ứng thực tế, qua đó chứng minh tính khả thi đạt trên 88%.",
    };
  }
}

export const geminiGateway = new GeminiGateway();
