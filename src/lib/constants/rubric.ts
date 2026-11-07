// SpeakLife AI — Multimodal Presentation Reflex Engine (MPRE) Rubric Constants
// Standard: Gameshow "Đấu trường AI" TP. Đồng Nai 2026 (Bảng B - THPT)

export interface RubricDimension {
  id: string;
  name: string;
  maxPoints: number;
  weight: number; // percentage
  technology: string;
  description: string;
  thresholds: {
    excellent: { min: number; description: string };
    proficient: { min: number; description: string };
    developing: { min: number; description: string };
    needsImprovement: { min: number; description: string };
  };
}

export const MPRE_RUBRIC_DIMENSIONS: Record<string, RubricDimension> = {
  bodyLanguage: {
    id: "bodyLanguage",
    name: "Ngôn ngữ cơ thể & Ánh mắt",
    maxPoints: 25,
    weight: 0.25,
    technology: "MediaPipe Face Mesh (468) & Pose (33) via WASM",
    description: "Đo lường tỷ lệ duy trì giao tiếp mắt (eye contact), độ thẳng của tư thế và cử chỉ tay.",
    thresholds: {
      excellent: { min: 22, description: "Duy trì eye contact > 75%, tư thế đĩnh đạc, cử chỉ tay linh hoạt tự nhiên." },
      proficient: { min: 18, description: "Eye contact 60-74%, tư thế ổn định, cử chỉ tay vừa phải." },
      developing: { min: 13, description: "Eye contact 40-59%, thỉnh thoảng liếc nhìn ghi chú hoặc trần nhà." },
      needsImprovement: { min: 0, description: "Eye contact < 40%, tư thế co rúm hoặc đung đưa liên tục." }
    }
  },
  voiceProsody: {
    id: "voiceProsody",
    name: "Giọng nói & Tiết tấu âm thanh",
    maxPoints: 20,
    weight: 0.2,
    technology: "Web Audio API (RMS Decibels & Pitch F0 Engine)",
    description: "Tốc độ phát âm (WPM), cao độ âm thanh biểu cảm, âm lượng rõ ràng và nhịp ngắt nghỉ.",
    thresholds: {
      excellent: { min: 18, description: "Tốc độ chuẩn 120-145 từ/phút; cao độ F0 biến thiên sinh động, ngắt nghỉ đúng chỗ." },
      proficient: { min: 15, description: "Tốc độ 110-155 từ/phút; âm lượng rõ, ngữ điệu tương đối tự nhiên." },
      developing: { min: 11, description: "Tốc độ quá nhanh (> 160) hoặc quá chậm (< 100); ngữ điệu hơi đều đều." },
      needsImprovement: { min: 0, description: "Nói lắp, thì thào không nghe rõ hoặc giọng nghẹn do căng thẳng." }
    }
  },
  fillerWords: {
    id: "fillerWords",
    name: "Kiểm soát tật ngôn ngữ",
    maxPoints: 15,
    weight: 0.15,
    technology: "Speech Recognition Stream & Vietnamese Filler RegEx Engine",
    description: "Tần suất xuất hiện các từ đệm vô thức (à, ừm, thì, là, kiểu như, thực sự...).",
    thresholds: {
      excellent: { min: 14, description: "< 1 từ đệm / phút. Luồng nói trôi chảy, sử dụng khoảng lặng thay cho từ đệm." },
      proficient: { min: 11, description: "1 - 2 từ đệm / phút. Không ảnh hưởng nghiêm trọng đến trải nghiệm nghe." },
      developing: { min: 8, description: "3 - 5 từ đệm / phút. Xuất hiện lặp lại khi chuyển ý hoặc ngập ngừng." },
      needsImprovement: { min: 0, description: "> 5 từ đệm / phút. Lạm dụng tật ngôn ngữ nghiêm trọng làm mất tập trung." }
    }
  },
  contentLogic: {
    id: "contentLogic",
    name: "Chiều sâu nội dung & Lập luận",
    maxPoints: 20,
    weight: 0.2,
    technology: "Google Gemini 2.0 / 1.5 Flash (Structured JSON Output)",
    description: "Bố cục Mở - Thân - Kết, bằng chứng thực nghiệm, logic chặt chẽ, không mắc ngụy biện.",
    thresholds: {
      excellent: { min: 18, description: "Hook thu hút, luận điểm mạch lạc, số liệu chứng minh vững vàng, kết bài kêu gọi hành động." },
      proficient: { min: 15, description: "Bố cục rõ ràng, lập luận hợp lý, có ví dụ minh họa." },
      developing: { min: 11, description: "Luận điểm rời rạc, thiếu bằng chứng cụ thể, chuyển ý đột ngột." },
      needsImprovement: { min: 0, description: "Lạc đề, luận cứ mâu thuẫn hoặc nội dung quá sơ sài." }
    }
  },
  rebuttalReflex: {
    id: "rebuttalReflex",
    name: "Phản xạ phản biện đối đáp",
    maxPoints: 20,
    weight: 0.2,
    technology: "Adversarial AI Judge & Timer Tracking Engine",
    description: "Thời gian phản ứng đối thoại, trả lời đúng trọng tâm chất vấn, bản lĩnh bảo vệ luận điểm.",
    thresholds: {
      excellent: { min: 18, description: "Phản ứng < 3s, trả lời trúng tim đen câu hỏi chất vấn, dẫn chứng sắc sảo, tự tin." },
      proficient: { min: 15, description: "Phản ứng 3-5s, trả lời đúng trọng tâm, thái độ bình tĩnh lắng nghe." },
      developing: { min: 11, description: "Phản ứng 5-8s, câu trả lời hơi quanh co hoặc chỉ giải thích một phần." },
      needsImprovement: { min: 0, description: "Bị đơ (> 8s), không trả lời được hoặc mất bình tĩnh cãi cùn." }
    }
  }
};

export const TOTAL_RUBRIC_POINTS = 100;
