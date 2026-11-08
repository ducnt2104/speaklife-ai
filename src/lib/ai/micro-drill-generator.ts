/**
 * SpeakLife AI — AI Micro-Drill Generator
 * Generates personalized 30-second practice exercises based on
 * the most critical weaknesses detected in the presentation.
 */

import type { MPREEvaluationResult } from "@/lib/rubric/mpre-calculator";
import type { LoudnessMetrics } from "@/lib/audio/loudness-dynamics";

export interface MicroDrill {
  id: string;
  title: string;
  icon: string;
  durationSeconds: number;
  targetWeakness: string;
  instructions: string;
  technique: string;
  category: "filler" | "eye_contact" | "voice" | "loudness" | "content" | "reflex";
}

/**
 * Analyze MPRE results and loudness data to generate targeted micro-drills.
 * Returns top 3 most impactful exercises sorted by priority.
 */
export function generateMicroDrills(
  evaluation: MPREEvaluationResult,
  loudness?: LoudnessMetrics | null
): MicroDrill[] {
  const drills: Array<MicroDrill & { priority: number }> = [];

  // 1. Filler word drill
  if (evaluation.metricsSummary.fillerWordRatePerMinute > 1.5) {
    drills.push({
      id: "drill-filler-pause",
      title: "Ngắt Nhịp Có Ý Thức",
      icon: "🎯",
      durationSeconds: 30,
      targetWeakness: `Từ đệm quá nhiều (${evaluation.metricsSummary.fillerWordRatePerMinute} từ/phút)`,
      instructions: "Đọc to đoạn văn bên dưới. Mỗi khi bạn muốn nói 'à', 'ừm', hãy ĐẶT TAY LÊN BÀN và DỪNG hẳn 2 giây. Khoảng lặng mạnh hơn từ đệm.",
      technique: "Câu mẫu: 'Giải pháp của chúng em... (dừng 2s)... được chứng minh bởi 3 thực nghiệm... (dừng 2s)... với sai số dưới 5%.'",
      category: "filler",
      priority: evaluation.metricsSummary.fillerWordRatePerMinute > 3 ? 100 : 70,
    });
  }

  // 2. Eye contact drill
  if (evaluation.metricsSummary.eyeContactRatio < 60) {
    drills.push({
      id: "drill-eye-triangle",
      title: "Tam Giác Ánh Mắt",
      icon: "👁️",
      durationSeconds: 30,
      targetWeakness: `Giao tiếp mắt thấp (${evaluation.metricsSummary.eyeContactRatio}%)`,
      instructions: "Nhìn vào ĐIỂM TRÒN webcam trong 3 giây → Di chuyển mắt sang GÓC TRÁI màn hình 2 giây → GÓC PHẢI 2 giây → Quay lại webcam. Lặp lại 4 vòng.",
      technique: "Mẹo: Dán một sticker nhỏ màu đỏ cạnh webcam laptop. Nhìn vào sticker = nhìn vào mắt giám khảo.",
      category: "eye_contact",
      priority: evaluation.metricsSummary.eyeContactRatio < 40 ? 95 : 65,
    });
  }

  // 3. Voice speed drill
  const wpm = evaluation.metricsSummary.wpm;
  if (wpm < 110 || wpm > 155) {
    drills.push({
      id: "drill-metronome-speech",
      title: "Nói Theo Nhịp Đếm",
      icon: "🎵",
      durationSeconds: 30,
      targetWeakness: wpm < 110 ? `Nói quá chậm (${wpm} WPM)` : `Nói quá nhanh (${wpm} WPM)`,
      instructions: wpm < 110
        ? "Đọc to một đoạn trong bài thuyết trình. Đặt mục tiêu 2 từ/giây (120 WPM). Giữ năng lượng cao, không ngập ngừng."
        : "Đọc to một đoạn trong bài thuyết trình. Mỗi dấu chấm DỪNG 1.5 giây. Mỗi dấu phẩy DỪNG 0.5 giây. Đừng vội.",
      technique: wpm < 110
        ? "Ghi âm, so sánh: 30 giây ≈ 60 từ là chuẩn."
        : "Kỹ thuật 'Chunking': Chia câu thành 3-5 cụm từ, đọc từng cụm rõ ràng.",
      category: "voice",
      priority: Math.abs(wpm - 130) > 30 ? 85 : 55,
    });
  }

  // 4. Loudness dynamics drill
  if (loudness) {
    if (loudness.dynamicContrast < 2) {
      drills.push({
        id: "drill-vocal-dynamics",
        title: "Nhấn Nhá 3 Cường Độ",
        icon: "🔊",
        durationSeconds: 30,
        targetWeakness: `Giọng đơn điệu (contrast: ${loudness.dynamicContrast} dB)`,
        instructions: "Đọc câu mẫu 3 lần: Lần 1 THÌ THẦM → Lần 2 BÌNH THƯỜNG → Lần 3 MẠNH MẼ. Cảm nhận sự khác biệt.",
        technique: "Câu mẫu: 'Kết quả thực nghiệm cho thấy hiệu suất tăng 47% so với phương pháp truyền thống.' — Nhấn mạnh số '47%' ở lần 3.",
        category: "loudness",
        priority: 80,
      });
    }
    if (loudness.tooQuietPercent > 30) {
      drills.push({
        id: "drill-project-voice",
        title: "Phóng Chiếu Giọng Nói",
        icon: "📢",
        durationSeconds: 30,
        targetWeakness: `Nói quá nhỏ ${loudness.tooQuietPercent}% thời gian`,
        instructions: "Đứng cách tường 3 mét. Nói cho TƯỜNG nghe thấy. Không hét — chỉ dùng bụng đẩy hơi, mở miệng rộng hơn bình thường.",
        technique: "Hít sâu bằng bụng → Bắt đầu nói từ từ → Duy trì cường độ ổn định cả câu, KHÔNG giảm ở cuối câu.",
        category: "loudness",
        priority: 75,
      });
    }
  }

  // 5. Rebuttal reflex drill
  if (evaluation.metricsSummary.avgReactionSeconds > 5) {
    drills.push({
      id: "drill-3step-rebuttal",
      title: "Phản Biện 3 Bước Trong 10s",
      icon: "⚡",
      durationSeconds: 30,
      targetWeakness: `Phản xạ chậm (${evaluation.metricsSummary.avgReactionSeconds}s)`,
      instructions: "Nhờ bạn đọc 1 câu hỏi bất kỳ. Trong 10 giây: (1) Gật đầu + 'Em ghi nhận...' (2s) → (2) Nêu 1 số liệu/dẫn chứng (5s) → (3) Khẳng định giải pháp (3s).",
      technique: "Công thức vàng: 'Cảm ơn câu hỏi → Theo số liệu chúng em đo được → Vì vậy giải pháp vẫn khả thi vì...'",
      category: "reflex",
      priority: evaluation.metricsSummary.avgReactionSeconds > 7 ? 90 : 60,
    });
  }

  // 6. Content depth drill
  if (evaluation.dimensions.contentLogic.percentage < 65) {
    drills.push({
      id: "drill-evidence-sandwich",
      title: "Bánh Mì Dẫn Chứng",
      icon: "📊",
      durationSeconds: 30,
      targetWeakness: `Nội dung chưa đủ sâu (${evaluation.dimensions.contentLogic.score}/${evaluation.dimensions.contentLogic.maxPoints}đ)`,
      instructions: "Chọn 1 luận điểm yếu nhất. Áp dụng cấu trúc: NHẬN ĐỊNH → SỐ LIỆU → NGUỒN → KẾT LUẬN. Nói liền mạch trong 30 giây.",
      technique: "Ví dụ: 'Hiệu suất tăng (nhận định) — Cụ thể từ 62% lên 89% (số liệu) — Theo kết quả 50 lần thử nghiệm tại phòng lab (nguồn) — Chứng tỏ giải pháp đáng tin cậy (kết luận).'",
      category: "content",
      priority: 50,
    });
  }

  // Sort by priority, return top 3
  drills.sort((a, b) => b.priority - a.priority);
  return drills.slice(0, 3).map(({ priority, ...drill }) => drill);
}
