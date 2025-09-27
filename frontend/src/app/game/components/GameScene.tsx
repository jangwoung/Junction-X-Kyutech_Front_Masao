"use client";

import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from 'stdlib';
import * as THREE from 'three';

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CameraTracker, CameraDisplay } from "./CameraInfo";
import { HorizontalOrbitCamera, VerticalOrbitCamera } from "./CameraScript";
import { CameraKeyboardController } from "./EventHandlers";

//アスペクト比2:1正距円筒図法
const EARTH_TEXTURE_PATH = '/textures/earth_map.avif';
const EARTH_BUMP_PATH = '/textures/earth_bump.jpg';

function Loader() {
  return (
    <Html center>
      <div style={{ color: 'white' }}>Loading textures...</div>
    </Html>
  );
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [EARTH_TEXTURE_PATH, EARTH_BUMP_PATH]);

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
      <meshStandardMaterial
        map={colorMap}
        bumpMap={bumpMap}
        bumpScale={0.05}
      />
    </mesh>
  );
}

export default function GameScene() {
  const [camPos, setCamPos] = useState(new THREE.Vector3());
  const [camRot, setCamRot] = useState(new THREE.Euler());
  const [hasMounted, setHasMounted] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  // 1. 回転モードを管理するStateを追加 (デフォルトは 'horizontal')
  const [rotationMode, setRotationMode] = useState<'horizontal' | 'vertical'>('horizontal');

  // カメラの目標Y座標を管理するState (横回転モードでのみ使用)
  const [targetCameraY, setTargetCameraY] = useState(1);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 2. モードを切り替えるための関数
  const toggleRotationMode = () => {
    setRotationMode(prevMode => (prevMode === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#111827' }}>
      
      {/* --- UI --- */}
      {/* 3. 回転モードを切り替えるボタンを追加 */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
        <button onClick={toggleRotationMode} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          切り替え: {rotationMode === 'horizontal' ? '横回転中' : '縦回転中'}
        </button>
      </div>

      {/* 横回転モードの時のみ、キーボード操作のイベントハンドラを有効にする */}
      {rotationMode === 'horizontal' && (
        <CameraKeyboardController setTargetY={setTargetCameraY} step={0.5} />
      )}

      {/* --- 3D Scene --- */}
      <ErrorBoundary>
        <Canvas 
          camera={{ position: [0, 1, 4], fov: 50 }}
          // keyプロパティを使ってモード変更時にカメラをリセット
          key={rotationMode} 
        >
          <ambientLight intensity={1.5} /> 
          <directionalLight position={[5, 5, 5]} intensity={1.5} /> 
          
          <Suspense fallback={<Loader />}> 
            <Earth />
          </Suspense>
          
          <OrbitControls 
            ref={controlsRef}
            enableDamping 
            target={[0, 0, 0]}
          />

          {/* 4. Stateの値に応じて、描画するカメラコンポーネントを切り替える */}
          {rotationMode === 'horizontal' ? (
            <HorizontalOrbitCamera 
              radius={4} 
              speed={0.3} 
              targetY={targetCameraY} 
              controlsRef={controlsRef} 
            />
          ) : (
            <VerticalOrbitCamera
              radius={5}
              speed={0.3}
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