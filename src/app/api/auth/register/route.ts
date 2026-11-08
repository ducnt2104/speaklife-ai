import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUser, getUserByEmail } from "@/lib/db/users";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { sanitizeHtml } from "@/lib/security/input-sanitizer";

const RegisterSchema = z.object({
  email: z.string().email("Email không hợp lệ").max(255).transform(v => v.toLowerCase().trim()),
  displayName: z.string().min(2, "Tên hiển thị phải có ít nhất 2 ký tự").max(100).transform(v => v.trim()),
  password: z.string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .max(128, "Mật khẩu tối đa 128 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ IN HOA")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...)"),
});

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") || "unknown";
  const rateCheck = rateLimiter.check(`register:${clientIp}`, 5, 300);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = RegisterSchema.parse(body);

    // Check if email already exists — generic message to prevent user enumeration
    const existing = getUserByEmail(parsed.email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "REGISTRATION_FAILED", message: "Không thể tạo tài khoản với thông tin này. Vui lòng thử email khác hoặc đăng nhập." } },
        { status: 409 }
      );
    }

    const user = createUser({
      email: parsed.email,
      displayName: sanitizeHtml(parsed.displayName),
      password: parsed.password,
    });

    // Create session token
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
        { success: false, error: { code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ.", details: error.errors } },
        { status: 422 }
      );
    }
    console.error("[Register Error]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể tạo tài khoản. Vui lòng thử lại." } },
      { status: 500 }
    );
  }
}
