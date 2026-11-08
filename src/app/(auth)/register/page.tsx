"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic2, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = [
    { label: "Tối thiểu 8 ký tự", valid: password.length >= 8 },
    { label: "Ít nhất 1 chữ IN HOA (A-Z)", valid: /[A-Z]/.test(password) },
    { label: "Ít nhất 1 chữ số (0-9)", valid: /[0-9]/.test(password) },
    { label: "Ít nhất 1 ký tự đặc biệt (!@#$...)", valid: /[^A-Za-z0-9]/.test(password) },
    { label: "Xác nhận mật khẩu khớp", valid: password.length > 0 && password === confirmPassword },
  ];

  const isFormValid =
    displayName.trim().length >= 2 &&
    email.includes("@") &&
    passwordChecks.every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError("");
    setIsSubmitting(true);

    const result = await register(email, displayName, password);
    setIsSubmitting(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Đăng ký thất bại");
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 bg-surface border-border shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white mx-auto mb-4 shadow-md">
            <Mic2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Tạo tài khoản SpeakLife AI</h1>
          <p className="text-sm text-text-secondary mt-1">
            Lưu lịch sử, theo dõi tiến bộ và cá nhân hóa trải nghiệm
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Tên hiển thị</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ví dụ: Nguyễn Tiến Đức"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ten@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tối thiểu 8 ký tự, có hoa, số & ký tự đặc biệt"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nhập lại mật khẩu"
              required
              autoComplete="new-password"
            />
          </div>

          {/* Password strength indicators */}
          <div className="space-y-1.5">
            {passwordChecks.map((check, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs ${check.valid ? "text-emerald-600" : "text-text-muted"}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${check.valid ? "text-emerald-500" : "text-slate-300"}`} />
                <span>{check.label}</span>
              </div>
            ))}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full shadow-md"
            isLoading={isSubmitting}
            disabled={isSubmitting || !isFormValid}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span>Tạo tài khoản</span>
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
