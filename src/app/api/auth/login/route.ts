import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser } from "@/lib/db/users";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { rateLimiter } from "@/lib/security/rate-limiter";

const LoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || "unknown";
  const rateCheck = rateLimiter.check(`login:${clientIp}`, 10, 300);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 5 phút." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = LoginSchema.parse(body);

    const user = authenticateUser(parsed.email, parsed.password);
    if (!user) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng." },
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
        { error: "Dữ liệu đăng nhập không hợp lệ.", details: error.errors },
        { status: 422 }
      );
    }
    console.error("[Login Error]", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
