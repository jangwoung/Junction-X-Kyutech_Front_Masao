"use client";

import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CameraTracker, CameraDisplay } from "./CameraInfo";
import { AutoObjectSpawner } from "./AutoObjectSpawner";
import { ArrowKeyUI } from "./ArrowKeyUI";
import { HorizontalOrbitCamera, VerticalOrbitCamera } from "./CameraScript";
import {
  HorizontalCameraKeyboardController,
  VerticalCameraKeyboardController,
} from "./EventHandlers";

//アスペクト比2:1正距円筒図法
const EARTH_TEXTURE_PATH = "/textures/earth_map_8k.jpg";
const EARTH_BUMP_PATH = "/textures/earth_map_hd.jpg";

//ロード時
function Loader() {
  return (
    <Html center>
      <div style={{ color: "white" }}>Loading textures...</div>
    </Html>
  );
}

//地球
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [
    EARTH_TEXTURE_PATH,
    EARTH_BUMP_PATH,
  ]);

  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.ClampToEdgeWrapping;
  colorMap.repeat.set(1, 1);
  colorMap.offset.set(0, 0);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial map={colorMap} bumpMap={bumpMap} bumpScale={0.05} />
    </mesh>
  );
}

// メインのシーンコンポーネント
export default function GameScene() {
  const [camPos, setCamPos] = useState(new THREE.Vector3());
  const [camRot, setCamRot] = useState(new THREE.Euler());
  const [hasMounted, setHasMounted] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  const [rotationMode, setRotationMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [targetCameraY, setTargetCameraY] = useState(1);
  const [targetCameraX, setTargetCameraX] = useState(1);

  const [radius, setRadius] = useState(5); 

  useEffect(() => {
    setHasMounted(true);
  }, []);

    // 回転モードを切り替える関数
  const toggleRotationMode = () => {
    setRotationMode((prevMode) =>
      prevMode === "horizontal" ? "vertical" : "horizontal"
    );
  };

  // ズームイン・ズームアウト用の関数
  const handleZoomIn = () => {
    // 最小距離2
    setRadius(prevRadius => Math.max(prevRadius - 0.5, 2));
  };

  const handleZoomOut = () => {
    // 最大距離10
    setRadius(prevRadius => Math.min(prevRadius + 0.5, 10));
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        backgroundColor: "#111827",
      }}
    >
      {/* --- UI --- */}
      {/* 回転モードを切り替えるボタン */}
      <div
        style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10 }}
      >
        <button
          onClick={toggleRotationMode}
          style={{ padding: "8px 12px", cursor: "pointer" }}
        >
          Switch: {rotationMode === "horizontal" ? "Horizontal" : "Vertical"}
        </button>
      </div>

        {/* ズームイン・ズームアウトボタン */}
       <div
        style={{ position: 'absolute', top: '300px', right: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <button onClick={handleZoomIn} style={{ padding: '8px 12px', cursor: 'pointer' }}>Zoom In (+)</button>
        <button onClick={handleZoomOut} style={{ padding: '8px 12px', cursor: 'pointer' }}>Zoom Out (-)</button>
      </div>

      <ArrowKeyUI mode={rotationMode} />

      {/* キーボード操作のイベントハンドラ */}
      {rotationMode === "horizontal" && (
        <VerticalCameraKeyboardController
          setTargetY={setTargetCameraY}
          step={0.5}
        />
      )}

      {rotationMode === "vertical" && (
        <HorizontalCameraKeyboardController
          setTargetX={setTargetCameraX}
          step={0.1}
        />
      )}

      {/*  3D Scene  */}
      <ErrorBoundary>
        <Canvas
          camera={{ position: [0, 1, 4], fov: 42 }}
          key={rotationMode} 
        >
          {/*  明るさ調整  */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.0} />

          <Suspense fallback={<Loader />}>
            <Earth />
          </Suspense>
          
          <OrbitControls 
            enabled={rotationMode === 'horizontal'}
            enableDamping 
            target={[0, 0, 0]}
          />

          <AutoObjectSpawner />

          {rotationMode === 'horizontal' ? (
            <HorizontalOrbitCamera 
              radius={radius} 
              speed={0.1} 
              targetY={targetCameraY} 
              controlsRef={controlsRef} 
            />
          ) : (
            <VerticalOrbitCamera
              radius={radius}
              speed={0.1}
              targetX={targetCameraX}
              controlsRef={controlsRef}
            />
          )}

          <CameraTracker setPosition={setCamPos} setRotation={setCamRot} />
        </Canvas>
      </ErrorBoundary>

      {hasMounted && <CameraDisplay position={camPos} rotation={camRot} />}
    </div>
  );
}
