"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Award, Eye, Volume2, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, Download, RotateCcw, Sparkles, Loader2, Mic, Target, Timer, FileDown } from "lucide-react";
import { Button, Card, Badge, MathText } from "@/components/ui";
import { MPRERadarChart } from "@/components/charts/MPRERadarChart";
import { MPREEvaluationResult } from "@/lib/rubric/mpre-calculator";

function ReportContent() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<MPREEvaluationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [fillerInstances, setFillerInstances] = useState<Array<{ word: string; timestampSec: number; contextSnippet: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reportId = searchParams.get("id");

    if (reportId) {
      // Fetch from server API by ID
      fetch(`/api/report?id=${encodeURIComponent(reportId)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Không tải được báo cáo");
          return res.json();
        })
        .then((data) => setReport(data))
        .catch(() => {
          // Fallback to sessionStorage
          loadFromSession();
        })
        .finally(() => setIsLoading(false));
    } else {
      loadFromSession();
      setIsLoading(false);
    }
  }, [searchParams]);

  function loadFromSession() {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("speaklife_final_report");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Extract enriched data if present
          if (parsed.aiAnalysis) {
            setAiAnalysis(parsed.aiAnalysis);
          }
          if (parsed.fillerInstances) {
            setFillerInstances(parsed.fillerInstances);
          }
          setReport(parsed);
          return;
        } catch {
          // Invalid data
        }
      }
    }
    setReport(null);
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-text-secondary mt-4">Đang tải báo cáo...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <Award className="w-8 h-8 text-primary/60" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">Chưa có báo cáo nào</h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto">
          Hoàn thành một buổi luyện tập thuyết trình để nhận báo cáo chẩn đoán MPRE 5 chiều tại đây.
        </p>
        <Link href="/setup">
          <Button variant="primary" size="md">
            <span>Bắt đầu luyện tập</span>
            <ArrowLeft className="w-4 h-4 ml-1.5 rotate-180" />
          </Button>
        </Link>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-200 dark:border-emerald-800">
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
        <Card className="lg:col-span-5 p-8 bg-gradient-to-br from-surface to-violet-50/40 dark:to-violet-950/20 border-border flex flex-col justify-between">
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
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Độ bao phủ dữ liệu hạn chế, điểm số mang tính tham khảo.</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* AI Content Analysis — chi tiết trích dẫn từ Gemini */}
      {aiAnalysis && aiAnalysis.contentAnalysis && (
        <Card className="p-6 bg-surface border-border space-y-4">
          <h3 className="font-heading font-bold text-foreground text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Phân Tích Nội Dung Chi Tiết (AI)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {aiAnalysis.contentAnalysis.structureAssessment && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1.5">Bố cục (Mở - Thân - Kết)</div>
                <p className="text-text-secondary leading-relaxed">{aiAnalysis.contentAnalysis.structureAssessment}</p>
              </div>
            )}
            {aiAnalysis.contentAnalysis.evidenceQuality && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">Dẫn chứng & Số liệu</div>
                <p className="text-text-secondary leading-relaxed">{aiAnalysis.contentAnalysis.evidenceQuality}</p>
              </div>
            )}
            {aiAnalysis.contentAnalysis.logicFlaws && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="font-semibold text-amber-700 dark:text-amber-400 mb-1.5">Lỗi ngụy biện / Luận điểm yếu</div>
                <p className="text-text-secondary leading-relaxed">{aiAnalysis.contentAnalysis.logicFlaws}</p>
              </div>
            )}
            {aiAnalysis.contentAnalysis.depthAssessment && (
              <div className="bg-violet-50 dark:bg-violet-950/20 p-3.5 rounded-xl border border-violet-200 dark:border-violet-800">
                <div className="font-semibold text-violet-700 dark:text-violet-400 mb-1.5">Chiều sâu nội dung</div>
                <p className="text-text-secondary leading-relaxed">{aiAnalysis.contentAnalysis.depthAssessment}</p>
              </div>
            )}
          </div>

          {/* Top Strengths / Weaknesses from AI */}
          {(aiAnalysis.topStrengths?.length > 0 || aiAnalysis.topWeaknesses?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {aiAnalysis.topStrengths?.length > 0 && (
                <div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Điểm mạnh nổi bật
                  </div>
                  <ul className="space-y-1.5">
                    {aiAnalysis.topStrengths.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-text-secondary bg-emerald-50/50 dark:bg-emerald-950/10 px-3 py-2 rounded-lg border border-emerald-100 dark:border-emerald-900">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiAnalysis.topWeaknesses?.length > 0 && (
                <div>
                  <div className="font-semibold text-amber-600 dark:text-amber-400 text-xs mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Cần cải thiện
                  </div>
                  <ul className="space-y-1.5">
                    {aiAnalysis.topWeaknesses.map((w: string, i: number) => (
                      <li key={i} className="text-xs text-text-secondary bg-amber-50/50 dark:bg-amber-950/10 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-900">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Filler Words Detail — danh sách từ đệm kèm mốc thời gian */}
      {fillerInstances.length > 0 && (
        <Card className="p-6 bg-surface border-border">
          <h3 className="font-heading font-bold text-foreground text-lg flex items-center gap-2 mb-3">
            <Volume2 className="w-5 h-5 text-amber-500" />
            <span>Chi Tiết Từ Đệm Phát Hiện ({fillerInstances.length} lần)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {fillerInstances.slice(0, 15).map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 text-xs">
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">{f.word}</span>
                <span className="text-text-muted">
                  phút {Math.floor(f.timestampSec / 60)}:{String(f.timestampSec % 60).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
          {fillerInstances.length > 15 && (
            <p className="text-[11px] text-text-muted mt-2">... và {fillerInstances.length - 15} lần nữa</p>
          )}
        </Card>
      )}

      {/* Loudness & Vocal Dynamics Analysis */}
      {aiAnalysis && aiAnalysis.loudnessFeedback && (
        <Card className="p-6 bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800">
          <h3 className="font-heading font-bold text-foreground text-lg flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>Phân Tích Động Lực Học Âm Lượng</span>
            {aiAnalysis.loudnessScore !== undefined && (
              <Badge variant={aiAnalysis.loudnessScore >= 7 ? "success" : aiAnalysis.loudnessScore >= 4 ? "warning" : "danger"} className="ml-auto text-xs px-2.5 py-0.5">
                {aiAnalysis.loudnessScore}/10
              </Badge>
            )}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {aiAnalysis.loudnessAvgDbfs !== undefined && (
              <div className="bg-surface p-3 rounded-xl border border-cyan-100 dark:border-cyan-800 text-center">
                <div className="text-xs text-text-muted mb-1">Trung bình dBFS</div>
                <div className="font-mono font-bold text-lg text-foreground">{typeof aiAnalysis.loudnessAvgDbfs === 'number' ? aiAnalysis.loudnessAvgDbfs.toFixed(1) : aiAnalysis.loudnessAvgDbfs}</div>
              </div>
            )}
            {aiAnalysis.loudnessDynamicContrast !== undefined && (
              <div className="bg-surface p-3 rounded-xl border border-cyan-100 dark:border-cyan-800 text-center">
                <div className="text-xs text-text-muted mb-1">Độ biến thiên</div>
                <div className="font-mono font-bold text-lg text-foreground">{typeof aiAnalysis.loudnessDynamicContrast === 'number' ? aiAnalysis.loudnessDynamicContrast.toFixed(2) : aiAnalysis.loudnessDynamicContrast}</div>
              </div>
            )}
            {aiAnalysis.loudnessOptimalPercent !== undefined && (
              <div className="bg-surface p-3 rounded-xl border border-cyan-100 dark:border-cyan-800 text-center">
                <div className="text-xs text-text-muted mb-1">Vùng tối ưu</div>
                <div className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">{typeof aiAnalysis.loudnessOptimalPercent === 'number' ? aiAnalysis.loudnessOptimalPercent.toFixed(0) : aiAnalysis.loudnessOptimalPercent}%</div>
              </div>
            )}
          </div>
          <p className="text-xs text-text-secondary leading-relaxed bg-surface p-3 rounded-xl border border-cyan-100 dark:border-cyan-800">
            {aiAnalysis.loudnessFeedback}
          </p>
        </Card>
      )}

      {/* AI Micro-Drills — Bài tập vi mô 30 giây khắc phục lỗi */}
      {aiAnalysis && aiAnalysis.microDrills && aiAnalysis.microDrills.length > 0 && (
        <Card className="p-6 bg-orange-50/60 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <h3 className="font-heading font-bold text-foreground text-lg flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span>Bài Tập Vi Mô AI (Micro-Drills 30s)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiAnalysis.microDrills.map((drill: any, i: number) => (
              <div key={i} className="bg-surface p-4 rounded-xl border border-orange-100 dark:border-orange-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded-full">#{i + 1}</span>
                  <span className="text-sm font-semibold text-foreground">{drill.title}</span>
                </div>
                <div className="text-[11px] text-text-muted">
                  Mục tiêu: <span className="text-orange-600 dark:text-orange-400 font-medium">{drill.targetWeakness}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{drill.instructions}</p>
                {drill.technique && (
                  <div className="text-[11px] text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 px-2 py-1 rounded-md">
                    Kỹ thuật: {drill.technique}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Timer className="w-3 h-3" />
                  <span>{drill.durationSeconds || 30}s</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Recommendations */}
      <Card className="p-6 bg-violet-50/60 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800">
        <h4 className="font-heading font-bold text-primary text-base flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Kế Hoạch Cải Thiện</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report.keyRecommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-surface p-3.5 rounded-xl border border-violet-100 dark:border-violet-800 text-xs text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <MathText text={rec} className="leading-relaxed" inline />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-text-secondary mt-4">Đang tải báo cáo...</p>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
