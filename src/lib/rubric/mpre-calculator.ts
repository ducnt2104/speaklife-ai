// SpeakLife AI — Multimodal Presentation Reflex Engine (MPRE) Calculation Algorithm
// Compliance: Gameshow "Đấu trường AI" TP. Đồng Nai năm 2026

export interface MPREInputMetrics {
  durationSeconds: number;
  totalWords: number;
  faceDetectedFrames: number;
  totalAnalyzedFrames: number;
  eyeContactFrames: number;
  shoulderTiltVariance: number; // In degrees
  averageRmsDecibels: number;   // e.g. -18 dB
  pitchF0StdDev: number;        // in Hz, measure of vocal inflection
  fillerWordCount: number;
  aiContentScore?: number;      // 0 to 20 from Gemini analysis
  rebuttalRounds?: Array<{
    reactionTimeSeconds: number;
    score: number; // 0 to 15
  }>;
}

export interface DimensionScoreResult {
  score: number;
  maxPoints: number;
  percentage: number;
  status: "excellent" | "proficient" | "developing" | "needsImprovement";
  hasInsufficientData: boolean;
  benchmarkFeedback: string;
}

export interface MPREEvaluationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  tier: "Xuất sắc" | "Khá tốt" | "Cần rèn luyện" | "Khởi đầu";
  dimensions: {
    bodyLanguage: DimensionScoreResult;
    voiceProsody: DimensionScoreResult;
    fillerWords: DimensionScoreResult;
    contentLogic: DimensionScoreResult;
    rebuttalReflex: DimensionScoreResult;
  };
  metricsSummary: {
    wpm: number;
    eyeContactRatio: number;
    fillerWordRatePerMinute: number;
    avgReactionSeconds: number;
    faceCoverageRatio: number;
  };
  keyRecommendations: string[];
}

export function calculateMPREScore(metrics: MPREInputMetrics): MPREEvaluationResult {
  const durationMinutes = Math.max(0.1, metrics.durationSeconds / 60);
  const faceCoverageRatio = metrics.totalAnalyzedFrames > 0 
    ? metrics.faceDetectedFrames / metrics.totalAnalyzedFrames 
    : 0;
  const isFaceDataInsufficient = faceCoverageRatio < 0.65; // <65% tracking coverage

  // 1. Body Language & Eye Contact (25 pts)
  let bodyScore = 0;
  let bodyFeedback = "";
  let eyeRatio = 0;

  if (isFaceDataInsufficient) {
    bodyScore = 12; // Neutral default with explicit warning flag
    bodyFeedback = "Cảnh báo: Dữ liệu khuôn mặt bị khuất hoặc thiếu sáng quá 35% thời lượng. Điểm số mang tính ước tính.";
  } else {
    eyeRatio = metrics.eyeContactFrames / Math.max(1, metrics.faceDetectedFrames);
    if (eyeRatio >= 0.75) {
      bodyScore = 25;
      bodyFeedback = "Xuất sắc: Bạn duy trì giao tiếp mắt vững vàng (> 75%), tạo sự kết nối mạnh mẽ với khán giả.";
    } else if (eyeRatio >= 0.60) {
      bodyScore = 20 + ((eyeRatio - 0.60) / 0.15) * 4;
      bodyFeedback = "Khá tốt: Tỷ lệ eye contact đạt chuẩn, cần chú ý không đảo mắt khi suy nghĩ luận điểm.";
    } else if (eyeRatio >= 0.40) {
      bodyScore = 14 + ((eyeRatio - 0.40) / 0.20) * 5;
      bodyFeedback = "Cần cải thiện: Bạn hay nhìn xuống sàn hoặc nhìn sang hai bên khi ngập ngừng.";
    } else {
      bodyScore = Math.max(5, (eyeRatio / 0.40) * 13);
      bodyFeedback = "Chưa đạt: Ánh mắt né tránh ống kính. Hãy tập thói quen nhìn vào điểm tròn webcam.";
    }

    // Deduction for excessive postural tilt or fidgeting
    if (metrics.shoulderTiltVariance > 12) {
      bodyScore = Math.max(0, bodyScore - 3);
      bodyFeedback += " Lưu ý: Tư thế đứng còn rung lắc, hai vai nghiêng không đều.";
    }
  }

  // 2. Voice Prosody & Rhythm (20 pts)
  const wpm = Math.round(metrics.totalWords / durationMinutes);
  let voiceScore = 0;
  let voiceFeedback = "";

  if (wpm >= 120 && wpm <= 145) {
    voiceScore = 20;
    voiceFeedback = `Tuyệt vời: Tốc độ phát âm đạt chuẩn vàng thuyết trình (${wpm} từ/phút), rất dễ theo dõi.`;
  } else if ((wpm >= 110 && wpm < 120) || (wpm > 145 && wpm <= 160)) {
    voiceScore = 16;
    voiceFeedback = `Khá tốt: Tốc độ ${wpm} từ/phút. ${wpm < 120 ? "Có thể đẩy nhanh nhịp điệu thêm một chút." : "Nên ngắt nghỉ sâu hơn để người nghe kịp thẩm thấu."}`;
  } else if (wpm >= 90 && wpm < 110) {
    voiceScore = 12;
    voiceFeedback = `Hơi chậm (${wpm} từ/phút): Bài nói có thể gây buồn ngủ nếu thiếu năng lượng và điểm nhấn.`;
  } else if (wpm > 160) {
    voiceScore = 10;
    voiceFeedback = `Quá nhanh (${wpm} từ/phút): Người nghe sẽ bị ngợp thông tin và bạn dễ bị hụt hơi.`;
  } else {
    voiceScore = 6;
    voiceFeedback = `Chưa đạt: Tốc độ nói không đều hoặc có quá nhiều khoảng chết kéo dài.`;
  }

  // Modulate with pitch variance (avoid flat monotone)
  if (metrics.pitchF0StdDev < 6 && voiceScore > 10) {
    voiceScore -= 2;
    voiceFeedback += " Giọng điệu còn hơi đều đều (monotone), hãy nhấn giọng vào các từ khóa quan trọng.";
  }

  // 3. Filler Words (15 pts)
  const fillerRate = metrics.fillerWordCount / durationMinutes;
  let fillerScore = 0;
  let fillerFeedback = "";

  if (fillerRate < 1.0) {
    fillerScore = 15;
    fillerFeedback = `Hoàn hảo: Bạn chỉ dùng ${metrics.fillerWordCount} từ đệm (${fillerRate.toFixed(1)} từ/phút). Luồng nói rất sạch và chuyên nghiệp.`;
  } else if (fillerRate <= 2.5) {
    fillerScore = 12;
    fillerFeedback = `Tốt: Xuất hiện ${metrics.fillerWordCount} từ đệm. Thỉnh thoảng vô thức đệm từ khi chuyển câu.`;
  } else if (fillerRate <= 4.5) {
    fillerScore = 8;
    fillerFeedback = `Cần lưu ý: Tần suất từ đệm là ${fillerRate.toFixed(1)} từ/phút (${metrics.fillerWordCount} từ). Hãy dùng khoảng lặng im lặng 1 giây thay vì 'à, ừm'.`;
  } else {
    fillerScore = Math.max(2, 6 - Math.round(fillerRate - 4.5));
    fillerFeedback = `Báo động tật ngôn ngữ: Bạn lặp lại từ đệm ${metrics.fillerWordCount} lần (${fillerRate.toFixed(1)} từ/phút), làm giảm đáng kể sức thuyết phục.`;
  }

  // 4. Content Structure & Logic (20 pts)
  const contentScore = metrics.aiContentScore !== undefined ? Math.min(20, Math.max(0, metrics.aiContentScore)) : 15;
  const contentFeedback = contentScore >= 17 
    ? "Bố cục Mở - Thân - Kết rõ ràng, lập luận có bằng chứng và số liệu vững vàng."
    : contentScore >= 13
    ? "Nội dung đầy đủ các ý chính, cần làm nổi bật hơn giải pháp trọng tâm."
    : "Luận điểm còn rời rạc hoặc thiếu dẫn chứng thực tế minh họa.";

  // 5. Critical Q&A Reflex (20 pts)
  let reflexScore = 0;
  let avgReactionSeconds = 0;
  let reflexFeedback = "";

  if (metrics.rebuttalRounds && metrics.rebuttalRounds.length > 0) {
    const totalLatency = metrics.rebuttalRounds.reduce((acc, r) => acc + r.reactionTimeSeconds, 0);
    avgReactionSeconds = Math.round((totalLatency / metrics.rebuttalRounds.length) * 10) / 10;
    
    // Latency component (max 5 pts)
    let latencyPoints = 5;
    if (avgReactionSeconds > 7) latencyPoints = 1;
    else if (avgReactionSeconds > 4.5) latencyPoints = 3;
    else if (avgReactionSeconds > 3) latencyPoints = 4;

    // Content component (max 15 pts)
    const totalContentRebuttal = metrics.rebuttalRounds.reduce((acc, r) => acc + r.score, 0);
    const avgContentRebuttal = totalContentRebuttal / metrics.rebuttalRounds.length;

    reflexScore = Math.round(latencyPoints + avgContentRebuttal);
    reflexFeedback = `Thời gian phản ứng trung bình: ${avgReactionSeconds}s. ` +
      (avgReactionSeconds <= 3.5 
        ? "Phản xạ nhanh nhạy, trả lời thẳng thắn vào trọng tâm câu hỏi của giám khảo." 
        : "Hơi mất bình tĩnh trong giây đầu tiên, nhưng đã kịp lấy lại mạch suy nghĩ.");
  } else {
    reflexScore = 14;
    avgReactionSeconds = 3.5;
    reflexFeedback = "Điểm phản xạ cơ sở (chưa kích hoạt vòng chất vấn chuyên sâu).";
  }

  const total = Math.round(bodyScore + voiceScore + fillerScore + contentScore + reflexScore);

  let tier: "Xuất sắc" | "Khá tốt" | "Cần rèn luyện" | "Khởi đầu" = "Khởi đầu";
  if (total >= 85) tier = "Xuất sắc";
  else if (total >= 70) tier = "Khá tốt";
  else if (total >= 50) tier = "Cần rèn luyện";

  function resolveStatus(pts: number, max: number): "excellent" | "proficient" | "developing" | "needsImprovement" {
    const ratio = pts / max;
    if (ratio >= 0.85) return "excellent";
    if (ratio >= 0.70) return "proficient";
    if (ratio >= 0.50) return "developing";
    return "needsImprovement";
  }

  const keyRecommendations: string[] = [];
  if (eyeRatio < 0.70) keyRecommendations.push("Luyện tập nhìn vào vòng cung camera 75% thời gian để nâng cao độ tin cậy.");
  if (wpm < 115 || wpm > 150) keyRecommendations.push(`Điều chỉnh tốc độ nói về khoảng chuẩn 125 - 140 từ/phút (hiện tại: ${wpm} WPM).`);
  if (fillerRate > 1.5) keyRecommendations.push(`Thực hành bài tập 'Khoảng lặng có chủ đích' để loại bỏ ${metrics.fillerWordCount} từ đệm.`);
  if (avgReactionSeconds > 4) keyRecommendations.push("Áp dụng công thức 3 bước khi trả lời chất vấn: Lắng nghe/Xác nhận -> Nêu luận cứ -> Khẳng định giải pháp.");

  return {
    totalScore: total,
    maxScore: 100,
    percentage: total,
    tier,
    dimensions: {
      bodyLanguage: {
        score: Math.round(bodyScore),
        maxPoints: 25,
        percentage: Math.round((bodyScore / 25) * 100),
        status: resolveStatus(bodyScore, 25),
        hasInsufficientData: isFaceDataInsufficient,
        benchmarkFeedback: bodyFeedback
      },
      voiceProsody: {
        score: Math.round(voiceScore),
        maxPoints: 20,
        percentage: Math.round((voiceScore / 20) * 100),
        status: resolveStatus(voiceScore, 20),
        hasInsufficientData: false,
        benchmarkFeedback: voiceFeedback
      },
      fillerWords: {
        score: Math.round(fillerScore),
        maxPoints: 15,
        percentage: Math.round((fillerScore / 15) * 100),
        status: resolveStatus(fillerScore, 15),
        hasInsufficientData: false,
        benchmarkFeedback: fillerFeedback
      },
      contentLogic: {
        score: Math.round(contentScore),
        maxPoints: 20,
        percentage: Math.round((contentScore / 20) * 100),
        status: resolveStatus(contentScore, 20),
        hasInsufficientData: false,
        benchmarkFeedback: contentFeedback
      },
      rebuttalReflex: {
        score: Math.round(reflexScore),
        maxPoints: 20,
        percentage: Math.round((reflexScore / 20) * 100),
        status: resolveStatus(reflexScore, 20),
        hasInsufficientData: false,
        benchmarkFeedback: reflexFeedback
      }
    },
    metricsSummary: {
      wpm,
      eyeContactRatio: Math.round(eyeRatio * 100),
      fillerWordRatePerMinute: Math.round(fillerRate * 10) / 10,
      avgReactionSeconds,
      faceCoverageRatio: Math.round(faceCoverageRatio * 100)
    },
    keyRecommendations: keyRecommendations.length > 0 ? keyRecommendations : ["Tiếp tục duy trì phong thái tự tin và năng lượng tích cực này trong các bài thi thật!"]
  };
}
