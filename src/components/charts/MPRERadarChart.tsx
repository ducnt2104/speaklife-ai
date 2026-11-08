"use client";

import React from "react";
import { DimensionScoreResult } from "@/lib/rubric/mpre-calculator";

export interface MPRERadarChartProps {
  dimensions: {
    bodyLanguage: DimensionScoreResult;
    voiceProsody: DimensionScoreResult;
    fillerWords: DimensionScoreResult;
    contentLogic: DimensionScoreResult;
    rebuttalReflex: DimensionScoreResult;
  };
  className?: string;
}

export const MPRERadarChart: React.FC<MPRERadarChartProps> = React.memo(({
  dimensions,
  className = ""
}) => {
  const size = 320;
  const center = size / 2;
  const radius = center - 48; // Leave margin for labels

  const axes = [
    { key: "bodyLanguage", label: "Ngôn ngữ cơ thể", data: dimensions.bodyLanguage },
    { key: "voiceProsody", label: "Tiết tấu giọng nói", data: dimensions.voiceProsody },
    { key: "fillerWords", label: "Kiểm soát từ đệm", data: dimensions.fillerWords },
    { key: "contentLogic", label: "Cấu trúc & Logic", data: dimensions.contentLogic },
    { key: "rebuttalReflex", label: "Phản xạ phản biện", data: dimensions.rebuttalReflex }
  ];

  const angleStep = (Math.PI * 2) / axes.length;

  // Grid Rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Calculate polygon points for user scores
  const scorePoints = axes.map((axis, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const ratio = Math.max(0.1, axis.data.score / axis.data.maxPoints);
    const x = center + Math.cos(angle) * (radius * ratio);
    const y = center + Math.sin(angle) * (radius * ratio);
    return `${x},${y}`;
  }).join(" ");

  // Target standard line (75% benchmark)
  const targetPoints = axes.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + Math.cos(angle) * (radius * 0.75);
    const y = center + Math.sin(angle) * (radius * 0.75);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className={`relative flex flex-col items-center justify-center p-2 ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[340px] h-auto overflow-visible select-none"
        role="img"
        aria-label="Biểu đồ Radar 5 trục Năng lực Thuyết trình Đa chiều MPRE"
      >
        {/* Background Grid Rings */}
        {rings.map((ringRatio, rIdx) => {
          const rPoints = axes.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + Math.cos(angle) * (radius * ringRatio);
            const y = center + Math.sin(angle) * (radius * ringRatio);
            return `${x},${y}`;
          }).join(" ");

          return (
            <polygon
              key={rIdx}
              points={rPoints}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={ringRatio === 0.75 ? "1.5" : "1"}
              strokeDasharray={ringRatio === 0.75 ? "3,3" : undefined}
            />
          );
        })}

        {/* Axis Lines */}
        {axes.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          );
        })}

        {/* Target 75% Benchmark Line (Green dashed) */}
        <polygon
          points={targetPoints}
          fill="none"
          stroke="#10B981"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />

        {/* User Score Polygon (Violet filled) */}
        <polygon
          points={scorePoints}
          fill="rgba(124, 58, 237, 0.25)"
          stroke="#7C3AED"
          strokeWidth="2.5"
        />

        {/* Score Vertex Dots */}
        {axes.map((axis, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const ratio = Math.max(0.1, axis.data.score / axis.data.maxPoints);
          const x = center + Math.cos(angle) * (radius * ratio);
          const y = center + Math.sin(angle) * (radius * ratio);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4.5"
              fill="#FFFFFF"
              stroke="#7C3AED"
              strokeWidth="2.5"
            />
          );
        })}

        {/* Axis Labels */}
        {axes.map((axis, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDist = radius + 24;
          const x = center + Math.cos(angle) * labelDist;
          const y = center + Math.sin(angle) * labelDist;
          const isTopOrBottom = Math.abs(Math.sin(angle)) > 0.8;

          return (
            <text
              key={i}
              x={x}
              y={y + (isTopOrBottom ? (y < center ? -2 : 6) : 3)}
              textAnchor="middle"
              className="text-[11px] font-heading font-medium fill-slate-700 select-none"
            >
              {axis.label}
              <tspan className="font-mono font-bold fill-primary" dx="4">
                ({axis.data.score}/{axis.data.maxPoints})
              </tspan>
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary" />
          <span>Điểm số của bạn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 border-b border-dashed border-emerald-500" />
          <span>Chuẩn mục tiêu (75%)</span>
        </div>
      </div>
    </div>
  );
});

MPRERadarChart.displayName = "MPRERadarChart";
