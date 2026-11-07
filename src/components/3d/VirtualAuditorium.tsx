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
  onWebGLError
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
      scene.background = new THREE.Color(0x0f172a); // Deep Slate
      scene.fog = new THREE.FogExp2(0x0f172a, 0.04);

      const width = container.clientWidth || 640;
      const height = container.clientHeight || 360;

      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.set(0, 1.6, 3.8); // Presenter eye height looking down at audience

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.appendChild(renderer.domElement);

      // 2. Lighting Rig
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      // Stage Spotlight
      const spotLight = new THREE.SpotLight(0x8b5cf6, 2.5); // Violet stage glow
      spotLight.position.set(0, 5, 2);
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.5;
      spotLight.castShadow = true;
      scene.add(spotLight);

      // Warm Key Light
      const keyLight = new THREE.DirectionalLight(0xfef08a, 0.8);
      keyLight.position.set(3, 4, 2);
      scene.add(keyLight);

      // 3. Stage Floor
      const stageGeo = new THREE.PlaneGeometry(12, 10);
      const stageMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
        metalness: 0.2
      });
      const stage = new THREE.Mesh(stageGeo, stageMat);
      stage.rotation.x = -Math.PI / 2;
      stage.receiveShadow = true;
      scene.add(stage);

      // 4. Procedural Audience Avatars (3 Curved Tiers)
      interface AvatarNode {
        group: THREE.Group;
        head: THREE.Mesh;
        initialY: number;
        nodPhase: number;
      }
      const avatars: AvatarNode[] = [];

      const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 16);

      const avatarColors = [0x334155, 0x475569, 0x64748b, 0x4338ca, 0x7c3aed];

      for (let row = 0; row < 3; row++) {
        const rowDistance = 2.0 + row * 1.4;
        const count = 5 + row * 2;
        const radius = rowDistance;

        for (let i = 0; i < count; i++) {
          const angle = ((i - (count - 1) / 2) / count) * (Math.PI / 2.5);
          const x = Math.sin(angle) * radius;
          const z = -Math.cos(angle) * radius + 0.8;
          const y = row * 0.35; // Tier elevation

          const group = new THREE.Group();
          group.position.set(x, y, z);
          group.lookAt(0, 1.4, 3.8); // Look at presenter camera

          const color = avatarColors[(row + i) % avatarColors.length];
          const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
          const headMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 }); // Skin tone

          const body = new THREE.Mesh(bodyGeo, bodyMat);
          body.position.y = 0.3;
          body.castShadow = true;
          group.add(body);

          const head = new THREE.Mesh(headGeo, headMat);
          head.position.y = 0.75;
          head.castShadow = true;
          group.add(head);

          scene.add(group);

          avatars.push({
            group,
            head,
            initialY: head.position.y,
            nodPhase: Math.random() * Math.PI * 2
          });
        }
      }

      // 5. Animation Loop with Dynamic Audience Reaction
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        const reaction = reactionRef.current;

        avatars.forEach((avatar, idx) => {
          if (reaction === "attentive") {
            // Synchronized attentive nodding motion
            const nod = Math.sin(elapsedTime * 3.5 + avatar.nodPhase) * 0.08;
            avatar.head.rotation.x = Math.max(0, nod);
            avatar.head.position.y = avatar.initialY - Math.abs(nod) * 0.05;
          } else if (reaction === "distracted") {
            // Restless side-to-side murmuring motion
            const murmur = Math.sin(elapsedTime * 2.0 + idx) * 0.15;
            avatar.head.rotation.y = murmur;
            avatar.head.rotation.z = Math.sin(elapsedTime * 1.5 + idx) * 0.06;
          } else if (reaction === "applause") {
            // Joyful bobbing applause
            avatar.group.position.y = Math.sin(elapsedTime * 8.0 + idx) * 0.04;
            avatar.head.rotation.x = -0.1;
          } else {
            // Calm natural idle breathing
            avatar.head.rotation.x = Math.sin(elapsedTime * 1.2 + avatar.nodPhase) * 0.02;
            avatar.head.rotation.y = 0;
            avatar.head.position.y = avatar.initialY;
          }
        });

        renderer?.render(scene, camera);
      };

      animate();

      // 6. Handle Resizing
      const handleResize = () => {
        if (!container || !renderer) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };

      window.addEventListener("resize", handleResize);

      // Cleanup on unmount
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);

        // Walk scene graph and dispose geometries & materials
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
            <span>Khán giả ảo: {audienceReaction === "attentive" ? "Chăm chú lắng nghe" : audienceReaction === "distracted" ? "Có dấu hiệu phân tâm" : "Sẵn sàng"}</span>
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
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-xs text-white">
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
        <span className="font-medium font-heading">Khán phòng 3D Hội trường</span>
        <span className="text-slate-400 font-mono text-[10px]">| 30 FPS</span>
      </div>

      {/* Dynamic Reaction Indicator */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className={`px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs font-medium transition-all duration-300 flex items-center gap-2 ${
          audienceReaction === "attentive"
            ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
            : audienceReaction === "distracted"
            ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
            : audienceReaction === "applause"
            ? "bg-pink-950/80 border-pink-500/50 text-pink-300"
            : "bg-slate-900/80 border-slate-700 text-slate-300"
        }`}>
          <span className="w-2 h-2 rounded-full bg-current" />
          <span>
            {audienceReaction === "attentive" && "Khán giả đang gật đầu đồng tình"}
            {audienceReaction === "distracted" && "Khán giả đang xôn xao phân tâm"}
            {audienceReaction === "applause" && "Khán giả vỗ tay tán thưởng"}
            {audienceReaction === "neutral" && "Khán phòng đang lắng nghe"}
          </span>
        </div>
      </div>
    </div>
  );
};
