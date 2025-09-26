"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

function Cube() {
  return (
    <mesh rotation={[0.2, 0.8, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#10b981" />
    </mesh>
  );
}

export default function HomeScene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Cube />
        </Suspense>
        <OrbitControls enableDamping makeDefault />
      </Canvas>
    </div>
  );
}
