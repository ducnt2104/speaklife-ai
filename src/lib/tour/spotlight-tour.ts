/**
 * Spotlight Tour — Interactive Onboarding Guide using driver.js
 * Provides first-visit guided tour with spotlight highlighting.
 */

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_COMPLETED_KEY = "speaklife_tour_completed";

/** Check if the user has completed the tour before */
export function isTourCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
}

/** Mark tour as completed */
export function markTourCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOUR_COMPLETED_KEY, "true");
}

/** Reset tour so it shows again on next visit */
export function resetTour(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOUR_COMPLETED_KEY);
}

/** Setup page tour steps */
const SETUP_STEPS: DriveStep[] = [
  {
    popover: {
      title: "🎯 Chào mừng đến SpeakLife AI!",
      description:
        "Đây là hệ thống luyện thuyết trình thực chiến với AI Giám khảo. Hãy để tôi hướng dẫn bạn qua từng bước thiết lập.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='scenario-select']",
    popover: {
      title: "📋 Bước 1: Chọn Bối Cảnh",
      description:
        "Chọn kịch bản thi phù hợp: KHKT Quốc gia, Thuyết trình Startup, TED Talk hoặc Hội nghị Quốc tế. AI sẽ đặt câu hỏi phản biện theo bối cảnh.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='difficulty-select']",
    popover: {
      title: "⚡ Bước 2: Mức Độ Khắt Khe",
      description:
        "Lựa chọn độ khó: Cơ bản → Nâng cao → Chuyên gia. Mức càng cao, câu hỏi phản biện càng sắc bén và thời gian phản xạ càng ngắn.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='document-upload']",
    popover: {
      title: "📄 Tải Lên Tài Liệu",
      description:
        "Kéo thả file PDF, DOCX hoặc TXT của bài thuyết trình. Nội dung được trích xuất 100% tại trình duyệt (Zero-Data Retention).",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour='outline-input']",
    popover: {
      title: "✍️ Dàn Ý & Nội Dung",
      description:
        "Nhập hoặc dán tóm tắt luận điểm chính. AI sẽ phân tích nội dung này để chuẩn bị câu hỏi phản biện thực tế cho đề tài của bạn.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour='test-ai-btn']",
    popover: {
      title: "🧠 Kiểm Tra AI Trước",
      description:
        "Nhấn nút này để xem trước câu hỏi AI sẽ đặt ra. Giúp bạn chuẩn bị tâm thế trước khi vào phòng luyện tập.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour='start-btn']",
    popover: {
      title: "🚀 Vào Khán Phòng!",
      description:
        "Nhấn để bước vào khán phòng 3D. Hệ thống sẽ yêu cầu cấp quyền Camera và Micro để phân tích giao tiếp mắt, giọng nói và ngôn ngữ cơ thể.",
      side: "top",
      align: "end",
    },
  },
];

/** Rehearsal page tour steps */
const REHEARSE_STEPS: DriveStep[] = [
  {
    element: "[data-tour='auditorium']",
    popover: {
      title: "🏛️ Khán Phòng 3D",
      description:
        "Đây là khán phòng ảo với khán giả mô phỏng. Khi bạn nói hay, khán giả vỗ tay. Khi ngập ngừng, họ sẽ xì xào.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='camera-hud']",
    popover: {
      title: "📷 Camera & Đo Lường",
      description:
        "Webcam theo dõi giao tiếp mắt, tư thế và biểu cảm khuôn mặt. Tất cả xử lý tại máy — không gửi video lên server.",
      side: "left",
      align: "start",
    },
  },
  {
    element: "[data-tour='subtitle-panel']",
    popover: {
      title: "📝 Bảng Phụ Đề Trực Tiếp",
      description:
        "Bài nói được chuyển thành văn bản thời gian thực. Từ đệm (ừm, à, kiểu, kiểu như...) được đánh dấu đỏ.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "[data-tour='controls']",
    popover: {
      title: "🎛️ Bảng Điều Khiển",
      description:
        "Bắt đầu/Dừng phiên luyện tập, xem thời gian, và truy cập bảng đánh giá chi tiết sau khi hoàn thành.",
      side: "top",
      align: "center",
    },
  },
];

/** Start the setup page tour */
export function startSetupTour(): void {
  const driverObj = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    nextBtnText: "Tiếp theo →",
    prevBtnText: "← Quay lại",
    doneBtnText: "Bắt đầu! ✨",
    progressText: "{{current}} / {{total}}",
    steps: SETUP_STEPS,
    onDestroyStarted: () => {
      markTourCompleted();
      driverObj.destroy();
    },
  });

  driverObj.drive();
}

/** Start the rehearsal page tour */
export function startRehearseTour(): void {
  const driverObj = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    nextBtnText: "Tiếp theo →",
    prevBtnText: "← Quay lại",
    doneBtnText: "Hiểu rồi! 🎤",
    progressText: "{{current}} / {{total}}",
    steps: REHEARSE_STEPS,
    onDestroyStarted: () => {
      driverObj.destroy();
    },
  });

  driverObj.drive();
}
