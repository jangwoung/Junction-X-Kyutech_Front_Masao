"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DebrisAppearance } from "./types";

interface AnimatedDebrisProps {
  initialPosition: readonly [number, number, number];
  appearance: DebrisAppearance;
  dangerLevel: number;
  collisionProbability?: number;
  timeToClosest?: number;
}

// アニメーション付きデブリコンポーネント（軌道運動対応）
export function AnimatedDebris({
  initialPosition,
  appearance,
  dangerLevel,
  collisionProbability,
  timeToClosest,
}: AnimatedDebrisProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const positionRef = useRef<[number, number, number]>([...initialPosition]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    timeRef.current += delta;
    const mesh = meshRef.current;

    // 軌道運動のシミュレーション（簡易版）
    // 実際の軌道力学ではより複雑な計算が必要ですが、ここでは基本的な運動を表現
    const orbitSpeed = 0.1; // 軌道速度の係数
    const radius = Math.sqrt(
      initialPosition[0] ** 2 +
        initialPosition[1] ** 2 +
        initialPosition[2] ** 2
    );

    // 円軌道運動（簡易）
    const angle = (timeRef.current * orbitSpeed) / radius;
    const newX =
      initialPosition[0] * Math.cos(angle) -
      initialPosition[2] * Math.sin(angle);
    const newZ =
      initialPosition[0] * Math.sin(angle) +
      initialPosition[2] * Math.cos(angle);

    positionRef.current = [newX, initialPosition[1], newZ];
    mesh.position.set(
      positionRef.current[0],
      positionRef.current[1],
      positionRef.current[2]
    );

    // 危険度に応じた回転速度
    const rotationSpeed = dangerLevel * 0.3;
    mesh.rotation.y += delta * rotationSpeed;
    mesh.rotation.x += delta * rotationSpeed * 0.2;

    // 危険度と衝突確率に応じた脈動効果（強化版）
    if (
      dangerLevel >= 8 ||
      (collisionProbability && collisionProbability > 0.5)
    ) {
      const pulse = 1 + Math.sin(timeRef.current * 4) * 0.5; // より強い脈動
      mesh.scale.setScalar(pulse);
    } else if (dangerLevel >= 6) {
      const pulse = 1 + Math.sin(timeRef.current * 3) * 0.4;
      mesh.scale.setScalar(pulse);
    } else if (dangerLevel >= 4) {
      const pulse = 1 + Math.sin(timeRef.current * 2) * 0.3;
      mesh.scale.setScalar(pulse);
    } else {
      const pulse = 1 + Math.sin(timeRef.current * 1.5) * 0.2; // 低危険度でも軽い脈動
      mesh.scale.setScalar(pulse);
    }

    // 最接近時間が近い場合の警告効果
    if (timeToClosest && timeToClosest < 3600000) {
      // 1時間以内
      const warningPulse = 1 + Math.sin(timeRef.current * 8) * 0.15;
      mesh.scale.multiplyScalar(warningPulse);
    }
  });

  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ringRef.current) {
      // リングの回転アニメーション
      ringRef.current.rotation.x += 0.01;
      ringRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group ref={meshRef}>
      {/* メインデブリ球体 */}
      <mesh>
        <sphereGeometry args={[appearance.size, 12, 12]} />
        <meshStandardMaterial
          color={appearance.color}
          emissive={appearance.color}
          emissiveIntensity={appearance.emissiveIntensity * 1.5} // エミッション強度を1.5倍に
          transparent
          opacity={0.95} // より不透明に
          roughness={0.2} // より滑らかに
          metalness={0.3} // より金属的に
        />
      </mesh>

      {/* 外側のリング効果 */}
      <mesh ref={ringRef}>
        <torusGeometry
          args={[appearance.size * 2, appearance.size * 0.1, 8, 16]}
        />
        <meshStandardMaterial
          color={appearance.color}
          emissive={appearance.color}
          emissiveIntensity={appearance.emissiveIntensity * 0.8}
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}
