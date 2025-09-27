"use client";

import { PerspectiveCamera } from "@react-three/drei";
import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface HorizontalOrbitCameraProps {
  radius: number;
  speed: number;
  targetY: number;
  controlsRef: React.RefObject<OrbitControlsImpl>;
}

// 横回転カメラ
export function HorizontalOrbitCamera({ radius, speed, targetY, controlsRef }: HorizontalOrbitCameraProps) {
  const { camera } = useThree();
  const targetLookAt = new THREE.Vector3(0, 0, 0);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    camera.position.x = Math.cos(time * speed) * radius;
    camera.position.z = Math.sin(time * speed) * radius;
    
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
    
    camera.lookAt(targetLookAt);

    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return null;
}


interface VerticalOrbitCameraProps {
  radius: number;
  speed: number;
  controlsRef: React.RefObject<OrbitControlsImpl>;
}

// 縦回転カメラ
export function VerticalOrbitCamera({ radius, speed, controlsRef }: VerticalOrbitCameraProps) {
  const groupRef = useRef<THREE.Group>(null!);

  // useFrameのロジックは、groupを回転させるだけでOK
  useFrame((state) => {
    if (groupRef.current) {
      // コンテナ(group)自体をX軸周りに回転させる
      groupRef.current.rotation.x = state.clock.getElapsedTime() * speed;

      // OrbitControlsの状態を更新
      if (controlsRef.current) {
        controlsRef.current.update();
      }
    }
  });

  // 以前は空だったgroupの中に、カメラを直接配置する
  return (
    <group ref={groupRef}>
      <PerspectiveCamera 
        makeDefault // このカメラをシーンのメインカメラとして使用する
        position={[0, 0, radius]} // コンテナの中心からZ軸方向に離れた位置に配置
      />
    </group>
  );
}