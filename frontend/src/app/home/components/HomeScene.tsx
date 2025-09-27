"use client";

import React from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Earth } from "./Earth";

// The main scene component with react-globe.gl integration
export default function HomeScene() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        backgroundColor: "#000000", // 宇宙の黒い背景
        overflow: "hidden",
        backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, #eee, transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 90px 40px, #fff, transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
          radial-gradient(2px 2px at 160px 30px, #fff, transparent),
          radial-gradient(1px 1px at 190px 70px, rgba(255,255,255,0.9), transparent),
          radial-gradient(1px 1px at 220px 40px, #fff, transparent),
          radial-gradient(2px 2px at 250px 80px, rgba(255,255,255,0.7), transparent),
          radial-gradient(1px 1px at 280px 30px, #fff, transparent),
          radial-gradient(1px 1px at 310px 70px, rgba(255,255,255,0.8), transparent),
          radial-gradient(2px 2px at 340px 40px, #fff, transparent),
          radial-gradient(1px 1px at 370px 80px, rgba(255,255,255,0.6), transparent)
        `,
        backgroundRepeat: "repeat",
        backgroundSize: "400px 400px",
      }}
    >
      <ErrorBoundary>
        {/* react-globe.glは独自のWebGLコンテキストを使用するため、
            Three.jsのCanvasの外で直接配置する */}
        <Earth />
      </ErrorBoundary>
    </div>
  );
}
