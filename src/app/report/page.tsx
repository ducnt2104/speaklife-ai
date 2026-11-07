"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Eye, Volume2, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, Download, RotateCcw, Sparkles } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { MPRERadarChart } from "@/components/charts/MPRERadarChart";
import { MPREEvaluationResult, calculateMPREScore } from "@/lib/rubric/mpre-calculator";

export default function ReportPage() {
  const [report, setReport] = useState<MPREEvaluationResult | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("speaklife_final_report");
      if (stored) {
        try {
          setReport(JSON.parse(stored));
          return;
        } catch {
          // Fallback to default calculated demo report
        }
      }
      // Default high quality demo report
      const defaultReport = calculateMPREScore({
        durationSeconds: 195,
        totalWords: 430,
        faceDetectedFrames: 5800,
        totalAnalyzedFrames: 5800,
        eyeContactFrames: 4640, // 80%
        shoulderTiltVariance: 4,
        averageRmsDecibels: -18,
        pitchF0StdDev: 16,
        fillerWordCount: 2,
        aiContentScore: 19,
        rebuttalRounds: [
          { reactionTimeSeconds: 2.8, score: 14 },
          { reactionTimeSeconds: 3.2, score: 13 }
        ]
      });
      setReport(defaultReport);
    }
  }, []);

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-text-secondary">Đang tổng hợp dữ liệu chẩn đoán...</p>
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Report Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Giai đoạn 4 — Báo cáo Chẩn đoán Đa chiều MPRE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Kết Quả Luyện Tập Thuyết Trình
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Đánh giá toàn diện theo Ma trận Chuẩn hóa 5 Chiều — Bảng B Hội thi Đấu trường AI 2026.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
            <Download className="w-4 h-4 mr-1.5" />
            <span>Xuất PDF Báo cáo</span>
          </Button>
          <Link href="/setup" className="print:hidden">
            <Button variant="primary" size="sm">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              <span>Luyện lại bài mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Score Grid: Radar Chart + Total Score Badge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Total Score & Tier (5 Cols) */}
        <Card className="lg:col-span-5 p-8 bg-gradient-to-br from-surface to-violet-50/40 border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-text-muted">Tổng Điểm MPRE</span>
              <Badge variant={report.totalScore >= 80 ? "success" : "warning"} className="text-xs px-3 py-1">
                Hạng: {report.tier}
              </Badge>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-6xl font-extrabold font-mono text-primary">{report.totalScore}</span>
              <span className="text-2xl font-mono text-text-muted">/100</span>
            </div>

            <p className="text-xs text-text-secondary mt-3 leading-relaxed">
              Điểm số được tổng hợp độc lập từ <strong>Thị giác máy tính (25đ)</strong>, <strong>Ngữ âm (20đ)</strong>, <strong>Tật ngôn ngữ (15đ)</strong>, <strong>Nội dung (20đ)</strong> và <strong>Phản biện AI (20đ)</strong>.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-mono font-bold text-base text-foreground">{report.metricsSummary.eyeContactRatio}%</div>
              <div className="text-[11px] text-text-muted mt-0.5">Eye Contact</div>
            </div>
            <div>
              <div className="font-mono font-bold text-base text-foreground">{report.metricsSummary.wpm}</div>
              <div className="text-[11px] text-text-muted mt-0.5">Tốc độ (WPM)</div>
            </div>
            <div>
              <div className="font-mono font-bold text-base text-foreground">{report.metricsSummary.avgReactionSeconds}s</div>
              <div className="text-[11px] text-text-muted mt-0.5">Phản xạ phản biện</div>
            </div>
          </div>
        </Card>

        {/* 5-Axis Radar Chart (7 Cols) */}
        <Card className="lg:col-span-7 p-6 bg-surface flex flex-col items-center">
          <h3 className="font-heading font-semibold text-foreground text-sm self-start mb-2">
            Biểu Đồ Radar Năng Lực 5 Chiều
          </h3>
          <MPRERadarChart dimensions={report.dimensions} className="w-full" />
        </Card>
      </div>

      {/* Detailed Rubric Dimension Cards */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-foreground text-lg">Chẩn Đoán Chi Tiết Từng Trục Năng Lực</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(report.dimensions).map(([key, dim]) => (
            <Card key={key} className="p-5 bg-surface border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-heading font-semibold text-foreground text-sm capitalize">
                    {key === "bodyLanguage" && "1. Ngôn ngữ cơ thể & Ánh mắt"}
                    {key === "voiceProsody" && "2. Giọng nói & Tiết tấu âm thanh"}
                    {key === "fillerWords" && "3. Kiểm soát tật ngôn ngữ"}
                    {key === "contentLogic" && "4. Chiều sâu nội dung & Lập luận"}
                    {key === "rebuttalReflex" && "5. Phản xạ phản biện đối đáp"}
                  </h4>
                  <span className="font-mono font-bold text-primary text-sm">{dim.score}/{dim.maxPoints}đ</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{dim.benchmarkFeedback}</p>
              </div>

              {dim.hasInsufficientData && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Độ bao phủ dữ liệu hạn chế, điểm số mang tính tham khảo.</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Actionable Micro-Drills Recommendation Box */}
      <Card className="p-6 bg-violet-50/60 border-violet-200">
        <h4 className="font-heading font-bold text-primary text-base flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Kế Hoạch Cải Thiện & Bài Tập Vi Mô (Micro-Drills)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report.keyRecommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-surface p-3.5 rounded-xl border border-violet-100 text-xs text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
