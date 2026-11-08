"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, BarChart3, Settings, PlayCircle, LogIn, LogOut, Menu, X, User, History } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Logo } from "@/components/brand/Logo";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: "/dashboard", label: "Tiến độ", icon: BarChart3 },
    { href: "/history", label: "Lịch sử", icon: History },
    { href: "/setup", label: "Luyện tập", icon: PlayCircle },
    { href: "/settings", label: "Cài đặt", icon: Settings },
    { href: "/privacy", label: "Bảo mật Zero-Data", icon: ShieldCheck, accent: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="group" onClick={() => setMobileMenuOpen(false)}>
          <Logo variant="full" size="md" animated showBadge />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-primary transition-colors flex items-center gap-1.5 ${
                  isActive ? "text-primary font-semibold" : ""
                } ${link.accent ? "text-emerald-700 dark:text-emerald-400 font-medium" : ""}`}
              >
                <Icon className={`w-4 h-4 ${link.accent ? "text-emerald-600" : ""}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs text-text-muted">
                <User className="w-3.5 h-3.5 inline mr-1" />
                {user?.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-foreground hover:bg-surface-subtle text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-foreground text-sm transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                href="/setup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Vào phòng luyện</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-subtle transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-surface-subtle hover:text-foreground"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-border mt-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-xs text-text-muted">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  Đang đăng nhập: {user?.displayName}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-surface-subtle transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  href="/setup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Luyện tập</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-heading font-semibold text-foreground text-sm">
            SpeakLife AI — Phòng luyện phản xạ giao tiếp và thuyết trình thực chiến
          </p>
          <p className="text-xs text-text-muted mt-1">
            Sản phẩm dự thi Gameshow "Đấu trường AI" TP. Đồng Nai năm 2026 (Bảng B - THPT Tôn Đức Thắng).
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs text-text-secondary">
          <Link href="/privacy" className="hover:text-primary">Chính sách bảo mật Zero-Data</Link>
          <span className="text-border">|</span>
          <Link href="/settings" className="hover:text-primary">Cài đặt</Link>
          <span className="text-border">|</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Xử lý Client-Side WASM</span>
        </div>
      </div>
    </footer>
  );
};
