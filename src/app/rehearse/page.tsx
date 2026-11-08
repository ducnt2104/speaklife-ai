"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Award, ShieldCheck, CheckCircle2, ArrowRight, Mic, Volume2 } from "lucide-react";
import { Button, Card, Badge, MathText } from "@/components/ui";
import { calculateMPREScore } from "@/lib/rubric/mpre-calculator";
import { PRACTICE_SCENARIOS, DIFFICULTY_TIERS } from "@/lib/constants/scenarios";
import { detectFillerWords } from "@/lib/audio/filler-detector";

// ── Dynamic imports for heavy components (code-split) ──
// Three.js VirtualAuditorium (~509 KB) — loaded only when rehearse page mounts
const VirtualAuditorium = dynamic(
  () => import("@/components/3d/VirtualAuditorium").then(m => ({ default: m.VirtualAuditorium })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[360px] bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-slate-400 text-sm">Đang tải Khán phòng 3D...</span>
      </div>
    ),
  }
);

// CameraHUD — webcam/audio processing, no SSR
const CameraHUD = dynamic(
  () => import("@/components/rehearsal/CameraHUD").then(m => ({ default: m.CameraHUD })),
  { ssr: false, loading: () => <div className="w-full h-64 bg-slate-800 rounded-xl animate-pulse" /> }
);

// AIJudgePanel — TTS/STT, no SSR
const AIJudgePanel = dynamic(
  () => import("@/components/evaluation/AIJudgePanel").then(m => ({ default: m.AIJudgePanel })),
  { ssr: false }
);

export default function RehearsePage() {
  const router = useRouter();

  const [scenarioId, setScenarioId] = useState("stem_khkt");
  const [difficultyId, setDifficultyId] = useState("standard");
  const [outlineTitle, setOutlineTitle] = useState("");

  // Rehearsal State Lifecycle: "ready" -> "presenting" -> "qna" -> "completed"
  const [rehearsalPhase, setRehearsalPhase] = useState<"ready" | "presenting" | "qna" | "completed">("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Live Metrics — updated continuously from sensors & audio recognition
  const [eyeContactRatio, setEyeContactRatio] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [dbLevel, setDbLevel] = useState(-60);
  const [fillerCount, setFillerCount] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [audienceReaction, setAudienceReaction] = useState<"neutral" | "attentive" | "distracted" | "applause">("neutral");

  // Accumulated filler instances for report (with timestamps)
  const fillerInstancesRef = useRef<Array<{ word: string; timestampSec: number; contextSnippet: string }>>([]);

  // Q&A State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [rebuttalRounds, setRebuttalRounds] = useState<Array<{ reactionTimeSeconds: number; score: number }>>([]);
  const [isEvaluatingRebuttal, setIsEvaluatingRebuttal] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const recognizerRef = useRef<any>(null);

  const scenario = PRACTICE_SCENARIOS.find((s) => s.id === scenarioId) || PRACTICE_SCENARIOS[1];
  const difficulty = DIFFICULTY_TIERS.find((d) => d.id === difficultyId) || DIFFICULTY_TIERS[1];

  // Dynamic contextual fallback questions (strictly based on the user's topic)
  const fallbackQuestions = [
    `Đối với đề tài "${outlineTitle || "nghiên cứu"}", nhóm có thể làm rõ cơ sở thực nghiệm và thông số chứng minh tính ổn định khi triển khai thực tế không?`,
    `Trong bài thuyết trình, nhóm đã kiểm soát sai số thực nghiệm và các rủi ro kỹ thuật phát sinh như thế nào?`,
  ];

  const currentQuestions = aiQuestions.length > 0 ? aiQuestions : fallbackQuestions;

  useEffect(() => {
    // Read session storage configuration if set
    if (typeof window !== "undefined") {
      const s = sessionStorage.getItem("speaklife_scenario");
      const d = sessionStorage.getItem("speaklife_difficulty");
      const t = sessionStorage.getItem("speaklife_outline_title");
      const preQuestions = sessionStorage.getItem("speaklife_ai_questions");

      if (s) setScenarioId(s);
      if (d) setDifficultyId(d);
      if (t) setOutlineTitle(t);

      if (preQuestions) {
        try {
          const parsed = JSON.parse(preQuestions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAiQuestions(parsed.map((q: any) => q.questionText || q.question || String(q)));
          }
        } catch {}
      } else {
        // Pre-fetch AI questions immediately in background so they are ready on speech finish
        const outlineContent = sessionStorage.getItem("speaklife_outline_content") || "";
        if (outlineContent.trim()) {
          fetch("/api/judge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: t || "Đề tài nghiên cứu khoa học kỹ thuật",
              scenario: s || "stem_khkt",
              difficulty: d || "standard",
              outlineText: outlineContent,
            }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.questions && data.questions.length > 0) {
                setAiQuestions(data.questions.map((q: any) => q.questionText));
                sessionStorage.setItem("speaklife_ai_questions", JSON.stringify(data.questions));
              }
            })
            .catch(() => {});
        }
      }
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

  // Dynamic WPM calculation (throttled — only on wordCount change, not every second)
  useEffect(() => {
    if (rehearsalPhase === "presenting" && elapsedSeconds > 2) {
      const currentWpm = Math.round((wordCount / (elapsedSeconds / 60)));
      setWpm(currentWpm);
    }
  }, [wordCount, elapsedSeconds, rehearsalPhase]);

  // Debounced Filler Word Detection (runs every 800ms on transcript change, NOT on every keystroke)
  useEffect(() => {
    if (rehearsalPhase !== "presenting" || !transcript) return;
    const timer = setTimeout(() => {
      const combined = (transcript + " " + interimText).trim();
      const fillerAnalysis = detectFillerWords(combined, Math.max(1, elapsedSeconds), "vi");
      setFillerCount(fillerAnalysis.totalFillers);
      // Store detailed instances for final report
      fillerInstancesRef.current = fillerAnalysis.instances.map(inst => ({
        word: inst.word,
        timestampSec: inst.timestampSeconds,
        contextSnippet: inst.matchedText,
      }));
    }, 800);
    return () => clearTimeout(timer);
  }, [transcript, rehearsalPhase, elapsedSeconds, interimText]);

  // Audio & Speech Recognizer Lifecycle (lazy-loaded)
  // STT runs via native Web Speech API (vi-VN) with interimResults for real-time display
  useEffect(() => {
    if (rehearsalPhase === "presenting" && !isPaused) {
      if (!recognizerRef.current) {
        import("@/lib/audio/speech-recognizer").then(({ SpeechRecognizer }) => {
          recognizerRef.current = new SpeechRecognizer({
            lang: "vi-VN",
            onTranscript: (fullText, interimText, totalWords) => {
              setTranscript(fullText);
              setInterimText(interimText);
              setWordCount(totalWords);
            },
          });
          recognizerRef.current.start();
        });
      } else {
        recognizerRef.current.start();
      }
    } else {
      recognizerRef.current?.stop();
    }

    return () => {
      recognizerRef.current?.stop();
    };
  }, [rehearsalPhase, isPaused]);

  // Dynamic Audience Reaction Engine & Procedural Sound Synthesis
  useEffect(() => {
    let cancelled = false;
    import("@/lib/audio/crowd-audio").then(({ CrowdAudioSynthesizer }) => {
      if (cancelled) return;
      const crowdAudio = CrowdAudioSynthesizer.getInstance();

      if (rehearsalPhase === "presenting") {
        if (eyeContactRatio >= 70 && wpm >= 115 && wpm <= 150) {
          setAudienceReaction("attentive");
          crowdAudio.stopMurmur();
        } else if (eyeContactRatio < 40 || (elapsedSeconds > 10 && wpm < 80) || wpm > 175) {
          setAudienceReaction("distracted");
          crowdAudio.startMurmur();
        } else {
          setAudienceReaction("neutral");
          crowdAudio.stopMurmur();
        }
      } else if (rehearsalPhase === "completed") {
        setAudienceReaction("applause");
        crowdAudio.playApplause(4.0);
      } else {
        crowdAudio.stopMurmur();
      }
    });
    return () => { cancelled = true; };
  }, [rehearsalPhase, eyeContactRatio, wpm, elapsedSeconds]);

  const handleStartSpeaking = () => {
    setRehearsalPhase("presenting");
    setIsPaused(false);
  };

  const handleFinishSpeaking = async () => {
    // Transition to Stage 3: Adversarial AI Q&A
    setRehearsalPhase("qna");
    setAudienceReaction("neutral");

    if (aiQuestions.length === 0) {
      setIsLoadingQuestions(true);

      // Fetch real questions from AI Judge API if not already pre-fetched
      try {
        const outlineContent =
          typeof window !== "undefined" ? sessionStorage.getItem("speaklife_outline_content") || "" : "";

        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: outlineTitle || "Đề tài nghiên cứu khoa học kỹ thuật",
            scenario: scenarioId,
            difficulty: difficultyId,
            outlineText: outlineContent,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            setAiQuestions(data.questions.map((q: any) => q.questionText));
            sessionStorage.setItem("speaklife_ai_questions", JSON.stringify(data.questions));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch AI questions, using dynamic fallback:", err);
      } finally {
        setIsLoadingQuestions(false);
      }
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
      import("@/lib/audio/crowd-audio").then(({ CrowdAudioSynthesizer }) => {
        CrowdAudioSynthesizer.getInstance().playApplause(4.5);
      });

      // Compute finalized MPRE diagnostic score
      const finalDuration = Math.max(30, elapsedSeconds);
      const finalWords = Math.max(wordCount, Math.round((finalDuration / 60) * (wpm || 120)));
      const finalTranscript = (transcript + " " + interimText).trim();
      const actualFillers = fillerInstancesRef.current;

      // Request AI content analysis in parallel (non-blocking for UX)
      let aiContentScore = 15; // Default before AI responds
      let aiAnalysis: any = null;
      try {
        const evalRes = await fetch("/api/ai/evaluate-presentation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: finalTranscript,
            durationSeconds: finalDuration,
            eyeContactRatio,
            averageWpm: wpm || 120,
            fillerOccurrences: actualFillers,
            shoulderTiltVariance: 4,
            averageRmsDecibels: dbLevel,
            presentationTitle: outlineTitle,
            scenario: scenarioId,
          }),
        });
        if (evalRes.ok) {
          const evalData = await evalRes.json();
          if (evalData.success && evalData.data) {
            aiContentScore = evalData.data.contentLogicScore ?? 15;
            aiAnalysis = evalData.data;
          }
        }
      } catch (evalErr) {
        console.warn("AI presentation evaluation unavailable, using heuristic:", evalErr);
      }

      const evaluation = calculateMPREScore({
        durationSeconds: finalDuration,
        totalWords: finalWords,
        faceDetectedFrames: 900,
        totalAnalyzedFrames: 900,
        eyeContactFrames: Math.round(900 * (eyeContactRatio / 100)),
        shoulderTiltVariance: 4,
        averageRmsDecibels: dbLevel,
        pitchF0StdDev: 16,
        fillerWordCount: fillerCount,
        aiContentScore,
        rebuttalRounds: updatedRounds,
      });

      // Merge AI analysis into evaluation for rich report display
      const enrichedEvaluation = {
        ...evaluation,
        aiAnalysis,
        transcript: finalTranscript,
        fillerInstances: actualFillers,
      };

      sessionStorage.setItem("speaklife_final_report", JSON.stringify(enrichedEvaluation));
      sessionStorage.setItem("speaklife_final_transcript", finalTranscript);

      // Also save to server if possible — with REAL telemetry data
      try {
        await fetch("/api/report/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: `local_${Date.now()}`,
            durationSeconds: finalDuration,
            eyeContactRatio: eyeContactRatio / 100,
            averageWpm: wpm || 120,
            fillerOccurrences: actualFillers,
            rebuttalRounds: updatedRounds,
            aiContentScore,
            title: outlineTitle,
            scenario: scenarioId,
            difficulty: difficultyId,
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
            <h2 className="font-heading font-bold text-foreground text-lg">
              <MathText text={outlineTitle || "Thuyết trình Đề tài KHKT Quốc Gia"} inline />
            </h2>
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
              <Button variant="outline" size="md" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <Play className="w-4 h-4 fill-current mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
              </Button>
              <Button variant="danger" size="md" onClick={handleFinishSpeaking} className="shadow-sm">
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
          <VirtualAuditorium audienceReaction={audienceReaction} className="w-full aspect-video min-h-[380px]" />

          {/* Real-time Subtitles / Telemetry Bar */}
          <div className="bg-surface p-4 rounded-xl border border-border text-xs text-text-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary shrink-0" />
              <span className="line-clamp-1">
                {transcript || interimText
                  ? <>
                      &ldquo;{transcript.slice(-50)}
                      {interimText && <span className="text-primary/60 italic">{interimText.slice(-30)}</span>}
                      &rdquo;
                    </>
                  : "Micro đang lắng nghe nhận diện giọng nói tiếng Việt..."
                }
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
              <span className="text-amber-500 font-semibold">Từ đệm: {fillerCount}</span>
              <span className="text-emerald-500 font-semibold">Tổng từ: {wordCount}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Camera HUD or AI Judge (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {rehearsalPhase !== "qna" ? (
            <CameraHUD
              isPracticing={rehearsalPhase === "presenting" && !isPaused}
              externalWpm={wpm}
              onMetricsUpdate={(m) => {
                setEyeContactRatio(m.eyeContactRatio);
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
