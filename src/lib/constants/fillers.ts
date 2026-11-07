// SpeakLife AI — Vietnamese & English Filler Word Lexicon & Patterns

export interface FillerWordDefinition {
  word: string;
  pattern: RegExp;
  category: "verbal_pause" | "crutch_word" | "hesitation";
  severity: "low" | "medium" | "high";
  suggestion: string;
}

export const VIETNAMESE_FILLER_WORDS: FillerWordDefinition[] = [
  {
    word: "à",
    pattern: /(?:^|\s)(à|aaa+)(?:\s|[.,!?]|$)/iu,
    category: "verbal_pause",
    severity: "medium",
    suggestion: "Thay bằng một khoảng lặng 1 giây để thở và sắp xếp ý nghĩ."
  },
  {
    word: "ừm",
    pattern: /(?:^|\s)(ừm|umm+|ờm)(?:\s|[.,!?]|$)/iu,
    category: "verbal_pause",
    severity: "medium",
    suggestion: "Dừng lại và nhìn thẳng vào khán giả thay vì phát âm vô thức."
  },
  {
    word: "thì",
    pattern: /(?:^|\s)(thì\s+là|thì)(?:\s+thì)+(?:\s|[.,!?]|$)/iu,
    category: "crutch_word",
    severity: "high",
    suggestion: "Tránh lặp từ 'thì' liên tiếp trong một câu."
  },
  {
    word: "là",
    pattern: /(?:^|\s)(là\s+là)(?:\s|[.,!?]|$)/iu,
    category: "crutch_word",
    severity: "medium",
    suggestion: "Đi thẳng vào vị ngữ hoặc kết luận."
  },
  {
    word: "kiểu như",
    pattern: /(?:^|\s)(kiểu\s+như|kiểu\s+là)(?:\s|[.,!?]|$)/iu,
    category: "crutch_word",
    severity: "high",
    suggestion: "Dùng từ chính xác: 'ví dụ như', 'cụ thể là', 'điển hình là'."
  },
  {
    word: "thực sự",
    pattern: /(?:^|\s)(thực\s+sự\s+thì|thực\s+sự)(?:\s+thực\s+sự)+(?:\s|[.,!?]|$)/iu,
    category: "crutch_word",
    severity: "medium",
    suggestion: "Sử dụng số liệu hoặc bằng chứng thay cho từ nhấn mạnh cảm tính."
  },
  {
    word: "ơ",
    pattern: /(?:^|\s)(ơ|ơơ+)(?:\s|[.,!?]|$)/iu,
    category: "hesitation",
    severity: "high",
    suggestion: "Giữ ánh mắt bao quát và hít sâu một nhịp."
  },
  {
    word: "vâng ạ",
    pattern: /(?:^|\s)(vâng\s+ạ)(?:\s+vâng\s+ạ)+(?:\s|[.,!?]|$)/iu,
    category: "crutch_word",
    severity: "medium",
    suggestion: "Xác nhận một lần ngắn gọn rồi bắt đầu trả lời ngay."
  }
];

export const ENGLISH_FILLER_WORDS: FillerWordDefinition[] = [
  { word: "um", pattern: /(?:^|\s)(um+|uh+)(?:\s|[.,!?]|$)/iu, category: "verbal_pause", severity: "medium", suggestion: "Pause silently." },
  { word: "like", pattern: /(?:^|\s)(like)(?:\s+like)+(?:\s|[.,!?]|$)/iu, category: "crutch_word", severity: "high", suggestion: "Use 'for example' or state the fact directly." },
  { word: "you know", pattern: /(?:^|\s)(you\s+know)(?:\s|[.,!?]|$)/iu, category: "crutch_word", severity: "high", suggestion: "Assume audience understanding without seeking reassurance." },
  { word: "basically", pattern: /(?:^|\s)(basically)(?:\s|[.,!?]|$)/iu, category: "crutch_word", severity: "medium", suggestion: "State the core idea without filler adverbs." }
];
