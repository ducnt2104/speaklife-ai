import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser } from "@/lib/db/users";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { rateLimiter } from "@/lib/security/rate-limiter";

const LoginSchema = z.object({
  email: z.string().email("Email không hợp lệ").transform(v => v.toLowerCase().trim()),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateCheck = rateLimiter.check(`login:${clientIp}`, 5, 60);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 phút." } },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = LoginSchema.parse(body);

    const user = authenticateUser(parsed.email, parsed.password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_FAILED", message: "Email hoặc mật khẩu không chính xác." } },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Dữ liệu đăng nhập không hợp lệ.", details: error.errors } },
        { status: 422 }
      );
    }
    console.error("[Login Error]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Đã xảy ra lỗi. Vui lòng thử lại." } },
      { status: 500 }
    );
  }
}
