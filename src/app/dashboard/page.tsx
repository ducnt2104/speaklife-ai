"use client";

import React from "react";
import Link from "next/link";
import { Play, BarChart3, Clock, Eye, Volume2, ShieldCheck, ArrowRight, Award, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
  const rehearsalHistory = [
    {
      id: "ses-101",
      title: "Bảo vệ Dự án KHKT & AI Đồng Nai 2026",
      scenario: "Bảo vệ dự án KHKT / STEM",
      score: 87,
      tier: "Xuất sắc",
      eyeContact: "81%",
      wpm: 132,
      fillers: 2,
      date: "07/11/2026"
    },
    {
      id: "ses-102",
      title: "Thuyết trình Địa lý Kinh tế TP. Biên Hòa",
      scenario: "Thuyết trình trên lớp",
      score: 79,
      tier: "Khá tốt",
      eyeContact: "74%",
      wpm: 126,
      fillers: 4,
      date: "05/11/2026"
    },
    {
      id: "ses-103",
      title: "English Debate: AI in Modern High Schools",
      scenario: "Hùng biện Tiếng Anh",
      score: 84,
      tier: "Khá tốt",
      eyeContact: "79%",
      wpm: 138,
      fillers: 3,
      date: "03/11/2026"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Student Profile & Quick Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-subtle p-6 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Bảng Tiến Độ Luyện Tập
            </h1>
            <Badge variant="info">Học sinh THPT</Badge>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Đội thi: <strong>SpeakLife AI</strong> • Trường THPT Tôn Đức Thắng, Xã Tà Lài, TP. Đồng Nai.
          </p>
        </div>

        <Link href="/setup">
          <Button variant="primary" size="md" className="shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Tạo buổi luyện mới</span>
          </Button>
        </Link>
      </div>

      {/* High-level Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-surface border-border">
          <div className="text-xs font-medium text-text-muted">Tổng buổi luyện</div>
          <div className="text-3xl font-bold font-mono text-foreground mt-2">12</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">+3 buổi tuần này</div>
        </Card>

        <Card className="p-5 bg-surface border-border">
          <div className="text-xs font-medium text-text-muted">Điểm MPRE trung bình</div>
          <div className="text-3xl font-bold font-mono text-primary mt-2">83.3</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">+18.5đ so với tuần đầu</div>
        </Card>

        <Card className="p-5 bg-surface border-border">
          <div className="text-xs font-medium text-text-muted">Giao tiếp mắt (Eye Contact)</div>
          <div className="text-3xl font-bold font-mono text-emerald-600 mt-2">78%</div>
          <div className="text-[11px] text-text-secondary mt-1">Chuẩn vàng: &gt; 75%</div>
        </Card>

        <Card className="p-5 bg-surface border-border">
          <div className="text-xs font-medium text-text-muted">Kiểm soát từ đệm (à, ừm)</div>
          <div className="text-3xl font-bold font-mono text-pink-600 mt-2">1.8</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Giảm 78% tần suất</div>
        </Card>
      </div>

      {/* Practice History List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Lịch Sử Các Buổi Luyện Tập</h2>
          <span className="text-xs text-text-muted font-mono">{rehearsalHistory.length} kết quả gần nhất</span>
        </div>

        <div className="space-y-3">
          {rehearsalHistory.map((item) => (
            <Card key={item.id} className="p-5 bg-surface hover:border-primary/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-foreground text-base">{item.title}</h3>
                  <Badge variant={item.score >= 85 ? "success" : "info"}>{item.tier}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                  <span>{item.scenario}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                  <span>•</span>
                  <span>Eye Contact: <strong className="text-foreground font-mono">{item.eyeContact}</strong></span>
                  <span>•</span>
                  <span>Tốc độ: <strong className="text-foreground font-mono">{item.wpm} WPM</strong></span>
                  <span>•</span>
                  <span>Từ đệm: <strong className="text-foreground font-mono">{item.fillers} từ</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-primary">{item.score}</div>
                  <div className="text-[10px] text-text-muted">/100 MPRE</div>
                </div>
                <Link href="/report">
                  <Button variant="outline" size="sm">
                    <span>Xem báo cáo</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
