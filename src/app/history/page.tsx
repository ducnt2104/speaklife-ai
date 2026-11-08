"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Badge, Button, EmptyState, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  ArrowRight,
  PlusCircle,
  LogIn,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface SessionItem {
  id: string;
  title: string;
  scenario: string;
  difficulty: string;
  status: string;
  createdAt: string;
  durationSeconds: number;
  reportId?: string | null;
  metrics?: { overallScore?: number };
  tier?: string | null;
}

const scenarioLabels: Record<string, string> = {
  stem_khkt: "Bảo vệ Đề tài KHKT/STEM",
  debate: "Tranh biện Học thuật",
  interview: "Phỏng vấn Học bổng",
  general_presentation: "Thuyết trình Đại chúng",
  khkt: "Bảo vệ Đề tài KHKT",
  stem: "Thuyết trình STEM",
  custom: "Tùy biến",
};

const difficultyLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  lenient: { label: "Dễ / Khởi động", variant: "secondary" },
  standard: { label: "Tiêu chuẩn", variant: "default" },
  balanced: { label: "Cân bằng", variant: "default" },
  adversarial: { label: "Phản biện gắt", variant: "destructive" },
  easy: { label: "Dễ", variant: "secondary" },
  medium: { label: "Trung bình", variant: "default" },
  hard: { label: "Khó", variant: "destructive" },
};

export default function HistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    fetch("/api/practice/sessions")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions || []);
      })
      .catch((err) => {
        console.error("Failed to load history:", err);
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <EmptyState
          icon={<LogIn className="w-8 h-8" />}
          title="Đăng nhập để xem lịch sử"
          description="Lịch sử các phiên luyện tập và kết quả chẩn đoán MPRE được lưu an toàn trên máy chủ cho tài khoản của bạn."
          actionLabel="Đăng nhập ngay"
          onAction={() => router.push("/login")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Nhật ký rèn luyện</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Lịch Sử Luyện Tập
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Theo dõi tiến trình hoàn thiện kỹ năng thuyết trình và phản biện qua các phiên thực chiến.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => router.push("/setup")}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Luyện tập mới</span>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="Chưa có phiên luyện tập nào"
          description="Hãy bắt đầu buổi luyện tập đầu tiên với AI để ghi nhận phản xạ ngôn ngữ và nhận báo cáo MPRE."
          actionLabel="Bắt đầu ngay"
          onAction={() => router.push("/setup")}
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((item) => {
            const diff =
              difficultyLabels[item.difficulty] || {
                label: item.difficulty,
                variant: "outline" as const,
              };
            const scenario = scenarioLabels[item.scenario] || item.scenario;
            const score = item.metrics?.overallScore;
            const dateStr = new Date(item.createdAt).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={item.id}
                className="p-5 border border-border hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-base">
                        {item.title || "Phiên luyện tập không đặt tên"}
                      </span>
                      <Badge variant={diff.variant}>{diff.label}</Badge>
                      {item.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Hoàn thành
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Đang diễn ra
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {scenario}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr}
                      </span>
                      {item.durationSeconds > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.round(item.durationSeconds / 60)} phút {item.durationSeconds % 60}s
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                    {score != null ? (
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">
                          {score}
                          <span className="text-xs font-normal text-text-muted">/100</span>
                        </div>
                        <div className="text-[11px] font-medium text-text-muted">
                          {item.tier || "Điểm MPRE"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted italic">Chưa chấm điểm</div>
                    )}

                    {item.reportId ? (
                      <Link
                        href={`/report?id=${item.reportId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover px-3 py-2 rounded-lg bg-primary-light hover:bg-primary-light/80 transition-colors"
                      >
                        <span>Xem Báo cáo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/setup")}
                      >
                        Luyện lại
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
