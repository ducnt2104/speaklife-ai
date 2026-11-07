import React from "react";
import { AlertCircle, CameraOff, MicOff, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "./button";

export interface EdgeStateAlertProps {
  type: "camera_denied" | "mic_denied" | "webgl_failed" | "api_timeout" | "low_fps";
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const EdgeStateAlert: React.FC<EdgeStateAlertProps> = ({
  type,
  onRetry,
  onDismiss
}) => {
  const configs = {
    camera_denied: {
      icon: CameraOff,
      title: "Chưa cấp quyền truy cập Camera",
      description: "SpeakLife AI cần quyền camera để đo đạc tỷ lệ giao tiếp mắt và cử chỉ. Hệ thống cam kết Zero-Data: toàn bộ hình ảnh được xử lý khép kín trong RAM, không lưu trữ hoặc gửi video lên đám mây.",
      actionText: "Thử cấp quyền lại"
    },
    mic_denied: {
      icon: MicOff,
      title: "Chưa cấp quyền Microphone",
      description: "Quyền Microphone cần thiết để phân tích tiết tấu giọng nói (WPM, âm lượng) và nhận diện tật ngôn ngữ (à, ừm). Âm thanh thô không bao giờ truyền ra ngoài thiết bị.",
      actionText: "Mở lại Microphone"
    },
    webgl_failed: {
      icon: AlertCircle,
      title: "Trình duyệt không hỗ trợ WebGL 3D",
      description: "Thiết bị của bạn đang chạy ở chế độ tiết kiệm năng lượng hoặc card đồ họa bị vô hiệu hóa. Hệ thống đã tự động chuyển sang chế độ Khán phòng 2D Tinh gọn.",
      actionText: "Chạy chế độ 2D"
    },
    api_timeout: {
      icon: WifiOff,
      title: "Kết nối AI Giám khảo bị gián đoạn",
      description: "Không thể kết nối đến máy chủ AI (Google Gemini). Hệ thống đã tự động kích hoạt Giám khảo Dự phòng Cục bộ để bạn tiếp tục luyện tập mà không bị ngắt quãng.",
      actionText: "Thử kết nối lại"
    },
    low_fps: {
      icon: AlertCircle,
      title: "Tốc độ xử lý khung hình thấp (< 20 FPS)",
      description: "Để đảm bảo thiết bị hoạt động mượt mà, hệ thống đã tự động giảm độ phân giải khử răng cưa của khán phòng 3D.",
      actionText: "Đã hiểu"
    }
  };

  const config = configs[type];
  const IconComponent = config.icon;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
          <IconComponent className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-heading font-semibold text-amber-900 text-sm">{config.title}</h4>
          <p className="text-xs text-amber-800/90 mt-0.5 max-w-2xl leading-relaxed">{config.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="border-amber-300 text-amber-900 hover:bg-amber-100">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>{config.actionText}</span>
          </Button>
        )}
      </div>
    </div>
  );
};
