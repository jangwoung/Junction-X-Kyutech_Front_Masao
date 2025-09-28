"use client";

import React, { useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// オブジェクトの型定義を更新
type RenderableObject = {
  id: number;
  position: [number, number, number];
  color: THREE.Color;
  size: number;
  imagePath: string;
};

interface ObjectRendererProps {
  objects: RenderableObject[];
}

export function ObjectRenderer({ objects }: ObjectRendererProps) {
  return (
    <>
      {objects.map((obj) => (
        <FloatingObject
          key={obj.id}
          position={obj.position}
          color={obj.color}
          size={obj.size}
          imagePath={obj.imagePath}
        />
      ))}
    </>
  );
}


type FloatingObjectProps = {
  position: [number, number, number];
  color: THREE.Color;
  size: number;
  imagePath: string;
};

//　位置をpropsで受け取り、カメラを向く
function FloatingObject({ position, color, size, imagePath }: FloatingObjectProps) {
  const texture = useLoader(THREE.TextureLoader, imagePath);
  const meshRef = useRef<THREE.Mesh>(null!);

  // オブジェクトをカメラに向ける
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.lookAt(state.camera.position);
    }
  });

  return (
    // Spawnerから渡されたpositionを直接メッシュに設定
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        map={texture}
        transparent={true}
        side={THREE.DoubleSide} // 裏側が消えないように両面描画
        color={color}
        roughness={0.5}
      />
    </mesh>
  );
}
