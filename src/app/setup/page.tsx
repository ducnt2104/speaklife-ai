"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Cpu, Globe, Award, FileText, ArrowRight, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { PRACTICE_SCENARIOS, DIFFICULTY_TIERS } from "@/lib/constants/scenarios";

export default function SetupPage() {
  const router = useRouter();

  const [selectedScenario, setSelectedScenario] = useState<string>("stem_khkt");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("standard");
  const [outlineTitle, setOutlineTitle] = useState<string>("");
  const [outlineContent, setOutlineContent] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartRehearsal = () => {
    // Store rehearsal settings in session storage for the live rehearsal room
    sessionStorage.setItem("speaklife_scenario", selectedScenario);
    sessionStorage.setItem("speaklife_difficulty", selectedDifficulty);
    sessionStorage.setItem("speaklife_outline_title", outlineTitle);
    sessionStorage.setItem("speaklife_outline_content", outlineContent);

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
        <div>
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
        <div>
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
                  <div className="text-xs text-primary font-medium mb-2">{tier.judgeName} • {tier.judgeTitle}</div>
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
        <Card className="p-6 bg-surface">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-foreground text-base">3. Dàn Ý / Đề Cương Bài Nói</h3>
              <p className="text-xs text-text-muted mt-0.5">Dán nội dung bài thuyết trình hoặc ghi chú để AI hiểu cấu trúc bài nói.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chống Prompt Injection & Không lưu trữ</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Tiêu đề bài thuyết trình</label>
              <input
                type="text"
                value={outlineTitle}
                onChange={(e) => setOutlineTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nhập tiêu đề đề tài..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Nội dung tóm tắt / Các luận điểm chính</label>
              <textarea
                value={outlineContent}
                onChange={(e) => setOutlineContent(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent leading-relaxed"
                placeholder="Dán tóm tắt mở bài, các luận cứ chính và kết luận..."
              />
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-text-muted">
            Nhấn bắt đầu để cấp quyền Camera/Mic và bước vào khán phòng ảo 3D.
          </p>
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
