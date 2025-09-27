"use client";

import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// --- Propsの型定義 ---
interface HorizontalOrbitCameraProps {
  radius: number;
  speed: number;
  targetY: number; // 上下キーで変更される目標のY座標
  controlsRef: React.RefObject<OrbitControlsImpl>;
}

/**
 * カメラを水平方向（横方向）に周回させるコンポーネント
 * @param radius - 地球からの距離（軌道の半径）
 * @param speed - 周回速度
 * @param targetY - 目標のカメラY座標
 * @param controlsRef - OrbitControlsへの参照
 */
export function HorizontalOrbitCamera({ radius, speed, targetY, controlsRef }: HorizontalOrbitCameraProps) {
  const { camera } = useThree();
  const targetLookAt = new THREE.Vector3(0, 0, 0); // 常に地球の中心を見る

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // X軸とZ軸をcosとsinで動かすことで、Y軸を中心とした横方向の円運動を実現
    camera.position.x = Math.cos(time * speed) * radius;
    camera.position.z = Math.sin(time * speed) * radius;
    
    // Y座標は目標値(targetY)に向かって滑らかに移動(lerp)させる
    // これにより、キー操作でカクカク動かず、スムーズに昇降する
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
    
    // 常に中心を向くように設定
    camera.lookAt(targetLookAt);

    // OrbitControlsの状態をプログラムによるカメラの変更と同期させる
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return null; // このコンポーネント自体は何も描画しない
}