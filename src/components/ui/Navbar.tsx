import React from "react";
import Link from "next/link";
import { Mic2, ShieldCheck, BarChart3, Settings, PlayCircle } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm group-hover:bg-primary-hover transition-colors">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-bold text-lg text-foreground tracking-tight flex items-center gap-1.5">
              SpeakLife <span className="text-primary font-bold">AI</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary-light text-primary font-semibold">
                Đồng Nai 2026
              </span>
            </span>
            <p className="text-[11px] text-text-muted hidden sm:block">Phòng luyện phản xạ giao tiếp & thuyết trình</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
          <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span>Tiến độ</span>
          </Link>
          <Link href="/setup" className="hover:text-primary transition-colors flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4" />
            <span>Luyện tập</span>
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Bảo mật Zero-Data</span>
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Vào phòng luyện</span>
          </Link>
        </div>
      </div>
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
            Sản phẩm dự thi Gameshow “Đấu trường AI” TP. Đồng Nai năm 2026 (Bảng B - THPT Tôn Đức Thắng).
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs text-text-secondary">
          <Link href="/privacy" className="hover:text-primary">Chính sách bảo mật Zero-Data</Link>
          <span className="text-border">|</span>
          <span className="text-emerald-600 font-medium">100% Xử lý Client-Side WASM</span>
        </div>
      </div>
    </footer>
  );
};
