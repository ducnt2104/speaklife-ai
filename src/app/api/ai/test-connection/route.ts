import { NextRequest, NextResponse } from "next/server";
import { getEffectiveGeminiApiKey, updateAIConfig } from "@/lib/db/ai-config";
import { z } from "zod";

const testSchema = z.object({
  apiKey: z.string().optional(),
  model: z.string().default("gemini-3.8-flash"),
});
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let requestedModel = "gemini-3.8-flash";

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = testSchema.safeParse(body);
    if (parsed.success && parsed.data.model) {
      requestedModel = parsed.data.model;
    }

    // Determine the key to test: explicit key in request, or effective saved key
    const explicitKey = parsed.success && parsed.data.apiKey ? parsed.data.apiKey.trim() : null;
    const testKey = explicitKey || getEffectiveGeminiApiKey();

    if (!testKey) {
      return NextResponse.json({
        success: false,
        status: "CONFIGURED",
        latencyMs: 0,
        model: requestedModel,
        error: "Chưa cấu hình API Key. Vui lòng nhập Gemini API Key để kiểm tra.",
      });
    }

    // Perform actual test ping to Google Gemini REST endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${requestedModel}:generateContent?key=${testKey}`;
    
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "Kiểm tra kết nối SpeakLife AI. Phản hồi đúng 1 từ: PONG" }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1,
        },
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      // Update DB record
      updateAIConfig({
        lastStatus: "CONNECTED",
        lastTestedAt: new Date().toISOString(),
        model: requestedModel,
      });

      return NextResponse.json({
        success: true,
        status: "CONNECTED",
        latencyMs,
        model: requestedModel,
        provider: "Google Gemini",
        reply: text,
        message: `Kết nối thành công tới ${requestedModel} (Độ trễ: ${latencyMs}ms)`,
      });
    }

    // Classify error response accurately
    const status = res.status;
    let classifiedStatus = "REQUEST_FAILED";
    let errorMessage = `API trả về mã lỗi HTTP ${status}`;

    try {
      const errData = await res.json();
      const apiMsg = errData?.error?.message || "";
      if (status === 400 || status === 403 || apiMsg.toLowerCase().includes("api key")) {
        classifiedStatus = "INVALID_KEY";
        errorMessage = "API Key không hợp lệ hoặc đã bị vô hiệu hóa bởi Google Cloud.";
      } else if (status === 429 || apiMsg.toLowerCase().includes("quota") || apiMsg.toLowerCase().includes("rate")) {
        classifiedStatus = "QUOTA_EXCEEDED";
        errorMessage = "API Key đã vượt quá hạn mức sử dụng (Quota Exceeded). Vui lòng kiểm tra trên Google AI Studio.";
      } else if (status === 404) {
        classifiedStatus = "MODEL_ERROR";
        errorMessage = `Model ${requestedModel} không tồn tại hoặc tài khoản chưa được cấp quyền sử dụng.`;
      } else if (status === 503) {
        // Try fallback model gemini-3.5-flash-lite
        const fallbackModel = "gemini-3.5-flash-lite";
        const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${testKey}`;
        try {
          const fallbackRes = await fetch(fallbackEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Kiểm tra kết nối SpeakLife AI. Phản hồi đúng 1 từ: PONG" }] }],
              generationConfig: { maxOutputTokens: 10, temperature: 0.1 },
            }),
          });
          const fallbackLatency = Date.now() - startTime;
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const fallbackText = fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            updateAIConfig({
              lastStatus: "CONNECTED",
              lastTestedAt: new Date().toISOString(),
              model: fallbackModel,
            });
            return NextResponse.json({
              success: true,
              status: "CONNECTED",
              latencyMs: fallbackLatency,
              model: fallbackModel,
              provider: "Google Gemini",
              reply: fallbackText,
              message: `Model ${requestedModel} đang quá tải (503). Đã kết nối thành công qua ${fallbackModel} (Độ trễ: ${fallbackLatency}ms)`,
            });
          }
        } catch {
          // Fallback also failed
        }
        classifiedStatus = "MODEL_OVERLOADED";
        errorMessage = `Model ${requestedModel} đang quá tải (503). Vui lòng thử lại sau hoặc chọn model khác (gemini-3.5-flash-lite).`;
      }
    } catch {
      // JSON parse error
    }

    updateAIConfig({
      lastStatus: classifiedStatus,
      lastTestedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: false,
      status: classifiedStatus,
      latencyMs,
      model: requestedModel,
      error: errorMessage,
    });
  } catch (netErr: any) {
    const latencyMs = Date.now() - startTime;
    const classifiedStatus = "NETWORK_ERROR";
    const errorMessage = "Không thể kết nối đến máy chủ Google Gemini. Vui lòng kiểm tra đường truyền Internet.";

    updateAIConfig({
      lastStatus: classifiedStatus,
      lastTestedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: false,
      status: classifiedStatus,
      latencyMs,
      model: requestedModel,
      error: errorMessage,
      details: netErr.message,
    });
  }
}
