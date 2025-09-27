"use client";

import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CameraTracker, CameraDisplay } from "./CameraInfo";
import { HorizontalOrbitCamera } from "./Camera-HorizontalRotate";
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

  // カメラの高さを管理するState
  // このStateは、キーボード操作(EventHandlers)によって変更され、
  // カメラアニメーション(CameraScripts)に影響を与える
  const [targetCameraY, setTargetCameraY] = useState(1);

  // クライアントサイドでのマウントを確認するためのuseEffect
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#111827' }}>

      <CameraKeyboardController setTargetY={setTargetCameraY} step={0.5} />

      <ErrorBoundary>
        <Canvas 
          camera={{ position: [0, 1, 4], fov: 50 }}
        >
          {/* ライト */}
          <ambientLight intensity={1.5} /> 
          <directionalLight position={[5, 5, 5]} intensity={1.5} /> 
          
          {/* メインオブジェクト */}
          <Suspense fallback={<Loader />}> 
            <Earth />
          </Suspense>
          
          {/* カメラコントロール */}
          <OrbitControls 
            ref={controlsRef}
            enableDamping 
            target={[0, 0, 0]}
          />

          <HorizontalOrbitCamera 
            radius={4} 
            speed={0.3} 
            targetY={targetCameraY} 
            controlsRef={controlsRef} 
          />

          <CameraTracker setPosition={setCamPos} setRotation={setCamRot} />
        </Canvas>
      </ErrorBoundary>

      {hasMounted && <CameraDisplay position={camPos} rotation={camRot} />}
    </div>
  );
}