"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export interface VirtualAuditoriumProps {
  audienceReaction: "neutral" | "attentive" | "distracted" | "applause";
  className?: string;
  onWebGLError?: () => void;
}

export const VirtualAuditorium: React.FC<VirtualAuditoriumProps> = ({
  audienceReaction = "neutral",
  className = "",
  onWebGLError,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const reactionRef = useRef(audienceReaction);
  reactionRef.current = audienceReaction;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number;

    try {
      // 1. Scene, Camera, Renderer Setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0f1d); // Deep Arena Midnight Blue
      scene.fog = new THREE.FogExp2(0x0a0f1d, 0.035);

      const width = container.clientWidth || 640;
      const height = container.clientHeight || 360;

      const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 120);
      camera.position.set(0, 1.8, 4.2); // Presenter viewpoint looking out over amphitheater

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.appendChild(renderer.domElement);

      // 2. Realistic Stadium Lighting
      const ambientLight = new THREE.AmbientLight(0x384152, 0.7);
      scene.add(ambientLight);

      // Main Center Presentation Spotlight
      const centerSpot = new THREE.SpotLight(0x8b5cf6, 3.2); // Violet glow
      centerSpot.position.set(0, 7.5, 2.5);
      centerSpot.angle = Math.PI / 4.2;
      centerSpot.penumbra = 0.6;
      centerSpot.castShadow = true;
      scene.add(centerSpot);

      // Warm Key Lights (Left & Right Floodlights)
      const leftFlood = new THREE.DirectionalLight(0x38bdf8, 1.0); // Cyan rim light
      leftFlood.position.set(-6, 6, 2);
      scene.add(leftFlood);

      const rightFlood = new THREE.DirectionalLight(0xf59e0b, 0.9); // Amber stage warmth
      rightFlood.position.set(6, 6, 2);
      scene.add(rightFlood);

      // Volumetric Spotlight Cones (Visual stage light beams)
      const coneGeo = new THREE.ConeGeometry(2.5, 7.0, 32, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.07,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const lightBeam = new THREE.Mesh(coneGeo, coneMat);
      lightBeam.position.set(0, 4.0, 2.0);
      lightBeam.rotation.x = Math.PI;
      scene.add(lightBeam);

      // 3. Stage Floor (Presenter's Stage)
      const stageGeo = new THREE.CylinderGeometry(6, 6.2, 0.5, 32);
      const stageMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4,
        metalness: 0.3,
      });
      const stage = new THREE.Mesh(stageGeo, stageMat);
      stage.position.set(0, -0.25, 3.8);
      stage.receiveShadow = true;
      scene.add(stage);

      // 4. Overhead Stage Truss Structure
      const trussGroup = new THREE.Group();
      const trussBarGeo = new THREE.CylinderGeometry(0.04, 0.04, 12, 8);
      const trussMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const mainTruss = new THREE.Mesh(trussBarGeo, trussMat);
      mainTruss.rotation.z = Math.PI / 2;
      mainTruss.position.set(0, 6.5, 1.5);
      trussGroup.add(mainTruss);
      scene.add(trussGroup);

      // 5. Tiered Stadium Risers (Stepped Amphitheater Rows)
      const tieredRows = 4;
      const tierMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }),
      ];

      for (let r = 0; r < tieredRows; r++) {
        const radius = 2.4 + r * 1.5;
        const riserGeo = new THREE.CylinderGeometry(radius + 0.9, radius + 0.9, 0.45, 36, 1, true, -Math.PI / 2.8, (Math.PI / 2.8) * 2);
        const riser = new THREE.Mesh(riserGeo, tierMaterials[r % 2]);
        riser.position.set(0, -0.2 + r * 0.4, 0.5);
        riser.receiveShadow = true;
        scene.add(riser);
      }

      // 6. Front Judge Bench (National Evaluation Board)
      const judgeDeskGeo = new THREE.BoxGeometry(3.6, 0.75, 0.6);
      const judgeDeskMat = new THREE.MeshStandardMaterial({
        color: 0x312e81, // Royal Navy
        roughness: 0.4,
        metalness: 0.5,
      });
      const judgeDesk = new THREE.Mesh(judgeDeskGeo, judgeDeskMat);
      judgeDesk.position.set(0, 0.35, 1.8);
      judgeDesk.receiveShadow = true;
      judgeDesk.castShadow = true;
      scene.add(judgeDesk);

      // Judge Microphones & Laptops
      const laptopMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Glowing blue screen
      for (let j = -1; j <= 1; j++) {
        const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.25), laptopMat);
        laptopBase.position.set(j * 1.0, 0.74, 1.8);
        scene.add(laptopBase);

        const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.02), screenMat);
        laptopScreen.position.set(j * 1.0, 0.85, 1.7);
        laptopScreen.rotation.x = -0.25;
        scene.add(laptopScreen);
      }

      // 7. Electronic Animated LED Ribbon Marquee along Stadium Balcony
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      let ledTexture: THREE.CanvasTexture | null = null;

      if (ctx) {
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, 1024, 128);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 34px sans-serif";
        ctx.fillText("★ HỘI THI KHOA HỌC KỸ THUẬT QUỐC GIA — ĐẤU TRƯỜNG PHẢN BIỆN AI ★", 30, 75);
        ledTexture = new THREE.CanvasTexture(canvas);
        ledTexture.wrapS = THREE.RepeatWrapping;
        ledTexture.wrapT = THREE.ClampToEdgeWrapping;

        const ledBannerGeo = new THREE.CylinderGeometry(8.5, 8.5, 0.5, 48, 1, true, -Math.PI / 3, (Math.PI / 3) * 2);
        const ledBannerMat = new THREE.MeshBasicMaterial({
          map: ledTexture,
          side: THREE.DoubleSide,
        });
        const ledBanner = new THREE.Mesh(ledBannerGeo, ledBannerMat);
        ledBanner.position.set(0, 3.2, 0);
        scene.add(ledBanner);
      }

      // 8. Procedural Audience & Judge Avatars
      interface SpectatorNode {
        group: THREE.Group;
        head: THREE.Mesh;
        leftArm?: THREE.Mesh;
        rightArm?: THREE.Mesh;
        initialY: number;
        nodPhase: number;
        isStanding: boolean;
      }
      const spectators: SpectatorNode[] = [];

      const headGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 16);
      const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
      const seatGeo = new THREE.BoxGeometry(0.42, 0.38, 0.42);

      const suitColors = [0x1e293b, 0x334155, 0x1e1b4b, 0x3730a3, 0x064e3b, 0x831843];
      const skinTones = [0xfde047, 0xfbcfe8, 0xfcd34d, 0xf9a8d4, 0xfef08a];
      const seatMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });

      // Build 4 curved amphitheater tiers of spectators
      for (let row = 0; row < tieredRows; row++) {
        const rowRadius = 2.4 + row * 1.5;
        const count = 5 + row * 3;
        const tierY = row * 0.4;

        for (let i = 0; i < count; i++) {
          const angle = ((i - (count - 1) / 2) / count) * (Math.PI / 2.6);
          const x = Math.sin(angle) * rowRadius;
          const z = -Math.cos(angle) * rowRadius + 1.2;
          const y = tierY;

          // Seat model
          const seat = new THREE.Mesh(seatGeo, seatMat);
          seat.position.set(x, y + 0.18, z);
          seat.lookAt(0, 1.4, 3.8);
          scene.add(seat);

          // Spectator Group
          const group = new THREE.Group();
          group.position.set(x, y, z);
          group.lookAt(0, 1.4, 3.8); // Focus intently on presenter camera

          const suitColor = suitColors[(row * 3 + i) % suitColors.length];
          const skinColor = skinTones[(row + i) % skinTones.length];

          const bodyMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.65 });
          const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 });

          const body = new THREE.Mesh(bodyGeo, bodyMat);
          body.position.y = 0.45;
          body.castShadow = true;
          group.add(body);

          const head = new THREE.Mesh(headGeo, headMat);
          head.position.y = 0.82;
          head.castShadow = true;
          group.add(head);

          // Left & Right Arms (for cheering / clapping)
          const leftArm = new THREE.Mesh(armGeo, bodyMat);
          leftArm.position.set(-0.22, 0.42, 0.05);
          group.add(leftArm);

          const rightArm = new THREE.Mesh(armGeo, bodyMat);
          rightArm.position.set(0.22, 0.42, 0.05);
          group.add(rightArm);

          scene.add(group);

          spectators.push({
            group,
            head,
            leftArm,
            rightArm,
            initialY: y,
            nodPhase: Math.random() * Math.PI * 2,
            isStanding: false,
          });
        }
      }

      // 9. High-Fidelity Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        const reaction = reactionRef.current;

        // Scroll LED banner marquee text
        if (ledTexture) {
          ledTexture.offset.x = (elapsedTime * 0.05) % 1;
        }

        // Spotlight subtle atmospheric sweep
        centerSpot.position.x = Math.sin(elapsedTime * 0.5) * 0.3;

        spectators.forEach((spectator, idx) => {
          if (reaction === "attentive") {
            // Synchronized, focused nodding towards speaker
            const nod = Math.sin(elapsedTime * 3.2 + spectator.nodPhase) * 0.09;
            spectator.head.rotation.x = Math.max(0, nod);
            spectator.head.rotation.y = 0;
            spectator.group.position.y = spectator.initialY;
            if (spectator.leftArm) spectator.leftArm.rotation.x = 0;
            if (spectator.rightArm) spectator.rightArm.rotation.x = 0;
          } else if (reaction === "distracted") {
            // Restless side-to-side murmuring and fidgeting
            const murmur = Math.sin(elapsedTime * 2.0 + idx * 1.2) * 0.22;
            spectator.head.rotation.y = murmur;
            spectator.head.rotation.z = Math.sin(elapsedTime * 1.5 + idx) * 0.07;
            spectator.group.position.y = spectator.initialY;
          } else if (reaction === "applause") {
            // Standing ovation + joyful arm wave clapping
            spectator.group.position.y = spectator.initialY + 0.25 + Math.sin(elapsedTime * 9.0 + idx) * 0.04;
            spectator.head.rotation.x = -0.15;
            if (spectator.leftArm) spectator.leftArm.rotation.x = -Math.PI / 1.8 + Math.sin(elapsedTime * 12 + idx) * 0.2;
            if (spectator.rightArm) spectator.rightArm.rotation.x = -Math.PI / 1.8 - Math.sin(elapsedTime * 12 + idx) * 0.2;
          } else {
            // Natural breathing idle
            spectator.head.rotation.x = Math.sin(elapsedTime * 1.2 + spectator.nodPhase) * 0.02;
            spectator.head.rotation.y = 0;
            spectator.head.rotation.z = 0;
            spectator.group.position.y = spectator.initialY;
            if (spectator.leftArm) spectator.leftArm.rotation.x = 0;
            if (spectator.rightArm) spectator.rightArm.rotation.x = 0;
          }
        });

        renderer?.render(scene, camera);
      };

      animate();

      // 10. Handle Window Resizing
      const handleResize = () => {
        if (!container || !renderer) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };

      window.addEventListener("resize", handleResize);

      // Cleanup
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);

        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });

        if (renderer) {
          renderer.dispose();
          if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        }
      };
    } catch (err) {
      console.warn("WebGL initialization failed, falling back to 2D view:", err);
      setHasWebGLError(true);
      onWebGLError?.();
    }
  }, [onWebGLError]);

  if (hasWebGLError) {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-slate-900 text-white rounded-2xl overflow-hidden p-6 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-violet-950/40 opacity-80" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-white">Khán phòng ảo 2D Tinh gọn</h3>
          <p className="text-xs text-slate-300 max-w-sm mt-1">Đang hoạt động ở chế độ tiết kiệm tài nguyên cho thiết bị phòng tin học.</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Khán giả ảo:{" "}
              {audienceReaction === "attentive"
                ? "Chăm chú lắng nghe"
                : audienceReaction === "distracted"
                ? "Có dấu hiệu phân tâm"
                : audienceReaction === "applause"
                ? "Đang vỗ tay tán thưởng"
                : "Sẵn sàng"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border shadow-lg ${className}`}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full min-h-[360px]" />

      {/* Rehearsal Stage Overlay HUD */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700 text-xs text-white">
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
        <span className="font-medium font-heading">Đấu trường KHKT Quốc Gia 3D</span>
        <span className="text-slate-400 font-mono text-[10px]">| 60 FPS Three.js</span>
      </div>

      {/* Dynamic Reaction Indicator */}
      <div className="absolute bottom-4 right-4 z-10">
        <div
          className={`px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs font-medium transition-all duration-300 flex items-center gap-2 ${
            audienceReaction === "attentive"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
              : audienceReaction === "distracted"
              ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
              : audienceReaction === "applause"
              ? "bg-pink-950/80 border-pink-500/50 text-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.4)]"
              : "bg-slate-900/80 border-slate-700 text-slate-300"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          <span>
            {audienceReaction === "attentive" && "Khán giả đang gật đầu đồng tình"}
            {audienceReaction === "distracted" && "Khán phòng xôn xao • Bạn đang nói nhanh hoặc mất tập trung"}
            {audienceReaction === "applause" && "Toàn khán đài đứng dậy vỗ tay tán thưởng!"}
            {audienceReaction === "neutral" && "Hội đồng & khán đài đang lắng nghe"}
          </span>
        </div>
      </div>
    </div>
  );
};
