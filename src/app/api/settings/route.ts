import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromCookie } from "@/lib/auth/session";
import { getUserSettings, updateUserSettings } from "@/lib/db/settings";

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
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const settings = getUserSettings(session.userId);
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateSettingsSchema.parse(body);
    const settings = updateUserSettings(session.userId, parsed);
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Giá trị cài đặt không hợp lệ.", details: error.errors },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: "Không thể cập nhật cài đặt." },
      { status: 500 }
    );
  }
}
