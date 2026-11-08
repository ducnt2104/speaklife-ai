import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromCookie } from "@/lib/auth/session";
import { getUserSettings, updateUserSettings } from "@/lib/db/settings";
import { apiSuccess, apiError } from "@/lib/api-response";

const UpdateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  accent_color: z.string().max(20).optional(),
  font_size: z.enum(["small", "medium", "large"]).optional(),
  language: z.enum(["vi", "en"]).optional(),
  reduced_motion: z.boolean().optional(),
  compact_mode: z.boolean().optional(),
  notifications_enabled: z.boolean().optional(),
});

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return apiError("UNAUTHORIZED", "Chưa đăng nhập.", 401);
  }

  const settings = getUserSettings(session.userId);
  return apiSuccess({ settings });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return apiError("UNAUTHORIZED", "Chưa đăng nhập.", 401);
  }

  try {
    const body = await req.json();
    const parsed = UpdateSettingsSchema.parse(body);
    const settings = updateUserSettings(session.userId, parsed);
    return apiSuccess({ settings });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", "Giá trị cài đặt không hợp lệ.", 422, error.errors);
    }
    return apiError("INTERNAL_ERROR", "Không thể cập nhật cài đặt.", 500);
  }
}
