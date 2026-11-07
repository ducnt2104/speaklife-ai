// SpeakLife AI — Practice Scenarios & Adversarial Judge Profiles

export interface PracticeScenario {
  id: string;
  title: string;
  subtitle: string;
  audienceType: string;
  defaultDurationSeconds: number;
  recommendedWpmRange: [number, number];
  judgeFocus: string[];
  description: string;
  iconName: string;
}

export const PRACTICE_SCENARIOS: PracticeScenario[] = [
  {
    id: "classroom",
    title: "Thuyết trình trên lớp học",
    subtitle: "Chương trình GDPT 2018 (Ngữ văn, Lịch sử, Địa lý, Trải nghiệm)",
    audienceType: "Bạn bè cùng lớp & Giáo viên bộ môn",
    defaultDurationSeconds: 180,
    recommendedWpmRange: [120, 140],
    judgeFocus: ["Độ rõ ràng của nội dung", "Khả năng tương tác với bạn học", "Sử dụng từ ngữ trong sáng"],
    description: "Môi trường thân thiện giúp giải tỏa áp lực đứng trước đám đông, luyện tập diễn đạt ý tưởng trôi chảy và tự tin.",
    iconName: "GraduationCap"
  },
  {
    id: "stem_khkt",
    title: "Bảo vệ dự án KHKT / STEM",
    subtitle: "Cuộc thi Kỹ thuật, Tin học trẻ, Đấu trường AI",
    audienceType: "Hội đồng Ban Giám khảo Chuyên môn",
    defaultDurationSeconds: 300,
    recommendedWpmRange: [125, 145],
    judgeFocus: ["Tính mới và tính sáng tạo", "Phương pháp thực nghiệm & số liệu", "Bản lĩnh bảo vệ giải pháp"],
    description: "Rèn luyện khả năng thuyết phục hội đồng giám khảo khó tính, bảo vệ tính trung thực và chiều sâu khoa học của đề tài.",
    iconName: "Cpu"
  },
  {
    id: "english_debate",
    title: "Hùng biện & Tranh biện Tiếng Anh",
    subtitle: "English Speaking Contest, World Schools Debate",
    audienceType: "International Audience & Native Adjudicators",
    defaultDurationSeconds: 240,
    recommendedWpmRange: [115, 135],
    judgeFocus: ["Fluency & Pronunciation", "Logical Argumentation", "Rebuttal against Counter-arguments"],
    description: "Tôi luyện phản xạ hùng biện bằng ngôn ngữ thứ hai, kiểm soát ngữ điệu và phát âm chuẩn quốc tế.",
    iconName: "Globe"
  },
  {
    id: "interview",
    title: "Phỏng vấn tuyển sinh & Học bổng",
    subtitle: "Xét tuyển Đại học, Phỏng vấn Du học, Trại hè Lãnh đạo",
    audienceType: "Hội đồng Tuyển sinh & Cựu sinh viên",
    defaultDurationSeconds: 180,
    recommendedWpmRange: [120, 140],
    judgeFocus: ["Sự chân thành & Khát vọng", "Khả năng ứng biến tình huống", "Phong thái tự tin, tôn trọng"],
    description: "Luyện phản xạ trước các câu hỏi bất ngờ về định hướng tương lai, giá trị bản thân và kỹ năng lãnh đạo.",
    iconName: "Award"
  }
];

export interface DifficultyTier {
  id: "friendly" | "standard" | "adversarial";
  label: string;
  judgeName: string;
  judgeTitle: string;
  judgeAvatar: string;
  tone: string;
  rebuttalCount: number;
  questionTimerSeconds: number;
  description: string;
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  {
    id: "friendly",
    label: "Giám khảo Đồng hành",
    judgeName: "Thầy Minh Trí",
    judgeTitle: "Cố vấn Kỹ năng Thanh thiếu niên",
    judgeAvatar: "/avatars/judge-friendly.png",
    tone: "Động viên, gợi mở, giúp học sinh tìm ra điểm mạnh của bài nói.",
    rebuttalCount: 1,
    questionTimerSeconds: 60,
    description: "Phù hợp cho người mới bắt đầu luyện tập, đang còn e ngại hoặc sợ nói trước đám đông."
  },
  {
    id: "standard",
    label: "Giám khảo Chuẩn mực",
    judgeName: "Cô Thu Hà",
    judgeTitle: "Giám khảo Hội đồng Sư phạm",
    judgeAvatar: "/avatars/judge-standard.png",
    tone: "Khách quan, chuẩn chỉ theo thang điểm Rubric 100 điểm của GDPT 2018.",
    rebuttalCount: 2,
    questionTimerSeconds: 45,
    description: "Phù hợp cho học sinh chuẩn bị thuyết trình kiểm tra định kỳ hoặc báo cáo chuyên đề."
  },
  {
    id: "adversarial",
    label: "Giám khảo Khắt khe",
    judgeName: "Tiến sĩ Hoàng Nam",
    judgeTitle: "Trưởng ban Giám khảo KHKT",
    judgeAvatar: "/avatars/judge-strict.png",
    tone: "Hỏi xoáy đáp xoay, đào sâu các lỗ hổng lập luận và số liệu chưa vững.",
    rebuttalCount: 3,
    questionTimerSeconds: 30,
    description: "Thử thách đỉnh cao mô phỏng vòng Chung kết KHKT, STEM và phỏng vấn học bổng quốc tế."
  }
];
