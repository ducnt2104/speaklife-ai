"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Palette,
  Type,
  Globe,
  Zap,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Key,
  Eye,
  EyeOff,
  Radio,
  Camera,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  Clock,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from "lucide-react";
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

const SUPPORTED_MODELS = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tag: "Khuyên dùng - Tốc độ cao",
    desc: "Mô hình thế hệ mới nhất của Google, phản hồi nhanh, tiếng Việt xuất sắc.",
    badge: "Active",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    tag: "Dự phòng",
    desc: "Mô hình xử lý song song, thích hợp cho tác vụ phản biện tài liệu dài.",
    badge: "Optional",
  },
];

export default function SettingsPage() {
  const { settings, updateSettings, user, isAuthenticated } = useAuth();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // AI Core State
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.8-flash");
  const [aiStatus, setAiStatus] = useState<"IDLE" | "TESTING" | "CONNECTED" | "ERROR">("IDLE");
  const [aiStatusDetails, setAiStatusDetails] = useState<{
    latencyMs?: number;
    model?: string;
    message?: string;
    lastTestedAt?: string;
    isConfigured?: boolean;
    maskedKey?: string;
  }>({});

  // Hardware state
  const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[]; mics: MediaDeviceInfo[] }>({
    cameras: [],
    mics: [],
  });
  const [hardwareTesting, setHardwareTesting] = useState(false);
  const [hardwareStatus, setHardwareStatus] = useState<string | null>(null);

  // Stadium & Acoustics State
  const [stadiumQuality, setStadiumQuality] = useState<"high" | "medium" | "low">("high");
  const [crowdAudioEnabled, setCrowdAudioEnabled] = useState(true);

  // Load AI configuration on mount
  useEffect(() => {
    async function loadAiConfig() {
      try {
        const res = await fetch("/api/ai/config");
        if (res.ok) {
          const data = await res.json();
          setSelectedModel(data.model || "gemini-3.8-flash");
          setAiStatus(data.last_status === "CONNECTED" ? "CONNECTED" : "IDLE");
          setAiStatusDetails({
            model: data.model,
            isConfigured: data.is_configured,
            maskedKey: data.masked_key,
            lastTestedAt: data.last_tested_at,
          });
        }
      } catch (err) {
        console.error("Failed to fetch AI config:", err);
      }
    }

    // Load local storage preferences for stadium
    const savedQuality = localStorage.getItem("speaklife_stadium_quality") as "high" | "medium" | "low";
    if (savedQuality) setStadiumQuality(savedQuality);
    const savedAudio = localStorage.getItem("speaklife_crowd_audio");
    if (savedAudio !== null) setCrowdAudioEnabled(savedAudio === "true");

    loadAiConfig();
  }, []);

  const handleTestAiConnection = async () => {
    setAiStatus("TESTING");
    try {
      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyInput.trim() || undefined,
          model: selectedModel,
        }),
      });
      const data = await res.json();

      if (data.ok && data.status === "CONNECTED") {
        setAiStatus("CONNECTED");
        setAiStatusDetails((prev) => ({
          ...prev,
          latencyMs: data.latencyMs,
          model: data.model,
          message: data.message,
          lastTestedAt: new Date().toISOString(),
          isConfigured: true,
        }));
        setSaveMessage(`Kết nối AI thành công! Độ trễ phản hồi: ${data.latencyMs}ms`);
      } else {
        setAiStatus("ERROR");
        setAiStatusDetails((prev) => ({
          ...prev,
          latencyMs: data.latencyMs,
          message: data.error || data.message || "Không thể kết nối đến Google Gemini API.",
        }));
      }
    } catch (err: any) {
      setAiStatus("ERROR");
      setAiStatusDetails((prev) => ({
        ...prev,
        message: err.message || "Lỗi kết nối mạng",
      }));
    }
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleSaveAiConfig = async () => {
    try {
      const res = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyInput.trim() || undefined,
          model: selectedModel,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveMessage("Đã lưu cấu hình AI Core vào hệ thống!");
        setAiStatusDetails((prev) => ({
          ...prev,
          model: data.config.model,
          maskedKey: data.config.masked_key,
          isConfigured: true,
        }));
        setApiKeyInput("");
      } else {
        setSaveMessage("Lỗi lưu cấu hình: " + data.error);
      }
    } catch (err: any) {
      setSaveMessage("Lỗi kết nối: " + err.message);
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleTestHardware = async () => {
    setHardwareTesting(true);
    setHardwareStatus(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = deviceList.filter((d) => d.kind === "videoinput");
      const audioInputs = deviceList.filter((d) => d.kind === "audioinput");
      setDevices({ cameras: videoInputs, mics: audioInputs });
      setHardwareStatus(`Đã phát hiện ${videoInputs.length} camera và ${audioInputs.length} micro khả dụng.`);
      // Stop tracks immediately after enumeration
      stream.getTracks().forEach((track) => track.stop());
    } catch (err: any) {
      setHardwareStatus(`Không thể mở thiết bị: ${err.message}. Hãy cấp quyền Camera và Micro.`);
    } finally {
      setHardwareTesting(false);
    }
  };

  const handleStadiumQualityChange = (q: "high" | "medium" | "low") => {
    setStadiumQuality(q);
    localStorage.setItem("speaklife_stadium_quality", q);
  };

  const handleCrowdAudioToggle = (enabled: boolean) => {
    setCrowdAudioEnabled(enabled);
    localStorage.setItem("speaklife_crowd_audio", enabled ? "true" : "false");
  };

  const handleUpdate = useCallback(
    async (updates: Record<string, any>) => {
      const success = await updateSettings(updates);
      if (success) {
        setSaveMessage("Đã lưu cài đặt thành công");
        setTimeout(() => setSaveMessage(null), 2500);
      } else {
        setSaveMessage("Lỗi lưu cài đặt. Vui lòng thử lại.");
        setTimeout(() => setSaveMessage(null), 3000);
      }
    },
    [updateSettings]
  );

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
    handleStadiumQualityChange("high");
    handleCrowdAudioToggle(true);
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
              <h1 className="text-2xl font-extrabold text-foreground">Cài Đặt & Chẩn Đoán Hệ Thống</h1>
              <p className="text-xs text-text-muted mt-0.5">
                {isAuthenticated
                  ? `Cài đặt cá nhân & AI Core cho ${user?.displayName}`
                  : "Cấu hình AI Core, thiết bị phần cứng, khán đài 3D & giao diện"}
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

      {/* ========================================== */}
      {/* 1. AI CORE ENGINE CONFIGURATION & STATUS   */}
      {/* ========================================== */}
      <Card className="p-6 bg-surface border-2 border-primary/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-foreground text-base">Cấu Hình AI Core (Google Gemini)</h2>
              <p className="text-xs text-text-muted">Bộ não phân tích luận điểm, đặt câu hỏi phản biện và chấm điểm KHKT</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aiStatus === "CONNECTED" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Hoạt động ({aiStatusDetails.latencyMs ? `${aiStatusDetails.latencyMs}ms` : "Sẵn sàng"})
              </span>
            )}
            {aiStatus === "ERROR" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                <AlertCircle className="w-3.5 h-3.5" />
                Lỗi kết nối
              </span>
            )}
            {aiStatus === "TESTING" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang kiểm tra...
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* API Key Input */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Google Gemini API Key
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiKey ? "text" : "password"}
                placeholder={aiStatusDetails.maskedKey || "Nhập AI Studio API Key (AIza...)"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-4 py-2.5 pr-24 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 text-text-muted hover:text-foreground rounded-lg transition-colors"
                  title={showApiKey ? "Ẩn key" : "Hiện key"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-text-muted">
              <span>
                {aiStatusDetails.isConfigured ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 inline" /> Key đã được lưu an toàn ({aiStatusDetails.maskedKey})
                  </span>
                ) : (
                  "Lấy API Key miễn phí tại Google AI Studio (aistudio.google.com)"
                )}
              </span>
              {aiStatusDetails.lastTestedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Kiểm tra lần cuối: {new Date(aiStatusDetails.lastTestedAt).toLocaleTimeString("vi-VN")}
                </span>
              )}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Mô hình suy luận (Inference Model)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUPPORTED_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                      isSelected
                        ? "border-primary bg-primary-light/10 ring-2 ring-primary/20"
                        : "border-border hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" /> {model.name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isSelected ? "bg-primary text-white" : "bg-muted text-text-muted"
                        }`}
                      >
                        {model.tag}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2">{model.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner if any */}
          {aiStatus === "ERROR" && aiStatusDetails.message && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Chi tiết lỗi kết nối:</p>
                <p className="font-mono mt-0.5 break-all">{aiStatusDetails.message}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAiConfig}
              disabled={!apiKeyInput && selectedModel === aiStatusDetails.model}
            >
              <Key className="w-3.5 h-3.5 mr-1.5" />
              <span>Lưu Cấu Hình AI</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestAiConnection}
              disabled={aiStatus === "TESTING"}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${aiStatus === "TESTING" ? "animate-spin" : ""}`} />
              <span>Kiểm Tra Kết Nối Thực Tế</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================== */}
      {/* 2. CAMERA & MICROPHONE HARDWARE CHANNELS   */}
      {/* ========================================== */}
      <Card className="p-6 bg-surface">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-foreground text-base">Thiết Bị Phần Cứng (Camera & Micro)</h2>
              <p className="text-xs text-text-muted">Đo lường giao tiếp mắt thời gian thực & nhận diện giọng nói STT</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleTestHardware} disabled={hardwareTesting}>
            <Radio className={`w-3.5 h-3.5 mr-1.5 ${hardwareTesting ? "animate-pulse text-rose-500" : ""}`} />
            <span>{hardwareTesting ? "Đang quét..." : "Kiểm tra quyền & thiết bị"}</span>
          </Button>
        </div>

        {hardwareStatus && (
          <div className="mb-4 p-3 rounded-xl bg-background border border-border text-xs text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{hardwareStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-background space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Camera className="w-4 h-4 text-primary" />
              <span>Camera thị giác máy</span>
            </div>
            <p className="text-xs text-text-muted">
              {devices.cameras.length > 0
                ? `Phát hiện: ${devices.cameras.map((c) => c.label || "Camera").join(", ")}`
                : "Chưa quét. Nhấn nút kiểm tra để cấp quyền và phát hiện webcam."}
            </p>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Thuật toán theo dõi ánh mắt xử lý 100% tại máy khách (Zero video leak).
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-background space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mic className="w-4 h-4 text-primary" />
              <span>Micro nhận dạng giọng nói</span>
            </div>
            <p className="text-xs text-text-muted">
              {devices.mics.length > 0
                ? `Phát hiện: ${devices.mics.map((m) => m.label || "Microphone").join(", ")}`
                : "Chưa quét. Nhấn nút kiểm tra để xác nhận micro thu âm."}
            </p>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Hỗ trợ Web Speech API tiếng Việt và phát hiện từ đệm tức thời.
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================== */}
      {/* 3. STADIUM 3D & ACOUSTICS PREFERENCES      */}
      {/* ========================================== */}
      <Card className="p-6 bg-surface">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-foreground text-base">Khán Đài 3D & Âm Thanh Mô Phỏng</h2>
            <p className="text-xs text-text-muted">Tùy biến môi trường hội đồng thi KHKT Quốc Gia & hiệu ứng khán giả</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Chất lượng đồ họa khán đài
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "high" as const, label: "Cao cấp (High)", desc: "Khán đài dốc 3 tầng, bóng đổ thực, LED rực rỡ" },
                { id: "medium" as const, label: "Chuẩn (Medium)", desc: "Khán đài tiêu chuẩn, mượt mà trên đa số máy" },
                { id: "low" as const, label: "Tiết kiệm (Low)", desc: "Tối ưu cho máy cấu hình nhẹ" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleStadiumQualityChange(opt.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    stadiumQuality === opt.id
                      ? "border-primary bg-primary-light/10 ring-2 ring-primary/20"
                      : "border-border hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="font-semibold text-foreground text-xs sm:text-sm">{opt.label}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl bg-background border border-border cursor-pointer group">
            <div className="flex items-center gap-3">
              {crowdAudioEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-text-muted" />}
              <div>
                <h3 className="text-sm font-medium text-foreground">Âm thanh khán đài thực tế (Crowd Acoustics)</h3>
                <p className="text-xs text-text-muted mt-0.5">Tiếng vỗ tay khi thuyết trình hay, tiếng xì xào khi bạn ngập ngừng</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={crowdAudioEnabled}
                onChange={(e) => handleCrowdAudioToggle(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors ${
                  crowdAudioEnabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    crowdAudioEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                  } mt-0.5`}
                />
              </div>
            </div>
          </label>
        </div>
      </Card>

      {/* ========================================== */}
      {/* 4. THEME & UI APPEARANCE                   */}
      {/* ========================================== */}
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
          <h2 className="font-heading font-semibold text-foreground">Trải nghiệm & Tối ưu</h2>
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
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                settings.reduced_motion ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  settings.reduced_motion ? "translate-x-[22px]" : "translate-x-0.5"
                } mt-0.5`}
              />
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
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                settings.compact_mode ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  settings.compact_mode ? "translate-x-[22px]" : "translate-x-0.5"
                } mt-0.5`}
              />
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
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                settings.notifications_enabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  settings.notifications_enabled ? "translate-x-[22px]" : "translate-x-0.5"
                } mt-0.5`}
              />
            </div>
          </div>
        </label>
      </Card>

      {/* Account info */}
      {isAuthenticated && user && (
        <Card className="p-6 bg-surface">
          <h2 className="font-heading font-semibold text-foreground mb-3">Tài khoản & Phân quyền</h2>
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
              <Badge variant="info">{user.role === "student" ? "Thí sinh KHKT" : user.role}</Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
