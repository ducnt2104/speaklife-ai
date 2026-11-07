"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, Cpu, EyeOff, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

export default function PrivacyPage() {
  const [isPurging, setIsPurging] = useState(false);
  const [isPurged, setIsPurged] = useState(false);

  const handlePurgeAllData = () => {
    setIsPurging(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
      }
      setIsPurging(false);
      setIsPurged(true);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Privacy Center Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tiêu chuẩn Bảo mật Quyền Riêng tư Học đường</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Kiến Trúc Bảo Mật Zero-Data Retention (ZDR)
        </h1>
        <p className="text-sm text-text-secondary mt-2 leading-relaxed">
          SpeakLife AI được xây dựng với triết lý <strong>Bảo vệ Quyền Riêng Tư Tối Thượng</strong> cho học sinh và nhà trường. Chúng tôi giải quyết triệt để rào cản e ngại mở Camera và Microphone trên môi trường trực tuyến.
        </p>
      </div>

      {/* 3 Core Zero-Data Invariants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-surface border-border flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-foreground text-base mb-2">0% Video Thô Gửi Lên Đám Mây</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Mô hình Google MediaPipe Face Mesh và Pose được biên dịch sang WebAssembly (WASM) chạy 100% trên RAM máy tính của học sinh. Hình ảnh webcam được xử lý theo từng frame 33ms và giải phóng ngay lập tức.
            </p>
          </div>
          <div className="mt-4 text-[11px] font-mono text-emerald-600 font-medium">RAM-Only WebAssembly</div>
        </Card>

        <Card className="p-6 bg-surface border-border flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-foreground text-base mb-2">0% Ghi Âm Giọng Nói</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Web Audio API trích xuất trực tiếp các tham số âm học (RMS dB, F0 Pitch) trên luồng trình duyệt. Tuyệt đối không lưu file .wav hay .mp3 nào trên máy chủ hoặc bên thứ ba.
            </p>
          </div>
          <div className="mt-4 text-[11px] font-mono text-pink-600 font-medium">Local Web Audio API</div>
        </Card>

        <Card className="p-6 bg-surface border-border flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-foreground text-base mb-2">Chỉ Lưu Điểm Định Lượng</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Dữ liệu lưu trữ chỉ bao gồm các chỉ số thống kê số học (tỷ lệ % eye contact, WPM, điểm số 5 trục). Học sinh có toàn quyền xóa vĩnh viễn dữ liệu bất kỳ lúc nào.
            </p>
          </div>
          <div className="mt-4 text-[11px] font-mono text-violet-600 font-medium">Data Minimization</div>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card className="p-6 bg-surface">
        <h3 className="font-heading font-bold text-foreground text-base mb-4">
          Bảng So Sánh Quyền Riêng Tư với Các Nền Tảng Khác
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-subtle text-text-secondary border-b border-border">
              <tr>
                <th className="p-3">Tiêu chí bảo mật</th>
                <th className="p-3 text-primary font-bold">SpeakLife AI</th>
                <th className="p-3">App họp trực tuyến (Zoom/Teams)</th>
                <th className="p-3">App AI đám mây thông thường</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-3 font-medium text-foreground">Xử lý hình ảnh Webcam</td>
                <td className="p-3 text-emerald-600 font-bold">100% Cục bộ trên RAM máy tính</td>
                <td className="p-3 text-text-secondary">Truyền qua máy chủ trung gian</td>
                <td className="p-3 text-text-secondary">Tải toàn bộ video lên server</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Lưu trữ giọng nói thô</td>
                <td className="p-3 text-emerald-600 font-bold">KHÔNG LƯU (0 byte)</td>
                <td className="p-3 text-text-secondary">Có thể ghi hình lên Cloud</td>
                <td className="p-3 text-text-secondary">Lưu để huấn luyện mô hình</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Quyền xóa dữ liệu vĩnh viễn</td>
                <td className="p-3 text-emerald-600 font-bold">1-Click Xóa Sạch Ngay Lập Tức</td>
                <td className="p-3 text-text-secondary">Phải gửi yêu cầu hỗ trợ</td>
                <td className="p-3 text-text-secondary">Chính sách lưu trữ 30-90 ngày</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Permanent Data Purge Control */}
      <Card className="p-6 bg-rose-50/50 border-rose-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-heading font-bold text-rose-900 text-base flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Xóa Vĩnh Viễn Toàn Bộ Dữ Liệu Luyện Tập (Data Purge)</span>
            </h4>
            <p className="text-xs text-rose-800/80 mt-1 max-w-xl leading-relaxed">
              Thực hiện xóa toàn bộ lịch sử điểm số, dàn ý bài thuyết trình và dữ liệu tạm thời trên trình duyệt của bạn. Hành động này không thể hoàn tác.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handlePurgeAllData}
            isLoading={isPurging}
            disabled={isPurged}
          >
            {isPurged ? "Đã xóa sạch dữ liệu" : "Xóa vĩnh viễn dữ liệu"}
          </Button>
        </div>
        {isPurged && (
          <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Toàn bộ dữ liệu luyện tập và bộ nhớ đệm đã được xóa sạch hoàn toàn khỏi thiết bị.</span>
          </div>
        )}
      </Card>
    </div>
  );
}
