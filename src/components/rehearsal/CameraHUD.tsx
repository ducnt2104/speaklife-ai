"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, ShieldCheck, Eye, Volume2, Mic, AlertCircle } from "lucide-react";
import { computeGazeAngle } from "@/lib/vision/gaze-tracker";

export interface CameraHUDProps {
  isPracticing: boolean;
  onMetricsUpdate?: (metrics: {
    eyeContactRatio: number;
    wpm: number;
    dbLevel: number;
    postureStable: boolean;
  }) => void;
  className?: string;
  onPermissionDenied?: () => void;
}

export const CameraHUD: React.FC<CameraHUDProps> = ({
  isPracticing,
  onMetricsUpdate,
  className = "",
  onPermissionDenied
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [eyeContactRatio, setEyeContactRatio] = useState<number>(0);
  const [dbLevel, setDbLevel] = useState<number>(-60);
  const [wpm, setWpm] = useState<number>(0);
  const [isGazeCentered, setIsGazeCentered] = useState<boolean>(false);

  // Initialize Camera & Microphone Stream
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
          audio: true
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);

        // Initialize Web Audio API for RMS Volume Tracking
        try {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
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
            requestAnimationFrame(checkAudio);
          };
          checkAudio();
        } catch (audioErr) {
          console.warn("Web Audio API initialization failed:", audioErr);
        }
      } catch (err) {
        console.warn("Media permissions denied or camera not found:", err);
        if (isMounted) {
          setHasPermission(false);
          onPermissionDenied?.();
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
        audioContextRef.current.close();
      }
    };
  }, [onPermissionDenied]);

  // Periodic metrics pulse to parent
  useEffect(() => {
    if (!isPracticing) return;
    const interval = setInterval(() => {
      onMetricsUpdate?.({
        eyeContactRatio,
        wpm,
        dbLevel,
        postureStable: true
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPracticing, eyeContactRatio, wpm, dbLevel, onMetricsUpdate]);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-border shadow-lg ${className}`}>
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover min-h-[260px] max-h-[420px] scale-x-[-1]" // Mirrored for natural selfie view
      />

      {/* Target Gaze Aperture (Visual Eye-Contact Center Guide) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-28 h-28 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
          isGazeCentered
            ? "border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            : "border-amber-400/60 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        }`}>
          <div className={`w-3 h-3 rounded-full transition-colors ${isGazeCentered ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
        </div>
      </div>

      {/* Zero-Data Retention Security Banner */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 text-[11px] text-emerald-300">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-medium">Zero-Data RAM Processing</span>
      </div>

      {/* Real-time HUD Metrics Bar (Bottom) */}
      <div className="absolute bottom-3 inset-x-3 z-10 grid grid-cols-3 gap-2 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/60 text-white">
        {/* Eye Contact Ratio */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600/30 flex items-center justify-center text-violet-400 shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Eye Contact</div>
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
            <div className="text-sm font-mono font-bold text-white">{wpm}</div>
          </div>
        </div>

        {/* Audio Decibels */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-600/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Âm lượng</div>
            <div className="text-sm font-mono font-bold text-cyan-400">{dbLevel} dB</div>
          </div>
        </div>
      </div>

      {/* Permission Denied Fallback UI */}
      {hasPermission === false && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
          <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
          <h4 className="font-heading font-semibold text-base">Chưa kết nối Camera</h4>
          <p className="text-xs text-slate-300 max-w-xs mt-1">
            Vui lòng cấp quyền truy cập webcam trong thanh địa chỉ trình duyệt để kích hoạt phân tích thị giác biên.
          </p>
        </div>
      )}
    </div>
  );
};
