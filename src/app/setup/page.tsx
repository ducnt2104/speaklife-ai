"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Cpu,
  Globe,
  Award,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Button, Card, Badge, MathText } from "@/components/ui";
import { DocumentDropzone } from "@/components/ui/DocumentDropzone";
import { PRACTICE_SCENARIOS, DIFFICULTY_TIERS } from "@/lib/constants/scenarios";

export default function SetupPage() {
  const router = useRouter();

  const [selectedScenario, setSelectedScenario] = useState<string>("stem_khkt");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("standard");
  const [outlineTitle, setOutlineTitle] = useState<string>("");
  const [outlineContent, setOutlineContent] = useState<string>("");

  // Live AI Preview State
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Spotlight Tour — auto-trigger on first visit
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { isTourCompleted, startSetupTour } = await import("@/lib/tour/spotlight-tour");
        if (!isTourCompleted()) {
          startSetupTour();
        }
      } catch (err) {
        console.warn("Spotlight tour failed to load:", err);
      }
    }, 800); // Small delay to let DOM render data-tour elements
    return () => clearTimeout(timer);
  }, []);

  const handleTestAiQuestions = async () => {
    if (!outlineContent.trim()) {
      setPreviewError("Vui lòng nhập tóm tắt nội dung bài nói trước khi thử nghiệm.");
      return;
    }

    setIsGeneratingPreview(true);
    setPreviewError(null);

    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: outlineTitle.trim() || "Đề tài nghiên cứu khoa học kỹ thuật",
          scenario: selectedScenario,
          difficulty: selectedDifficulty,
          outlineText: outlineContent.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi máy chủ HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setPreviewQuestions(data.questions);
        sessionStorage.setItem("speaklife_ai_questions", JSON.stringify(data.questions));
      } else {
        throw new Error("Không nhận được câu hỏi từ AI.");
      }
    } catch (err: any) {
      console.warn("AI Question preview error:", err);
      setPreviewError(err.message || "Không thể kết nối đến AI.");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleStartRehearsal = () => {
    // Store rehearsal settings in session storage for the live rehearsal room
    sessionStorage.setItem("speaklife_scenario", selectedScenario);
    sessionStorage.setItem("speaklife_difficulty", selectedDifficulty);
    sessionStorage.setItem("speaklife_outline_title", outlineTitle.trim() || "Đề tài nghiên cứu khoa học kỹ thuật");
    sessionStorage.setItem("speaklife_outline_content", outlineContent.trim());

    if (previewQuestions.length > 0) {
      sessionStorage.setItem("speaklife_ai_questions", JSON.stringify(previewQuestions));
    }

    router.push("/rehearse");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Giai đoạn 1 — Tiếp nhận & Thiết lập Bối cảnh</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Cấu Hình Phòng Luyện Thuyết Trình</h1>
        <p className="text-sm text-text-secondary mt-1">
          Chọn bối cảnh giả lập, mức độ giám khảo và tải lên đề cương bài nói để AI chuẩn bị kịch bản chất vấn.
        </p>
      </div>

      <div className="space-y-10">
        {/* Step 1: Scenario Selection */}
        <div data-tour="scenario-select">
          <label className="block text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
            <span>1. Chọn Bối Cảnh Giả Lập</span>
            <span className="text-xs font-normal text-text-muted">4 kịch bản chuẩn hóa</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRACTICE_SCENARIOS.map((scenario) => {
              const isSelected = selectedScenario === scenario.id;
              return (
                <Card
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className={`p-5 cursor-pointer transition-all duration-200 border-2 ${
                    isSelected
                      ? "border-primary bg-primary-light/10 shadow-md ring-2 ring-primary/20"
                      : "border-border hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground text-base">{scenario.title}</h3>
                      <p className="text-xs text-primary font-medium mt-0.5">{scenario.subtitle}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-text-secondary mt-3 leading-relaxed">{scenario.description}</p>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                    <span>Khán giả: {scenario.audienceType}</span>
                    <span className="font-mono font-medium">{scenario.defaultDurationSeconds / 60} phút</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 2: Difficulty Tier */}
        <div data-tour="difficulty-select">
          <label className="block text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
            <span>2. Chọn Mức Độ Khắt Khe Của Giám Khảo</span>
            <span className="text-xs font-normal text-text-muted">Độ khó của câu hỏi phản biện</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DIFFICULTY_TIERS.map((tier) => {
              const isSelected = selectedDifficulty === tier.id;
              return (
                <Card
                  key={tier.id}
                  onClick={() => setSelectedDifficulty(tier.id)}
                  className={`p-5 cursor-pointer transition-all duration-200 border-2 ${
                    isSelected
                      ? "border-primary bg-primary-light/10 shadow-md ring-2 ring-primary/20"
                      : "border-border hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-semibold text-foreground text-sm">{tier.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="text-xs text-primary font-medium mb-2">
                    {tier.judgeName} • {tier.judgeTitle}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{tier.description}</p>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-muted">
                    <span>{tier.rebuttalCount} câu chất vấn</span>
                    <span>{tier.questionTimerSeconds}s phản xạ</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Step 3: Document & Outline Input */}
        <Card className="p-6 bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-foreground text-base">3. Dàn Ý / Đề Cương Bài Nói</h3>
              <p className="text-xs text-text-muted mt-0.5">Dán nội dung bài thuyết trình để AI chuẩn bị câu hỏi phản biện thực tế.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chống Prompt Injection & Không lưu trữ</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Document Upload Dropzone */}
            <div data-tour="document-upload">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Tải lên tài liệu thuyết trình (tùy chọn)
              </label>
              <DocumentDropzone
                onTextExtracted={(text) => {
                  if (text) {
                    setOutlineContent(text);
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Tiêu đề bài thuyết trình / Dự án KHKT
              </label>
              <input
                type="text"
                value={outlineTitle}
                onChange={(e) => setOutlineTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Ví dụ: Chế tạo robot hỗ trợ phục hồi chức năng chi dưới..."
              />
            </div>

            <div data-tour="outline-input">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Nội dung tóm tắt / Các luận điểm chính
              </label>
              <textarea
                value={outlineContent}
                onChange={(e) => setOutlineContent(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-background p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent leading-relaxed transition-all resize-none"
                placeholder="Dán tóm tắt mở bài, nguyên lý kỹ thuật, phương pháp nghiên cứu, số liệu thử nghiệm và giải pháp..."
              />
            </div>

            {/* Test AI Questions Button */}
            <div className="flex items-center justify-between pt-1" data-tour="test-ai-btn">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestAiQuestions}
                disabled={!outlineContent.trim() || isGeneratingPreview}
                className="border-primary/40 hover:bg-primary-light/10 text-primary"
              >
                <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isGeneratingPreview ? "animate-spin" : ""}`} />
                <span>{isGeneratingPreview ? "Đang gọi AI phân tích..." : "Kiểm tra & Tạo thử câu hỏi phản biện AI"}</span>
              </Button>
              <span className="text-xs text-text-muted">Kiểm tra trước câu hỏi Giám khảo AI sẽ đặt cho đề tài này</span>
            </div>

            {/* Preview Questions Display */}
            {previewError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{previewError}</span>
              </div>
            )}

            {previewQuestions.length > 0 && (
              <div className="p-4 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Câu hỏi phản biện đã được AI chuẩn bị riêng cho đề tài của bạn:
                  </span>
                  <Badge variant="success">AI Live</Badge>
                </div>
                <div className="space-y-2">
                  {previewQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-surface border border-border text-xs space-y-1">
                      <div className="font-semibold text-primary flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>
                          {q.judgeName || `Giám khảo ${idx + 1}`} ({q.judgeRole || "Phản biện"}):
                        </span>
                      </div>
                      <MathText text={q.questionText} className="text-foreground leading-relaxed pl-5 font-medium" />
                      {q.targetedFlaw && (
                        <div className="text-[11px] text-text-muted pl-5 italic">
                          Mục tiêu chất vấn: {q.targetedFlaw}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4" data-tour="start-btn">
          <p className="text-xs text-text-muted">Nhấn bắt đầu để cấp quyền Camera/Mic và bước vào khán phòng ảo 3D.</p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartRehearsal}
            disabled={!outlineContent.trim()}
            className="shadow-md"
          >
            <span>Vào Khán Phòng Luyện Tập</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
