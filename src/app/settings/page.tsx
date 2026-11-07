"use client";

import React, { useState, useCallback } from "react";
import { Settings, Sun, Moon, Monitor, Palette, Type, Globe, Zap, LayoutGrid, Bell, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";

const ACCENT_COLORS = [
  { id: "violet", label: "Tím Hoàng gia", class: "bg-violet-600" },
  { id: "blue", label: "Xanh Dương", class: "bg-blue-600" },
  { id: "emerald", label: "Xanh Lá", class: "bg-emerald-600" },
  { id: "rose", label: "Hồng Đào", class: "bg-rose-600" },
  { id: "amber", label: "Hổ Phách", class: "bg-amber-600" },
  { id: "cyan", label: "Xanh Ngọc", class: "bg-cyan-600" },
];

const FONT_SIZES = [
  { id: "small" as const, label: "Nhỏ gọn", description: "14px — dành cho màn hình lớn" },
  { id: "medium" as const, label: "Chuẩn", description: "16px — mặc định" },
  { id: "large" as const, label: "Lớn", description: "18px — dễ đọc hơn" },
];

const THEMES = [
  { id: "light" as const, label: "Sáng", icon: Sun, description: "Giao diện sáng mặc định" },
  { id: "dark" as const, label: "Tối", icon: Moon, description: "Bảo vệ mắt khi luyện đêm" },
  { id: "system" as const, label: "Hệ thống", icon: Monitor, description: "Theo cài đặt thiết bị" },
];

export default function SettingsPage() {
  const { settings, updateSettings, user, isAuthenticated } = useAuth();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleUpdate = useCallback(async (updates: Record<string, any>) => {
    const success = await updateSettings(updates);
    if (success) {
      setSaveMessage("Đã lưu cài đặt thành công");
      setTimeout(() => setSaveMessage(null), 2500);
    } else {
      setSaveMessage("Lỗi lưu cài đặt. Vui lòng thử lại.");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [updateSettings]);

  const handleResetDefaults = async () => {
    await handleUpdate({
      theme: "system",
      accent_color: "violet",
      font_size: "medium",
      language: "vi",
      reduced_motion: false,
      compact_mode: false,
      notifications_enabled: true,
    });
  };

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-text-secondary">Đang tải cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Cài Đặt</h1>
              <p className="text-xs text-text-muted mt-0.5">
                {isAuthenticated
                  ? `Cài đặt cá nhân cho ${user?.displayName}`
                  : "Cài đặt lưu trên thiết bị này (đăng nhập để đồng bộ)"}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetDefaults}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          <span>Khôi phục mặc định</span>
        </Button>
      </div>

      {/* Save notification */}
      {saveMessage && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Theme Selection */}
      <Card className="p-6 bg-surface">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Chế độ giao diện</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map((theme) => {
            const isSelected = settings.theme === theme.id;
            const Icon = theme.icon;
            return (
              <button
                key={theme.id}
                onClick={() => handleUpdate({ theme: theme.id })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary-light/10 ring-2 ring-primary/20"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-text-muted"}`} />
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <h3 className="font-semibold text-foreground text-sm">{theme.label}</h3>
                <p className="text-xs text-text-muted mt-0.5">{theme.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Accent Color */}
      <Card className="p-6 bg-surface">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Màu nhấn</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((color) => {
            const isSelected = settings.accent_color === color.id;
            return (
              <button
                key={color.id}
                onClick={() => handleUpdate({ accent_color: color.id })}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary-light/10 ring-2 ring-primary/20"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className={`w-5 h-5 rounded-full ${color.class} shadow-sm`} />
                <span className="text-sm font-medium text-foreground">{color.label}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Font Size */}
      <Card className="p-6 bg-surface">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Cỡ chữ</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FONT_SIZES.map((size) => {
            const isSelected = settings.font_size === size.id;
            return (
              <button
                key={size.id}
                onClick={() => handleUpdate({ font_size: size.id })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary-light/10 ring-2 ring-primary/20"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground text-sm">{size.label}</h3>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-text-muted">{size.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Language */}
      <Card className="p-6 bg-surface">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Ngôn ngữ</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "vi" as const, label: "Tiếng Việt", flag: "🇻🇳" },
            { id: "en" as const, label: "English", flag: "🇬🇧" },
          ].map((lang) => {
            const isSelected = settings.language === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => handleUpdate({ language: lang.id })}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary-light/10 ring-2 ring-primary/20"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-semibold text-foreground text-sm">{lang.label}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Experience Toggles */}
      <Card className="p-6 bg-surface space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Trải nghiệm</h2>
        </div>

        {/* Reduced Motion */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div>
            <h3 className="text-sm font-medium text-foreground">Giảm chuyển động</h3>
            <p className="text-xs text-text-muted mt-0.5">Tắt animation cho người nhạy cảm thị giác</p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={settings.reduced_motion}
              onChange={(e) => handleUpdate({ reduced_motion: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${settings.reduced_motion ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.reduced_motion ? "translate-x-[22px]" : "translate-x-0.5"} mt-0.5`} />
            </div>
          </div>
        </label>

        {/* Compact Mode */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div>
            <h3 className="text-sm font-medium text-foreground">Chế độ gọn</h3>
            <p className="text-xs text-text-muted mt-0.5">Giảm khoảng cách giữa các thành phần</p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={settings.compact_mode}
              onChange={(e) => handleUpdate({ compact_mode: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${settings.compact_mode ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.compact_mode ? "translate-x-[22px]" : "translate-x-0.5"} mt-0.5`} />
            </div>
          </div>
        </label>

        {/* Notifications */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div>
            <h3 className="text-sm font-medium text-foreground">Thông báo</h3>
            <p className="text-xs text-text-muted mt-0.5">Nhận gợi ý luyện tập và phản hồi</p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={settings.notifications_enabled}
              onChange={(e) => handleUpdate({ notifications_enabled: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${settings.notifications_enabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.notifications_enabled ? "translate-x-[22px]" : "translate-x-0.5"} mt-0.5`} />
            </div>
          </div>
        </label>
      </Card>

      {/* Account info */}
      {isAuthenticated && user && (
        <Card className="p-6 bg-surface">
          <h2 className="font-heading font-semibold text-foreground mb-3">Tài khoản</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Tên hiển thị</span>
              <span className="text-foreground font-medium">{user.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Email</span>
              <span className="text-foreground font-mono text-xs">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Vai trò</span>
              <Badge variant="info">{user.role === "student" ? "Học sinh" : user.role}</Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
