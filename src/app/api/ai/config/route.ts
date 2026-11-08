import { NextRequest, NextResponse } from "next/server";
import { getAIConfig, updateAIConfig, getEffectiveGeminiApiKey } from "@/lib/db/ai-config";
import { z } from "zod";

const AVAILABLE_MODELS = [
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash (Mặc định — Tốc độ cao)", speed: "Rất nhanh", tier: "Khuyên dùng" },
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite (Nhanh & ổn định)", speed: "Nhanh", tier: "Tiêu chuẩn" },
];

function maskKey(key: string | null): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 6)}••••••••${trimmed.slice(-4)}`;
}

export async function GET() {
  try {
    const config = getAIConfig();
    const effectiveKey = getEffectiveGeminiApiKey();

    return NextResponse.json({
      success: true,
      provider: config.provider || "gemini",
      model: config.model || "gemini-3.8-flash",
      isEnabled: Boolean(config.is_enabled),
      hasKey: Boolean(effectiveKey && effectiveKey.length > 0),
      maskedKey: maskKey(effectiveKey),
      lastStatus: config.last_status || "CONFIGURED",
      lastTestedAt: config.last_tested_at,
      availableModels: AVAILABLE_MODELS,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi đọc cấu hình AI", details: err.message },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  apiKey: z.string().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (parsed.data.model) updates.model = parsed.data.model;
    if (parsed.data.provider) updates.provider = parsed.data.provider;
    if (parsed.data.isEnabled !== undefined) updates.isEnabled = parsed.data.isEnabled;
    if (parsed.data.apiKey !== undefined) {
      // Only update if key provided (allow empty string to clear)
      updates.apiKey = parsed.data.apiKey.trim();
      updates.lastStatus = "CONFIGURED"; // reset status for testing
    }

    const updated = updateAIConfig(updates);
    const effectiveKey = getEffectiveGeminiApiKey();

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật cấu hình AI thành công",
      model: updated.model,
      provider: updated.provider,
      hasKey: Boolean(effectiveKey && effectiveKey.length > 0),
      maskedKey: maskKey(effectiveKey),
      lastStatus: updated.last_status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi cập nhật cấu hình AI", details: err.message },
      { status: 500 }
    );
  }
}
