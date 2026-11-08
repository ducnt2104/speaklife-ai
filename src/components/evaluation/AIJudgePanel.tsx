"use client";

import React, { useState, useEffect, useRef } from "react";
import { Award, Clock, Send, Mic, MicOff, Volume2, VolumeX, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { SpeechSynthesizer } from "@/lib/audio/speech-synthesizer";
import { SpeechRecognizer } from "@/lib/audio/speech-recognizer";

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
  className = "",
}) => {
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isJudgeSpeaking, setIsJudgeSpeaking] = useState(false);
  const [isVoiceDictating, setIsVoiceDictating] = useState(false);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);

  // Auto-speak question when question changes
  useEffect(() => {
    setTimeLeft(timerSeconds);
    setHasSubmitted(false);
    setStudentAnswer("");

    // Initialize TTS and speak question automatically
    const tts = SpeechSynthesizer.getInstance();
    tts.speak(currentQuestion, {
      onStart: () => setIsJudgeSpeaking(true),
      onEnd: () => setIsJudgeSpeaking(false),
      onError: () => setIsJudgeSpeaking(false),
    });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      tts.stop();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, [currentQuestion, timerSeconds]);

  // Voice Dictation Toggle
  const toggleVoiceDictation = () => {
    if (isVoiceDictating) {
      recognizerRef.current?.stop();
      setIsVoiceDictating(false);
    } else {
      // Stop judge speaking if still active
      SpeechSynthesizer.getInstance().stop();
      setIsJudgeSpeaking(false);

      if (!recognizerRef.current) {
        recognizerRef.current = new SpeechRecognizer({
          lang: "vi-VN",
          onTranscript: (full, interim) => {
            const currentTotal = (full + " " + interim).trim();
            setStudentAnswer((prev) => {
              // Append to initial text if user typed something first
              return currentTotal;
            });
          },
          onError: (err) => {
            console.warn("Dictation error:", err);
            setIsVoiceDictating(false);
          },
          onStateChange: (listening) => setIsVoiceDictating(listening),
        });
      }
      recognizerRef.current.start();
      setIsVoiceDictating(true);
    }
  };

  const handleToggleSpeakQuestion = () => {
    const tts = SpeechSynthesizer.getInstance();
    if (isJudgeSpeaking) {
      tts.stop();
      setIsJudgeSpeaking(false);
    } else {
      tts.speak(currentQuestion, {
        onStart: () => setIsJudgeSpeaking(true),
        onEnd: () => setIsJudgeSpeaking(false),
        onError: () => setIsJudgeSpeaking(false),
      });
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!studentAnswer.trim() || hasSubmitted) return;
    SpeechSynthesizer.getInstance().stop();
    recognizerRef.current?.stop();
    setIsVoiceDictating(false);
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
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold font-heading shadow-sm relative">
            {judgeName.charAt(0)}
            {isJudgeSpeaking && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-semibold text-foreground text-sm">{judgeName}</h4>
              <Badge variant="info">Giám khảo Phản biện</Badge>
            </div>
            <p className="text-xs text-text-muted">
              {judgeTitle} • {scenarioTitle}
            </p>
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
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 overflow-hidden">
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Câu hỏi chất vấn từ Giám khảo AI:
              </span>
              <button
                type="button"
                onClick={handleToggleSpeakQuestion}
                className="text-[11px] px-2 py-0.5 rounded-full border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 flex items-center gap-1 transition-colors"
              >
                {isJudgeSpeaking ? <VolumeX className="w-3 h-3 text-rose-500" /> : <Volume2 className="w-3 h-3" />}
                <span>{isJudgeSpeaking ? "Dừng đọc" : "Đọc to"}</span>
              </button>
            </div>

            <div
              className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${
                isTimeRunningOut ? "text-status-danger animate-pulse" : "text-text-secondary"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </div>
          </div>

          <div className="rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 p-4 text-foreground font-medium text-sm leading-relaxed mb-4 relative">
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
              placeholder="Nhập hoặc nhấn micro để nói câu trả lời phản biện (nêu rõ luận điểm, số liệu dẫn chứng và khẳng định tính khả thi)..."
              rows={3}
              className="w-full rounded-xl border border-border bg-surface p-3 pr-10 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            />
            <button
              type="button"
              onClick={toggleVoiceDictation}
              className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
                isVoiceDictating
                  ? "bg-rose-500 text-white animate-pulse shadow-md"
                  : "bg-surface-subtle text-text-muted hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title={isVoiceDictating ? "Đang lắng nghe... Nhấn để dừng" : "Nhấn để trả lời bằng giọng nói (STT)"}
            >
              {isVoiceDictating ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-text-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
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
