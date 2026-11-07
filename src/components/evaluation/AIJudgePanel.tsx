"use client";

import React, { useState, useEffect } from "react";
import { Award, Clock, Send, Mic, Volume2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

export interface AIJudgePanelProps {
  judgeName: string;
  judgeTitle: string;
  scenarioTitle: string;
  currentQuestion: string;
  questionNumber: number;
  totalQuestions: number;
  timerSeconds: number;
  isEvaluating: boolean;
  onAnswerSubmit: (answerText: string, reactionTimeSeconds: number) => void;
  className?: string;
}

export const AIJudgePanel: React.FC<AIJudgePanelProps> = ({
  judgeName,
  judgeTitle,
  scenarioTitle,
  currentQuestion,
  questionNumber,
  totalQuestions,
  timerSeconds = 45,
  isEvaluating = false,
  onAnswerSubmit,
  className = ""
}) => {
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    setTimeLeft(timerSeconds);
    setHasSubmitted(false);
    setStudentAnswer("");

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, timerSeconds]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!studentAnswer.trim() || hasSubmitted) return;
    setHasSubmitted(true);
    const latency = timerSeconds - timeLeft;
    onAnswerSubmit(studentAnswer, latency);
  };

  const timerRatio = timeLeft / timerSeconds;
  const isTimeRunningOut = timeLeft <= 10;

  return (
    <div className={`rounded-2xl border border-border bg-surface shadow-md overflow-hidden flex flex-col ${className}`}>
      {/* Header: Judge Identity & Round Counter */}
      <div className="bg-surface-subtle p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold font-heading shadow-sm">
            {judgeName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-semibold text-foreground text-sm">{judgeName}</h4>
              <Badge variant="info">Giám khảo Phản biện</Badge>
            </div>
            <p className="text-xs text-text-muted">{judgeTitle} • {scenarioTitle}</p>
          </div>
        </div>

        {/* Round Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-text-secondary">
            Chất vấn: {questionNumber}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isTimeRunningOut ? "bg-status-danger" : "bg-primary"
          }`}
          style={{ width: `${Math.round(timerRatio * 100)}%` }}
        />
      </div>

      {/* Question Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Câu hỏi chất vấn từ Giám khảo AI:
            </span>
            <div className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${
              isTimeRunningOut ? "text-status-danger animate-pulse" : "text-text-secondary"
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </div>
          </div>

          <div className="rounded-xl bg-violet-50/70 border border-violet-100 p-4 text-foreground font-medium text-sm leading-relaxed mb-4">
            &ldquo;{currentQuestion}&rdquo;
          </div>
        </div>

        {/* Student Rebuttal Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              disabled={hasSubmitted || isEvaluating}
              placeholder="Nhập hoặc nói câu trả lời phản biện của bạn (nêu rõ luận điểm, số liệu dẫn chứng và khẳng định tính khả thi)..."
              rows={3}
              className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-text-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Công thức: Lắng nghe $\to$ Dẫn chứng $\to$ Khẳng định</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isEvaluating}
                disabled={!studentAnswer.trim() || hasSubmitted}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Gửi phản biện</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
