import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sanitizePromptInput } from "@/lib/ai/prompt-guard";
import { getEffectiveGeminiApiKey } from "@/lib/db/ai-config";
import { callGeminiWithFallback, extractCleanJson } from "@/lib/ai/gemini-gateway";
import { rateLimiter } from "@/lib/security/rate-limiter";

/**
 * SpeakLife AI — API Đánh giá Bài Thuyết trình 5 Chiều (MPRE Engine v2)
 * Nhận telemetry thực nghiệm từ client + transcript → Gemini phân tích → JSON 5 trục
 * 
 * Trục 1: Ngôn ngữ cơ thể & Ánh mắt (25 điểm) — từ eyeContactRatio + shoulderStability
 * Trục 2: Giọng nói & Tiết tấu (20 điểm) — từ averageWpm + dbLevelVariance
 * Trục 3: Kiểm soát tật ngôn ngữ (15 điểm) — từ fillerOccurrences (ground truth)
 * Trục 4: Chiều sâu nội dung & Lập luận (20 điểm) — Gemini phân tích transcript
 * Trục 5: Phản xạ phản biện (20 điểm) — giữ nguyên từ rebuttalRounds (đã tính client-side)
 */

const PresentationEvalSchema = z.object({
  transcript: z.string().min(10, "Transcript quá ngắn"),
  durationSeconds: z.number().min(5).max(7200),
  // Ground truth telemetry from client sensors
  eyeContactRatio: z.number().min(0).max(100), // 0-100%
  averageWpm: z.number().min(0).max(300),
  fillerOccurrences: z.array(z.object({
    word: z.string(),
    timestampSec: z.number(),
    contextSnippet: z.string().default(""),
  })).default([]),
  totalAnalyzedFrames: z.number().default(900),
  eyeContactFrames: z.number().default(450),
  shoulderTiltVariance: z.number().default(4),
  averageRmsDecibels: z.number().default(-18),
  // Topic context
  presentationTitle: z.string().max(500).default(""),
  scenario: z.string().max(100).default("stem_khkt"),
});

// Build Gemini system prompt with strict anti-hallucination constraints
function buildEvalPrompt(input: z.infer<typeof PresentationEvalSchema>): string {
  const durationMin = Math.max(0.5, input.durationSeconds / 60);
  const fillersPerMin = (input.fillerOccurrences.length / durationMin).toFixed(1);
  
  // Build filler word summary from actual data
  const fillerSummary = input.fillerOccurrences.length > 0
    ? input.fillerOccurrences.map(f => 
        `- "${f.word}" tại giây thứ ${f.timestampSec}${f.contextSnippet ? ` (ngữ cảnh: "${f.contextSnippet}")` : ""}`
      ).join("\n")
    : "Không phát hiện từ đệm nào.";

  return `Bạn là Giám khảo Đánh giá Bài Thuyết trình AI, chuyên gia phân tích kỹ năng trình bày theo Ma trận GDPT 2018.

## DỮ LIỆU THỰC NGHIỆM (GROUND TRUTH - ĐO TỪ CẢM BIẾN, KHÔNG ĐƯỢC THAY ĐỔI)

- **Tỷ lệ giao tiếp mắt**: ${input.eyeContactRatio}% (đo từ MediaPipe Face Mesh)
- **Tốc độ nói**: ${input.averageWpm} từ/phút (đo từ Web Speech API)
- **Thời lượng bài nói**: ${Math.round(durationMin * 10) / 10} phút (${input.durationSeconds} giây)
- **Số từ đệm phát hiện**: ${input.fillerOccurrences.length} lần (${fillersPerMin} từ/phút)
- **Âm lượng trung bình**: ${input.averageRmsDecibels} dB
- **Biến thiên tư thế vai**: ${input.shoulderTiltVariance}° 
- **Đề tài**: "${input.presentationTitle || "Nghiên cứu khoa học kỹ thuật"}"

## DANH SÁCH TỪ ĐỆM CỤ THỂ (ĐÃ BẮT ĐƯỢC TỪ AUDIO)
${fillerSummary}

## TRANSCRIPT BÀI THUYẾT TRÌNH (NGUYÊN VĂN TỪ SPEECH-TO-TEXT)
"""
${input.transcript.slice(0, 4000)}
"""

## YÊU CẦU ĐÁNH GIÁ

Dựa trên transcript và dữ liệu thực nghiệm ở trên, hãy đánh giá bài thuyết trình theo 2 trục sau (Trục 1-3 và 5 đã được tính bằng công thức toán học từ dữ liệu cảm biến, KHÔNG cần bạn chấm lại):

### Trục 4: Chiều sâu nội dung & Lập luận (tối đa 20 điểm)
Phân tích:
- Bố cục Mở - Thân - Kết có rõ ràng không?
- Có dẫn chứng, số liệu, bằng chứng thực nghiệm không?
- Lập luận có mạch lạc, logic không? Có lỗi ngụy biện nào không?
- Đề tài có được trình bày đủ sâu không?

## QUY TẮC BẮT BUỘC (STRICT ANTI-HALLUCINATION)
1. MỌI nhận xét PHẢI trích dẫn trực tiếp câu nói thực tế từ transcript hoặc số liệu cảm biến cụ thể.
2. CẤM tuyệt đối nhận xét chung chung như "bài thuyết trình khá tốt", "bạn cần tự tin hơn".
3. Phải chỉ rõ: "Tại phút thứ X, bạn nói '...' → đây là điểm mạnh/yếu vì..."
4. Điểm contentLogicScore PHẢI phản ánh thực chất nội dung transcript, KHÔNG cho điểm cao nếu transcript ngắn hoặc thiếu dẫn chứng.

## ĐỊNH DẠNG OUTPUT (JSON NGHIÊM NGẶT)
Trả về ĐÚNG JSON sau, KHÔNG có text thừa:
{
  "contentLogicScore": <number 0-20>,
  "contentAnalysis": {
    "structureAssessment": "<đánh giá bố cục Mở-Thân-Kết, trích dẫn câu cụ thể>",
    "evidenceQuality": "<đánh giá dẫn chứng/số liệu, trích dẫn từ transcript>",
    "logicFlaws": "<lỗi ngụy biện hoặc đoạn lập luận yếu, trích dẫn cụ thể>",
    "depthAssessment": "<đánh giá chiều sâu nội dung>"
  },
  "bodyLanguageFeedback": "<nhận xét cụ thể dựa trên eyeContactRatio=${input.eyeContactRatio}% và shoulderTilt=${input.shoulderTiltVariance}°, PHẢI nêu con số>",
  "voiceFeedback": "<nhận xét cụ thể dựa trên WPM=${input.averageWpm} và dB=${input.averageRmsDecibels}, PHẢI nêu con số>",
  "fillerFeedback": "<nhận xét dựa trên ${input.fillerOccurrences.length} từ đệm cụ thể đã liệt kê ở trên, PHẢI trích dẫn từ đệm nào xuất hiện nhiều nhất>",
  "topStrengths": ["<điểm mạnh 1 + trích dẫn>", "<điểm mạnh 2 + trích dẫn>"],
  "topWeaknesses": ["<điểm yếu 1 + trích dẫn>", "<điểm yếu 2 + trích dẫn>"],
  "actionableDrills": ["<bài tập cụ thể 1>", "<bài tập cụ thể 2>"]
}`;
}

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || "client-local";
  const rateLimit = rateLimiter.check(`eval-presentation:${clientIp}`, 5, 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu đánh giá. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = PresentationEvalSchema.parse(body);

    const apiKey = getEffectiveGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa cấu hình API Key Gemini" },
        { status: 503 }
      );
    }

    const sanitizedTranscript = sanitizePromptInput(parsed.transcript, 4000).sanitizedText;
    const evalPrompt = buildEvalPrompt({ ...parsed, transcript: sanitizedTranscript });

    try {
      const { data: aiData, model, latencyMs } = await callGeminiWithFallback(apiKey, {
        contents: [{ parts: [{ text: evalPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 3000,
        },
      }, { timeoutMs: 30000 });

      const jsonText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonText) {
        const evaluation = extractCleanJson(jsonText);
        
        // Validate contentLogicScore is within bounds
        const contentScore = Math.min(20, Math.max(0, Number(evaluation.contentLogicScore) || 15));

        return NextResponse.json({
          success: true,
          data: {
            contentLogicScore: contentScore,
            contentAnalysis: evaluation.contentAnalysis || {},
            bodyLanguageFeedback: evaluation.bodyLanguageFeedback || "",
            voiceFeedback: evaluation.voiceFeedback || "",
            fillerFeedback: evaluation.fillerFeedback || "",
            topStrengths: evaluation.topStrengths || [],
            topWeaknesses: evaluation.topWeaknesses || [],
            actionableDrills: evaluation.actionableDrills || [],
          },
          meta: { model, latencyMs },
        });
      }
    } catch (aiErr) {
      console.warn("[evaluate-presentation] Gemini error, using heuristic:", aiErr);
    }

    // Heuristic fallback — analyze transcript without AI
    const wordCount = parsed.transcript.trim().split(/\s+/).length;
    const durationMin = parsed.durationSeconds / 60;
    let heuristicScore = 15;
    
    if (wordCount < 50) heuristicScore = 8;
    else if (wordCount < 100) heuristicScore = 12;
    else if (wordCount > 200 && durationMin >= 2) heuristicScore = 17;
    
    return NextResponse.json({
      success: true,
      data: {
        contentLogicScore: heuristicScore,
        contentAnalysis: {
          structureAssessment: `Bài nói có ${wordCount} từ trong ${Math.round(durationMin * 10) / 10} phút.`,
          evidenceQuality: "Chưa thể phân tích chi tiết (AI không khả dụng).",
          logicFlaws: "Không có dữ liệu phân tích AI.",
          depthAssessment: wordCount > 150 
            ? "Bài nói có độ dài đủ để trình bày ý tưởng." 
            : "Bài nói khá ngắn, có thể chưa đủ sâu.",
        },
        bodyLanguageFeedback: `Tỷ lệ giao tiếp mắt: ${parsed.eyeContactRatio}%.`,
        voiceFeedback: `Tốc độ nói: ${parsed.averageWpm} từ/phút.`,
        fillerFeedback: `Phát hiện ${parsed.fillerOccurrences.length} từ đệm.`,
        topStrengths: [],
        topWeaknesses: [],
        actionableDrills: [],
      },
      meta: { model: "heuristic", latencyMs: 0 },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu đầu vào không hợp lệ.", details: error.errors },
        { status: 422 }
      );
    }
    console.error("[evaluate-presentation] Error:", error);
    return NextResponse.json(
      { error: "Lỗi đánh giá bài thuyết trình." },
      { status: 500 }
    );
  }
}
