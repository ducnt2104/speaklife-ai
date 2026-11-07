"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Award, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { VirtualAuditorium } from "@/components/3d/VirtualAuditorium";
import { CameraHUD } from "@/components/rehearsal/CameraHUD";
import { AIJudgePanel } from "@/components/evaluation/AIJudgePanel";
import { calculateMPREScore } from "@/lib/rubric/mpre-calculator";
import { PRACTICE_SCENARIOS, DIFFICULTY_TIERS } from "@/lib/constants/scenarios";

export default function RehearsePage() {
  const router = useRouter();

  const [scenarioId, setScenarioId] = useState("stem_khkt");
  const [difficultyId, setDifficultyId] = useState("standard");
  const [outlineTitle, setOutlineTitle] = useState("");

  // Rehearsal State Lifecycle: "ready" -> "presenting" -> "qna" -> "completed"
  const [rehearsalPhase, setRehearsalPhase] = useState<"ready" | "presenting" | "qna" | "completed">("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Live Metrics — initialize at zero, updated from real sensor data
  const [eyeContactRatio, setEyeContactRatio] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [dbLevel, setDbLevel] = useState(-60);
  const [fillerCount, setFillerCount] = useState(0);
  const [audienceReaction, setAudienceReaction] = useState<"neutral" | "attentive" | "distracted" | "applause">("neutral");

  // Q&A State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [rebuttalRounds, setRebuttalRounds] = useState<Array<{ reactionTimeSeconds: number; score: number }>>([]);
  const [isEvaluatingRebuttal, setIsEvaluatingRebuttal] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const scenario = PRACTICE_SCENARIOS.find((s) => s.id === scenarioId) || PRACTICE_SCENARIOS[1];
  const difficulty = DIFFICULTY_TIERS.find((d) => d.id === difficultyId) || DIFFICULTY_TIERS[1];

  // Fallback questions in case AI API is unavailable
  const fallbackQuestions = [
    "Giải pháp của nhóm có thể áp dụng trong điều kiện thực tế phòng học thiếu sáng hay thiết bị yếu không? Hãy giải thích cơ sở kỹ thuật.",
    "Kết quả thử nghiệm trên 30 học sinh có đủ đại diện để khái quát hóa kết luận không? Nhóm đã xử lý yếu tố sai lệch mẫu như thế nào?"
  ];

  const currentQuestions = aiQuestions.length > 0 ? aiQuestions : fallbackQuestions;

  useEffect(() => {
    // Read session storage configuration if set
    if (typeof window !== "undefined") {
      const s = sessionStorage.getItem("speaklife_scenario");
      const d = sessionStorage.getItem("speaklife_difficulty");
      const t = sessionStorage.getItem("speaklife_outline_title");
      if (s) setScenarioId(s);
      if (d) setDifficultyId(d);
      if (t) setOutlineTitle(t);
    }
  }, []);

  // Practice Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rehearsalPhase === "presenting" && !isPaused) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [rehearsalPhase, isPaused]);

  // Dynamic Audience Reaction Engine based on eye contact and speech cadence
  useEffect(() => {
    if (rehearsalPhase === "presenting") {
      if (eyeContactRatio >= 75 && wpm >= 120 && wpm <= 145) {
        setAudienceReaction("attentive");
      } else if (eyeContactRatio < 50 || wpm < 100 || wpm > 165) {
        setAudienceReaction("distracted");
      } else {
        setAudienceReaction("neutral");
      }
    } else if (rehearsalPhase === "completed") {
      setAudienceReaction("applause");
    }
  }, [rehearsalPhase, eyeContactRatio, wpm]);

  const handleStartSpeaking = () => {
    setRehearsalPhase("presenting");
    setIsPaused(false);
  };

  const handleFinishSpeaking = async () => {
    // Transition to Stage 3: Adversarial AI Q&A
    setRehearsalPhase("qna");
    setAudienceReaction("neutral");
    setIsLoadingQuestions(true);

    // Fetch real questions from AI Judge API
    try {
      const outlineContent = typeof window !== "undefined" 
        ? sessionStorage.getItem("speaklife_outline_content") || ""
        : "";
      
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: outlineTitle,
          scenario: scenarioId,
          difficulty: difficultyId,
          outlineText: outlineContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setAiQuestions(data.questions.map((q: any) => q.questionText));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch AI questions, using fallback:", err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleRebuttalSubmit = async (answerText: string, reactionSeconds: number) => {
    setIsEvaluatingRebuttal(true);

    let roundScore = 12; // Default score

    // Call real evaluation API
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: `q${currentQuestionIndex + 1}`,
          questionText: currentQuestions[currentQuestionIndex] || "",
          targetedFlaw: "Đánh giá phản biện",
          userAnswer: answerText,
          responseTimeSec: reactionSeconds,
        }),
      });

      if (res.ok) {
        const evaluation = await res.json();
        if (evaluation.score !== undefined) {
          roundScore = Math.round(evaluation.score * 1.5); // Scale 0-10 to 0-15
        }
      }
    } catch (err) {
      console.warn("Failed to evaluate rebuttal, using heuristic:", err);
      roundScore = Math.min(15, Math.max(8, 15 - Math.round(reactionSeconds * 0.5)));
    }

    const updatedRounds = [...rebuttalRounds, { reactionTimeSeconds: reactionSeconds, score: roundScore }];
    setRebuttalRounds(updatedRounds);
    setIsEvaluatingRebuttal(false);

    if (currentQuestionIndex + 1 < difficulty.rebuttalCount && currentQuestionIndex + 1 < currentQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Complete rehearsal and navigate to report
      setRehearsalPhase("completed");
      setAudienceReaction("applause");

      // Compute finalized MPRE diagnostic score
      const evaluation = calculateMPREScore({
        durationSeconds: Math.max(30, elapsedSeconds),
        totalWords: Math.round((Math.max(30, elapsedSeconds) / 60) * (wpm || 120)),
        faceDetectedFrames: 900,
        totalAnalyzedFrames: 900,
        eyeContactFrames: Math.round(900 * (eyeContactRatio / 100)),
        shoulderTiltVariance: 4,
        averageRmsDecibels: dbLevel,
        pitchF0StdDev: 16,
        fillerWordCount: fillerCount,
        aiContentScore: 18,
        rebuttalRounds: updatedRounds
      });

      sessionStorage.setItem("speaklife_final_report", JSON.stringify(evaluation));
      
      // Also save to server if possible
      try {
        await fetch("/api/report/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: `local_${Date.now()}`,
            durationSeconds: Math.max(30, elapsedSeconds),
            eyeContactRatio: eyeContactRatio / 100,
            averageWpm: wpm || 120,
            fillerOccurrences: [],
            rebuttalRounds: updatedRounds,
          }),
        });
      } catch {
        // Report saved locally even if server save fails
      }

      router.push("/report");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Rehearsal Room Stage Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-danger animate-pulse" />
            <h2 className="font-heading font-bold text-foreground text-lg">{outlineTitle}</h2>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Bối cảnh: {scenario.title} • {difficulty.label} ({difficulty.judgeName})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Timer Clock */}
          <div className="font-mono text-xl font-bold bg-slate-900 text-emerald-400 px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-inner">
            {formatTime(elapsedSeconds)}
          </div>

          {rehearsalPhase === "ready" && (
            <Button variant="primary" size="md" onClick={handleStartSpeaking} className="shadow-md">
              <Play className="w-4 h-4 fill-current mr-1" />
              <span>Bắt đầu thuyết trình</span>
            </Button>
          )}

          {rehearsalPhase === "presenting" && (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleFinishSpeaking}
                className="shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current mr-1.5" />
                <span>Kết thúc bài nói</span>
              </Button>
            </>
          )}

          {rehearsalPhase === "qna" && (
            <Badge variant="warning" className="px-3 py-1.5 text-xs font-semibold">
              Giai đoạn 3: Giám khảo AI Phản biện
            </Badge>
          )}
        </div>
      </div>

      {/* Main Dual Stage: 3D Auditorium (Left) + Camera & Vision HUD (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Virtual Auditorium (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <VirtualAuditorium
            audienceReaction={audienceReaction}
            className="w-full aspect-video min-h-[380px]"
          />

          {/* Quick Context Tip */}
          <div className="bg-surface p-4 rounded-xl border border-border text-xs text-text-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cơ chế Zero-Data: Không có khung hình video nào được lưu trên máy chủ.</span>
            </div>
            <span className="font-mono text-emerald-600 font-semibold">30 FPS WebAssembly</span>
          </div>
        </div>

        {/* Right Column: Camera HUD or AI Judge (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {rehearsalPhase !== "qna" ? (
            <CameraHUD
              isPracticing={rehearsalPhase === "presenting" && !isPaused}
              onMetricsUpdate={(m) => {
                setEyeContactRatio(m.eyeContactRatio);
                setWpm(m.wpm);
                setDbLevel(m.dbLevel);
              }}
              className="w-full"
            />
          ) : (
            <AIJudgePanel
              judgeName={difficulty.judgeName}
              judgeTitle={difficulty.judgeTitle}
              scenarioTitle={scenario.title}
              currentQuestion={currentQuestions[currentQuestionIndex] || currentQuestions[0]}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={difficulty.rebuttalCount}
              timerSeconds={difficulty.questionTimerSeconds}
              isEvaluating={isEvaluatingRebuttal}
              onAnswerSubmit={handleRebuttalSubmit}
              className="w-full"
            />
          )}

          {/* Practice Guidance Card */}
          <Card className="p-4 bg-surface text-xs space-y-2">
            <h4 className="font-heading font-semibold text-foreground flex items-center gap-1.5">
              <span>Mẹo thực chiến:</span>
            </h4>
            <ul className="space-y-1.5 text-text-secondary list-disc pl-4 leading-relaxed">
              <li>Nhìn thẳng vào tâm vòng tròn webcam để khán giả ảo gật đầu đồng tình.</li>
              <li>Giữ tốc độ 120 - 145 từ/phút; tránh nói vội hoặc thì thào.</li>
              <li>Khi chuyển ý, hãy hít thở nhẹ 1 nhịp thay vì chêm từ &ldquo;à, ừm&rdquo;.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
