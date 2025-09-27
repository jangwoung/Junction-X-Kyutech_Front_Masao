"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Earth } from "./Earth";
import { DebrisLayer } from "./DebrisLayer";
import { Loader } from "./Loader";

// The main scene component
export default function HomeScene() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        backgroundColor: "#111827",
      }}
    >
      <ErrorBoundary>
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />

          <Suspense fallback={<Loader />}>
            <Earth />
            <DebrisLayer missionId="demo" />
          </Suspense>

          <OrbitControls enableDamping />
        </Canvas>
      </ErrorBoundary>
      <div
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          color: "white",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          fontFamily: "sans-serif",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          地球軌道シミュレーター
        </div>
        <div style={{ fontSize: "12px", opacity: 0.8 }}>
          Drag to rotate, scroll to zoom
        </div>
      </div>
    </div>
  );
}
