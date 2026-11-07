"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Play, BarChart3, Clock, Eye, Volume2, ArrowRight, Award, Plus, Sparkles, LogIn, Inbox } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";

interface DashboardData {
  user: { displayName: string; email: string; role: string };
  stats: {
    totalSessions: number;
    completedSessions: number;
    totalPracticeMinutes: number;
    averageScore: number;
    bestScore: number;
    avgEyeContact: number;
    avgWpm: number;
    totalReports: number;
  };
  history: Array<{
    id: string;
    title: string;
    scenario: string;
    difficulty: string;
    status: string;
    durationSeconds: number;
    createdAt: string;
    report: {
      id: string;
      totalScore: number;
      tier: string;
      eyeContactRatio: number;
      wpm: number;
      fillerCount: number;
    } | null;
  }>;
}

function getTierBadgeVariant(tier: string): "success" | "info" | "warning" | "default" {
  if (tier === "Xuất sắc") return "success";
  if (tier === "Khá tốt") return "info";
  if (tier === "Cần rèn luyện") return "warning";
  return "default";
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Không tải được dữ liệu");
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, authLoading]);

  // Not authenticated — prompt login
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Đăng nhập để xem Tiến độ</h1>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          Bảng tiến độ lưu trữ lịch sử luyện tập, điểm số MPRE và gợi ý cải thiện cá nhân hóa. Đăng nhập hoặc tạo tài khoản để bắt đầu.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login">
            <Button variant="primary" size="lg">
              <LogIn className="w-4 h-4 mr-2" />
              <span>Đăng nhập</span>
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              <span>Tạo tài khoản mới</span>
            </Button>
          </Link>
        </div>
        <div className="pt-4">
          <Link href="/setup" className="text-xs text-text-muted hover:text-primary transition-colors">
            Hoặc tiếp tục luyện tập không cần đăng nhập →
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <div className="h-24 bg-surface-subtle rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-xl border border-border animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-surface rounded-xl border border-border animate-pulse" />
      </div>
    );
  }

  const stats = data?.stats;
  const history = data?.history || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-subtle p-6 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Bảng Tiến Độ Luyện Tập
            </h1>
            <Badge variant="info">
              {user?.role === "student" ? "Học sinh THPT" : user?.role || ""}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Xin chào, <strong>{user?.displayName}</strong>
          </p>
        </div>
        <Link href="/setup">
          <Button variant="primary" size="md" className="shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Tạo buổi luyện mới</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards — only show real data or zeros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-surface border-border">
          <div className="text-xs font-medium text-text-muted">Tổng buổi luyện</div>
          <div className="text-3xl font-bold font-mono text-foreground mt-2">
            {stats?.totalSessions || 0}
          </div>
          {(stats?.completedSessions || 0) > 0 && (
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              {stats?.completedSessions} buổi đã hoàn thành
            </div>
          )}
        </Card>

        <Card className="p-5 bg-surface border-border">
          <div className="text-xs font-medium text-text-muted">Điểm MPRE trung bình</div>
          <div className="text-3xl font-bold font-mono text-primary mt-2">
            {stats?.totalReports ? stats.averageScore : "—"}
          </div>
          {stats?.bestScore ? (
            <div className="text-[11px] text-text-muted font-medium mt-1">
              Cao nhất: {stats.bestScore}/100
            </div>
          ) : (
            <div className="text-[11px] text-text-muted mt-1">Chưa có báo cáo</div>
          )}
        </Card>

        <Card className="p-5 bg-surface border-border">
          <div className="text-xs font-medium text-text-muted">Giao tiếp mắt (Eye Contact)</div>
          <div className="text-3xl font-bold font-mono text-emerald-600 mt-2">
            {stats?.totalReports ? `${stats.avgEyeContact}%` : "—"}
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            {stats?.totalReports ? "Trung bình các buổi" : "Chưa có dữ liệu"}
          </div>
        </Card>

        <Card className="p-5 bg-surface border-border">
          <div className="text-xs font-medium text-text-muted">Tốc độ nói (WPM)</div>
          <div className="text-3xl font-bold font-mono text-pink-600 mt-2">
            {stats?.totalReports ? stats.avgWpm : "—"}
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            {stats?.totalReports ? "Trung bình các buổi" : "Chưa có dữ liệu"}
          </div>
        </Card>
      </div>

      {/* Practice History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Lịch Sử Các Buổi Luyện Tập</h2>
          {history.length > 0 && (
            <span className="text-xs text-text-muted font-mono">{history.length} kết quả</span>
          )}
        </div>

        {history.length === 0 ? (
          /* Empty State */
          <Card className="p-12 bg-surface text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
              Chưa có buổi luyện tập nào
            </h3>
            <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
              Bắt đầu buổi luyện tập đầu tiên để xem lịch sử và điểm số MPRE tại đây.
            </p>
            <Link href="/setup">
              <Button variant="primary" size="md">
                <Play className="w-4 h-4 fill-current mr-1.5" />
                <span>Bắt đầu luyện tập đầu tiên</span>
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Card
                key={item.id}
                className="p-5 bg-surface hover:border-primary/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-foreground text-base">
                      {item.title}
                    </h3>
                    {item.report && (
                      <Badge variant={getTierBadgeVariant(item.report.tier)}>
                        {item.report.tier}
                      </Badge>
                    )}
                    {!item.report && item.status === "active" && (
                      <Badge variant="warning">Đang luyện</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                    <span>{item.scenario}</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                    {item.report && (
                      <>
                        <span>•</span>
                        <span>
                          Eye Contact:{" "}
                          <strong className="text-foreground font-mono">
                            {item.report.eyeContactRatio}%
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Tốc độ:{" "}
                          <strong className="text-foreground font-mono">
                            {item.report.wpm} WPM
                          </strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {item.report && (
                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono text-primary">
                        {item.report.totalScore}
                      </div>
                      <div className="text-[10px] text-text-muted">/100 MPRE</div>
                    </div>
                    <Link href={`/report?id=${item.report.id}`}>
                      <Button variant="outline" size="sm">
                        <span>Xem báo cáo</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
