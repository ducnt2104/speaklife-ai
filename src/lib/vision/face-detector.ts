// SpeakLife AI — Zero-Latency Edge Facial & Gaze Detection
// Operates directly on HTMLVideoElement canvas frames in RAM
// Zero video/image frames sent over network (Zero-Data Architecture)

import { Point3D, computeGazeAngle, GazeFrameResult } from "./gaze-tracker";

export interface DetectionResult {
  hasFace: boolean;
  isMaintainingEyeContact: boolean;
  gazeYawDegrees: number;
  gazePitchDegrees: number;
  confidence: number;
  faceRect?: { x: number; y: number; width: number; height: number };
}

// Fallback high-speed optical centroid analyzer
export class FastGazeAnalyzer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private sampleWidth: number = 160;
  private sampleHeight: number = 120;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.sampleWidth;
    this.canvas.height = this.sampleHeight;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  public analyzeFrame(video: HTMLVideoElement): DetectionResult {
    if (!this.ctx || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
      return {
        hasFace: false,
        isMaintainingEyeContact: false,
        gazeYawDegrees: 0,
        gazePitchDegrees: 0,
        confidence: 0,
      };
    }

    // Downscale frame onto sample canvas for microsecond latency
    this.ctx.drawImage(video, 0, 0, this.sampleWidth, this.sampleHeight);
    const imgData = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
    const data = imgData.data;

    let skinPixels = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = this.sampleWidth;
    let maxX = 0;
    let minY = this.sampleHeight;
    let maxY = 0;

    // Skin-chrominance filtering (YCbCr approximation in RGB)
    for (let y = 0; y < this.sampleHeight; y++) {
      for (let x = 0; x < this.sampleWidth; x++) {
        const idx = (y * this.sampleWidth + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Standard human skin color distribution rule
        const isSkin =
          r > 60 &&
          g > 40 &&
          b > 20 &&
          r > g &&
          r > b &&
          r - g >= 10 &&
          r - b >= 10 &&
          Math.max(r, g, b) - Math.min(r, g, b) >= 15;

        if (isSkin) {
          skinPixels++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const minSkinThreshold = (this.sampleWidth * this.sampleHeight) * 0.04; // at least 4% skin
    if (skinPixels < minSkinThreshold) {
      return {
        hasFace: false,
        isMaintainingEyeContact: false,
        gazeYawDegrees: 0,
        gazePitchDegrees: 0,
        confidence: 0,
      };
    }

    // Facial centroid
    const centroidX = sumX / skinPixels;
    const centroidY = sumY / skinPixels;

    // Center of screen
    const centerX = this.sampleWidth / 2;
    const centerY = this.sampleHeight / 2;

    // Normalized displacement from center (-1.0 to 1.0)
    const normDispX = (centroidX - centerX) / (this.sampleWidth / 2);
    const normDispY = (centroidY - centerY) / (this.sampleHeight / 2);

    // Approximate yaw/pitch angles in degrees
    const gazeYawDegrees = Math.round(normDispX * 45 * 10) / 10;
    const gazePitchDegrees = Math.round(normDispY * 35 * 10) / 10;

    // Eye contact tolerance cone: |yaw| <= 16° and |pitch| <= 18°
    const isEyeContact = Math.abs(gazeYawDegrees) <= 16 && Math.abs(gazePitchDegrees) <= 18;

    return {
      hasFace: true,
      isMaintainingEyeContact: isEyeContact,
      gazeYawDegrees,
      gazePitchDegrees,
      confidence: Math.min(1.0, skinPixels / (this.sampleWidth * this.sampleHeight * 0.2)),
      faceRect: {
        x: minX / this.sampleWidth,
        y: minY / this.sampleHeight,
        width: (maxX - minX) / this.sampleWidth,
        height: (maxY - minY) / this.sampleHeight,
      },
    };
  }
}
