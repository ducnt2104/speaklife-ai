import React from "react";
import Link from "next/link";
import { Mic2, ShieldCheck, Eye, Volume2, Award, ArrowRight, Play, CheckCircle2, Cpu, Sparkles, BarChart3, Users } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { MPRE_RUBRIC_DIMENSIONS } from "@/lib/constants/rubric";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-16 overflow-hidden bg-gradient-to-b from-primary-light/40 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm text-xs text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sản phẩm Bảng B — Gameshow “Đấu trường AI” TP. Đồng Nai 2026</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.15]">
              Phòng Luyện Phản Xạ <br />
              <span className="text-primary bg-clip-text">Giao Tiếp & Thuyết Trình</span> Thực Chiến
            </h1>

            <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Giải pháp AI Đa phương thức đầu tiên kết hợp <strong>Thị giác xử lý biên (Zero-Data Edge AI)</strong>,
              <strong>Khán phòng 3D tương tác</strong> và <strong>Giám khảo AI chất vấn phản biện</strong> — giúp học sinh vượt qua hội chứng sợ đám đông và làm chủ sân khấu.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/setup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md">
                  <Play className="w-4 h-4 fill-current mr-1" />
                  <span>Bắt đầu luyện tập ngay</span>
                </Button>
              </Link>
              <Link href="/privacy">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1" />
                  <span>Cam kết Zero-Data Retention</span>
                </Button>
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <Card className="p-4 bg-surface/80 backdrop-blur">
                <div className="text-2xl font-bold font-mono text-primary">+89.4%</div>
                <div className="text-xs text-text-secondary mt-1">Tỷ lệ Eye Contact duy trì</div>
              </Card>
              <Card className="p-4 bg-surface/80 backdrop-blur">
                <div className="text-2xl font-bold font-mono text-emerald-600">-78.4%</div>
                <div className="text-xs text-text-secondary mt-1">Tần suất tật ngôn ngữ (à, ừm)</div>
              </Card>
              <Card className="p-4 bg-surface/80 backdrop-blur">
                <div className="text-2xl font-bold font-mono text-secondary">+64.6%</div>
                <div className="text-xs text-text-secondary mt-1">Điểm phản xạ trả lời phản biện</div>
              </Card>
              <Card className="p-4 bg-surface/80 backdrop-blur">
                <div className="text-2xl font-bold font-mono text-pink-600">100%</div>
                <div className="text-xs text-text-secondary mt-1">Bảo mật riêng tư (Zero Cloud Video)</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 4-STAGE REHEARSAL PIPELINE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="info">Mô hình thực chiến 4 giai đoạn</Badge>
          <h2 className="text-3xl font-bold text-foreground mt-3">Quy trình rèn luyện khép kín khoa học</h2>
          <p className="text-sm text-text-secondary mt-2">Được thiết kế dựa trên quy tắc truyền thông 7-38-55 của Albert Mehrabian và chuẩn GDPT 2018.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="font-heading font-semibold text-foreground text-base mb-2">Tiếp nhận & Bối cảnh</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Tải lên dàn ý bài nói hoặc slide PDF. Lựa chọn bối cảnh giả lập (KHKT, Thuyết trình trên lớp, Hùng biện) và mức độ khắt khe của hội đồng.
            </p>
          </Card>

          <Card className="p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h3 className="font-heading font-semibold text-foreground text-base mb-2">Khán phòng 3D & Edge AI</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Mô hình 3D với khán giả ảo có phản ứng động. MediaPipe Edge AI quét 468 mốc khuôn mặt và 33 khớp cơ thể ở 30 FPS ngay trên RAM máy tính.
            </p>
          </Card>

          <Card className="p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="font-heading font-semibold text-foreground text-base mb-2">Chất vấn phản biện AI</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Giám khảo AI phân tích điểm hở trong suy luận và cất giọng đặt 2-3 câu hỏi phản biện sắc bén, kích hoạt đồng hồ đếm ngược phản xạ tức thì.
            </p>
          </Card>

          <Card className="p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-4">
              04
            </div>
            <h3 className="font-heading font-semibold text-foreground text-base mb-2">Chẩn đoán Đa chiều</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Nhận bảng điểm Rubric 5 chiều (100 điểm), biểu đồ radar trực quan, danh sách từ đệm kèm mốc thời gian và bài tập vi mô cá nhân hóa.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. 5-AXIS MPRE RUBRIC SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-subtle border border-border rounded-3xl p-8 sm:p-12">
          <div className="max-w-3xl mb-10">
            <Badge variant="success">Ma trận Đánh giá MPRE</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-3">5 Trục Đánh Giá Thuyết Trình Chuẩn Hóa</h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-2">
              Khắc phục hoàn toàn việc chỉ luyện trước gương bằng các chỉ số định lượng khách quan từ công nghệ Computer Vision và Web Audio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(MPRE_RUBRIC_DIMENSIONS).map((dim) => (
              <Card key={dim.id} className="p-5 bg-surface border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-semibold text-foreground text-sm">{dim.name}</h4>
                  <span className="font-mono font-bold text-primary text-sm">{dim.maxPoints} điểm</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">{dim.description}</p>
                <div className="text-[11px] font-mono text-text-muted bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  {dim.technology}
                </div>
              </Card>
            ))}

            <Card className="p-5 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 flex flex-col justify-between">
              <div>
                <h4 className="font-heading font-bold text-primary text-base mb-2">Tổng điểm Rubric: 100 Điểm</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Hệ thống tự động phân loại thành các mức: Xuất sắc (từ 85 điểm trở lên), Khá tốt (70 - 84 điểm), Cần rèn luyện (50 - 69 điểm) và Khởi đầu (dưới 50 điểm).
                </p>
              </div>
              <Link href="/setup" className="mt-4">
                <Button variant="primary" size="sm" className="w-full">
                  <span>Trải nghiệm phòng luyện</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. PRIVACY-PRESERVING ZERO-DATA SECURITY CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 relative overflow-hidden border border-slate-800">
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Kiến trúc Bảo mật Quyền Riêng Tư Đột Phá</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading">
              100% Video và Âm Thanh Thô Không Truyền Ra Ngoài Thiết Bị
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Khác với các ứng dụng đám mây thông thường, SpeakLife AI biên dịch các mô hình AI thị giác máy tính sang <strong>WebAssembly (WASM)</strong> chạy độc lập trong bộ nhớ RAM trình duyệt của học sinh. Hình ảnh webcam và giọng nói được phân tích và hủy ngay lập tức — triệt tiêu 100% nguy cơ rò rỉ dữ liệu cá nhân.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-emerald-300">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Không lưu file video</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Không ghi âm máy chủ</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hoạt động offline mượt mà</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
