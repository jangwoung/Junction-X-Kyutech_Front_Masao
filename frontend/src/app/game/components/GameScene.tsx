"use client";

import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber"; // useThree をインポート
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

// カメラを自動で周回させるコンポーネント
function CameraAnimation() {
  // useFrameフック内でカメラやシーンの状態を取得するためにuseThreeを使用
  const { camera } = useThree();
  const target = new THREE.Vector3(0, 1, 0); // 注視点は固定

  // state.clock.getElapsedTime() でコンポーネントがマウントされてからの経過時間を取得
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // 円軌道の計算
    // X座標をcosで、Z座標をsinで動かすことで、Y軸周りの円運動を実現
    const radius = 4; // 周回半径
    camera.position.x = Math.cos(time * 0.5) * radius; // timeに乗算する値で速度調整
    camera.position.z = Math.sin(time * 0.5) * radius;
    
    // Y座標は固定
    camera.position.y = 1;
    
    camera.lookAt(target);
  });

  return null;
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
          // カメラの初期位置はCameraAnimationコンポーネントが上書きするため、ここでは重要ではない
          camera={{ position: [0, 1, 4], fov: 50 }}
        >
          <ambientLight intensity={1.5} /> 
          <directionalLight position={[5, 5, 5]} intensity={1.5} /> 
          
          <Suspense fallback={<Loader />}> 
            <Earth />
          </Suspense>
          
          {/* OrbitControlsはユーザー操作を可能にする。
              自動アニメーションと共存させる場合、ユーザーが操作したらアニメーションを止めるといった制御が必要になることがあるが、
              今回は自動アニメーションを優先させる。
              もしユーザー操作もさせたい場合は、enableZoom={false}などを追加すると良い。
           */}
          <OrbitControls 
            enableDamping 
            target={[0, 1, 0]}
          />

          {/* 2. 作成したカメラアニメーションコンポーネントをシーンに追加 */}
          <CameraAnimation />

          <CameraTracker setPosition={setCamPos} setRotation={setCamRot} />
        </Canvas>
      </ErrorBoundary>
      {hasMounted && <CameraDisplay position={camPos} rotation={camRot} />}
    </div>
  );
}