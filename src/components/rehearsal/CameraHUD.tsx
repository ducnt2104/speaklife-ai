"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, ShieldCheck, Eye, Volume2, Mic, AlertCircle, RefreshCw, FlipHorizontal, Settings2 } from "lucide-react";
import { FastGazeAnalyzer, DetectionResult } from "@/lib/vision/face-detector";

export interface CameraHUDProps {
  isPracticing: boolean;
  externalWpm?: number;
  onMetricsUpdate?: (metrics: {
    eyeContactRatio: number;
    wpm: number;
    dbLevel: number;
    postureStable: boolean;
    pitchVariance?: number;
    silenceRatio?: number;
    loudnessZone?: string;
    loudnessAvgDbfs?: number;
    loudnessDynamicContrast?: number;
    loudnessOptimalPercent?: number;
    loudnessTooQuietPercent?: number;
    loudnessTooLoudPercent?: number;
    loudnessPeakDbfs?: number;
    loudnessScore?: number;
    loudnessFeedback?: string;
  }) => void;
  className?: string;
  onPermissionDenied?: () => void;
}

export const CameraHUD: React.FC<CameraHUDProps> = React.memo(({
  isPracticing,
  externalWpm = 0,
  onMetricsUpdate,
  className = "",
  onPermissionDenied,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<FastGazeAnalyzer | null>(null);
  const localAudioRef = useRef<any>(null);
  const loudnessRef = useRef<any>(null);

  // Hardware and Permission State
  const [hasVideoPermission, setHasVideoPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // Live Optical / Audio Telemetry
  const [eyeContactRatio, setEyeContactRatio] = useState<number>(0);
  const [dbLevel, setDbLevel] = useState<number>(-60);
  const [gazeStatus, setGazeStatus] = useState<"centered" | "distracted" | "noface">("noface");
  const [gazeAngles, setGazeAngles] = useState<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });

  // Frame Counters for Gaze Ratio
  const totalAnalyzedFrames = useRef<number>(0);
  const eyeContactFrames = useRef<number>(0);

  // Initialize Fast Gaze Analyzer
  useEffect(() => {
    analyzerRef.current = new FastGazeAnalyzer();
  }, []);

  // Enumerate Media Devices
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = allDevices.filter((d) => d.kind === "videoinput");
      setVideoDevices(cameras);
      if (cameras.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(cameras[0].deviceId);
      }
    } catch (e) {
      console.warn("Failed to enumerate devices:", e);
    }
  }, [selectedDeviceId]);

  // Request & Start Media Streams
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      // 1. Video Stream
      try {
        const videoConstraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
            : { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
        };
        const videoStream = await navigator.mediaDevices.getUserMedia(videoConstraints);

        if (!isMounted) {
          videoStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = videoStream;
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
        }
        setHasVideoPermission(true);
        refreshDevices();
      } catch (videoErr) {
        console.warn("Camera stream request failed:", videoErr);
        if (isMounted) {
          setHasVideoPermission(false);
          onPermissionDenied?.();
        }
      }

      // 2. Audio Stream (Separated for Fault Tolerance)
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          audioStream.getTracks().forEach((t) => t.stop());
          return;
        }
        setHasAudioPermission(true);

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(audioStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const pcmData = new Uint8Array(analyser.frequencyBinCount);

        const checkAudio = () => {
          if (!isMounted) return;
          analyser.getByteFrequencyData(pcmData);
          let sum = 0;
          for (let i = 0; i < pcmData.length; i++) {
            sum += pcmData[i];
          }
          const avg = sum / pcmData.length;
          const currentDb = Math.round(avg > 0 ? 20 * Math.log10(avg / 255) : -60);
          setDbLevel(currentDb);
          // Feed into Loudness Dynamics Engine
          if (loudnessRef.current) {
            loudnessRef.current.record(currentDb);
          }
          requestAnimationFrame(checkAudio);
        };
        checkAudio();

        // Start Local Audio AI (Meyda-based feature extraction)
        try {
          const { LocalAudioAnalyzer } = await import("@/lib/audio/local-audio-ai");
          const analyzer = new LocalAudioAnalyzer();
          await analyzer.start(audioStream);
          localAudioRef.current = analyzer;
        } catch (meydaErr) {
          console.warn("Local Audio AI (Meyda) failed to initialize, using fallback:", meydaErr);
        }

        // Start Loudness Dynamics Engine
        try {
          const { LoudnessDynamicsEngine } = await import("@/lib/audio/loudness-dynamics");
          loudnessRef.current = new LoudnessDynamicsEngine();
        } catch (loudnessErr) {
          console.warn("Loudness Dynamics Engine failed to initialize:", loudnessErr);
        }
      } catch (audioErr) {
        console.warn("Microphone stream request failed:", audioErr);
        if (isMounted) {
          setHasAudioPermission(false);
        }
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (localAudioRef.current) {
        localAudioRef.current.stop();
        localAudioRef.current = null;
      }
      if (loudnessRef.current) {
        loudnessRef.current.reset();
        loudnessRef.current = null;
      }
    };
  }, [selectedDeviceId, refreshDevices, onPermissionDenied]);

  // Live Real-Time Gaze Vector Analysis Loop (Runs at ~10 FPS when practicing)
  useEffect(() => {
    let animId: number;
    let lastCheck = 0;

    const processFrame = (timestamp: number) => {
      if (timestamp - lastCheck >= 100) {
        // ~10 FPS
        lastCheck = timestamp;
        if (videoRef.current && analyzerRef.current && isPracticing) {
          const result: DetectionResult = analyzerRef.current.analyzeFrame(videoRef.current);
          if (!result.hasFace) {
            setGazeStatus("noface");
          } else {
            totalAnalyzedFrames.current += 1;
            if (result.isMaintainingEyeContact) {
              eyeContactFrames.current += 1;
              setGazeStatus("centered");
            } else {
              setGazeStatus("distracted");
            }

            const currentRatio = Math.round(
              (eyeContactFrames.current / Math.max(1, totalAnalyzedFrames.current)) * 100
            );
            setEyeContactRatio(currentRatio);
            setGazeAngles({ yaw: result.gazeYawDegrees, pitch: result.gazePitchDegrees });
          }
        }
      }
      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animId);
  }, [isPracticing]);

  // Periodic Pulse to Parent
  useEffect(() => {
    if (!isPracticing) return;
    const interval = setInterval(() => {
      // Get enhanced metrics from Local Audio AI if available
      let pitchVariance: number | undefined;
      let silenceRatio: number | undefined;
      let loudnessZone: string | undefined;
      let loudnessAvgDbfs: number | undefined;
      let loudnessDynamicContrast: number | undefined;
      let loudnessOptimalPercent: number | undefined;
      let loudnessTooQuietPercent: number | undefined;
      let loudnessTooLoudPercent: number | undefined;
      let loudnessPeakDbfs: number | undefined;
      let loudnessScore: number | undefined;
      let loudnessFeedback: string | undefined;

      if (localAudioRef.current) {
        try {
          const audioMetrics = localAudioRef.current.getMetrics();
          pitchVariance = audioMetrics.pitchVariance;
          silenceRatio = audioMetrics.silenceRatio;
        } catch {
          // Fallback: no enhanced metrics
        }
      }

      if (loudnessRef.current) {
        try {
          const lm = loudnessRef.current.getMetrics();
          loudnessZone = lm.zone;
          loudnessAvgDbfs = lm.averageDbfs;
          loudnessDynamicContrast = lm.dynamicContrast;
          loudnessOptimalPercent = lm.optimalZonePercent;
          loudnessTooQuietPercent = lm.tooQuietPercent;
          loudnessTooLoudPercent = lm.tooLoudPercent;
          loudnessPeakDbfs = lm.peakDbfs;
          loudnessScore = lm.loudnessScore;
          loudnessFeedback = lm.loudnessFeedback;
        } catch {
          // Fallback
        }
      }

      onMetricsUpdate?.({
        eyeContactRatio,
        wpm: externalWpm,
        dbLevel,
        postureStable: gazeStatus !== "distracted",
        pitchVariance,
        silenceRatio,
        loudnessZone,
        loudnessAvgDbfs,
        loudnessDynamicContrast,
        loudnessOptimalPercent,
        loudnessTooQuietPercent,
        loudnessTooLoudPercent,
        loudnessPeakDbfs,
        loudnessScore,
        loudnessFeedback,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPracticing, eyeContactRatio, externalWpm, dbLevel, gazeStatus, onMetricsUpdate]);

  // Calculate dynamic border glow based on eye contact and face presence
  const statusColor =
    gazeStatus === "centered" && eyeContactRatio >= 65
      ? "text-emerald-400 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.35)]"
      : gazeStatus === "distracted"
      ? "text-amber-400 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.35)]"
      : "text-rose-400 border-rose-500/80 shadow-[0_0_25px_rgba(239,68,68,0.3)]";

  // Equalizer amplitude calculation
  const normalizedDb = Math.min(100, Math.max(0, (dbLevel + 60) * 2.2)); // map -60..-15 dB to 0..100%

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-950 border-2 transition-all duration-500 ${statusColor} ${className}`}
    >
      {/* Sci-Fi HUD Reticle Brackets (4 Corners) */}
      <div className="hud-corner-tl" />
      <div className="hud-corner-tr" />
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      {/* Video Stream Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover min-h-[260px] max-h-[420px] transition-transform ${
          isMirrored ? "scale-x-[-1]" : "scale-x-100"
        }`}
      />

      {/* Target Gaze Aperture (Visual Eye-Contact Center Guide) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-28 h-28 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
            gazeStatus === "centered"
              ? "border-emerald-400 bg-emerald-500/15 shadow-[0_0_30px_rgba(16,185,129,0.6)] scale-105"
              : gazeStatus === "distracted"
              ? "border-amber-400/80 bg-amber-500/10 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
              : "border-rose-500/60 bg-rose-500/10 shadow-[0_0_20px_rgba(239,68,68,0.35)]"
          }`}
        >
          {/* Outer Crosshair Ticks */}
          <div className="absolute w-full h-[1px] bg-current opacity-30" />
          <div className="absolute h-full w-[1px] bg-current opacity-30" />

          <div
            className={`w-3.5 h-3.5 rounded-full transition-colors ${
              gazeStatus === "centered"
                ? "bg-emerald-400 animate-ping"
                : gazeStatus === "distracted"
                ? "bg-amber-400"
                : "bg-rose-400"
            }`}
          />
        </div>
      </div>

      {/* Audio Visualizer Equalizer Waves (Across Video Bottom) */}
      <div className="absolute bottom-16 inset-x-4 h-6 flex items-end justify-center gap-1 pointer-events-none z-10 opacity-80">
        {[0.4, 0.7, 0.9, 1.2, 0.8, 1.4, 1.1, 0.6, 0.9, 1.3, 0.7, 1.1, 0.8, 1.2, 0.5, 0.9].map((mult, idx) => {
          const heightPct = dbLevel > -55 ? Math.min(100, Math.max(12, normalizedDb * mult * (0.6 + Math.sin(idx + Date.now() / 300) * 0.3))) : 8;
          return (
            <div
              key={idx}
              className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-75"
              style={{
                height: `${heightPct}%`,
                opacity: dbLevel > -55 ? 0.9 : 0.25,
              }}
            />
          );
        })}
      </div>

      {/* Top Controls Bar */}
      <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-auto">
        {/* Zero-Data Security Badge */}
        <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 text-[11px] text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium">Zero-Data Edge Vision</span>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1 rounded-full border border-slate-700">
          {videoDevices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-transparent text-[11px] text-slate-300 px-2 py-0.5 rounded outline-none cursor-pointer max-w-[110px] truncate"
            >
              {videoDevices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId} className="bg-slate-900 text-white">
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            className="p-1 text-slate-300 hover:text-white rounded-full transition-colors"
            title={isMirrored ? "Xem chuẩn (Tắt lật gương)" : "Lật gương selfie"}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time HUD Metrics Bar (Bottom) */}
      <div className="absolute bottom-3 inset-x-3 z-10 grid grid-cols-3 gap-2 glass-panel p-2.5 rounded-xl border border-white/10 text-white shadow-2xl">
        {/* Eye Contact Ratio */}
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              gazeStatus === "centered" ? "bg-emerald-600/30 text-emerald-400" : "bg-violet-600/30 text-violet-400"
            }`}
          >
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Giao tiếp mắt</div>
            <div className="text-sm font-mono font-bold text-emerald-400">{eyeContactRatio}%</div>
          </div>
        </div>

        {/* WPM Cadence */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-600/30 flex items-center justify-center text-pink-400 shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Nhịp nói (WPM)</div>
            <div className="text-sm font-mono font-bold text-white">{externalWpm}</div>
          </div>
        </div>

        {/* Audio Decibels */}
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              dbLevel > -45 ? "bg-cyan-600/30 text-cyan-400" : "bg-slate-700/30 text-slate-400"
            }`}
          >
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Âm lượng</div>
            <div className="text-sm font-mono font-bold text-cyan-400">{dbLevel} dB</div>
          </div>
        </div>
      </div>

      {/* Permission Denied Fallback UI */}
      {hasVideoPermission === false && (
        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-20">
          <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
          <h4 className="font-heading font-semibold text-base">Chưa kết nối Camera</h4>
          <p className="text-xs text-slate-300 max-w-xs mt-1">
            Vui lòng cấp quyền truy cập webcam trong thanh địa chỉ trình duyệt để kích hoạt phân tích thị giác biên.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      )}
    </div>
  );
});

CameraHUD.displayName = "CameraHUD";
