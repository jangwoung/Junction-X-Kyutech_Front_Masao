"use client";

import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from 'three';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CameraTracker, CameraDisplay } from "./CameraInfo";

//アスペクト比2:1正距円筒図法
const EARTH_TEXTURE_PATH = '/textures/earth_map.avif';
const EARTH_BUMP_PATH = '/textures/earth_bump.jpg';

// ローディング中に表示するコンポーネント
function Loader() {
  return (
    <Html center>
      <div style={{ color: 'white' }}>Loading textures...</div>
    </Html>
  );
}

// 地球モデルのコンポーネント
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  
  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [EARTH_TEXTURE_PATH, EARTH_BUMP_PATH]);

  // テクスチャが完全に表面を覆うようにプロパティを明示的に設定
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.ClampToEdgeWrapping;
  colorMap.repeat.set(1, 1);
  colorMap.offset.set(0, 0);

  // フレームごとに地球を回転させる
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

// メインのシーンコンポーネント
export default function GameScene() {
  const [camPos, setCamPos] = useState(new THREE.Vector3());
  const [camRot, setCamRot] = useState(new THREE.Euler());
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#111827' }}>
      <ErrorBoundary>
        <Canvas 
          // 1. カメラの初期位置を修正
          // Y軸方向（上）に高く、Z軸方向（奥）に少し離れた位置に設定
          camera={{ position: [0, 2, 4], fov: 50 }}
        >
          <ambientLight intensity={1.5} /> 
          <directionalLight position={[5, 5, 5]} intensity={1.5} /> 
          
          <Suspense fallback={<Loader />}> 
            <Earth />
          </Suspense>
          
          {/* 2. OrbitControlsの注視点を地球の中心に設定 */}
          <OrbitControls 
            enableDamping 
            target={[0, 2, 0]} // カメラが常に地球の中心(0,0,0)を向くようにする
          />
          <CameraTracker setPosition={setCamPos} setRotation={setCamRot} />
        </Canvas>
      </ErrorBoundary>
      {/* Hydration Errorを避けるため、hasMountedフラグは非常に有効です。
        スクリーンショットのエラーはこの部分が正しく機能している証拠でもあります。
      */}
      {hasMounted && <CameraDisplay position={camPos} rotation={camRot} />}
    </div>
  );
}