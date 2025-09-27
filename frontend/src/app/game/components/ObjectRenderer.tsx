"use client";

import React from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface ObjectRendererProps {
  objects: Array<{
    id: number;
    position: [number, number, number];
    color: THREE.Color;
    size: number;
    imagePath: string;
  }>;
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
            imagePath={obj.imagePath}/>
      ))}
    </>
  );
}

interface FloatingObjectProps {
  position: [number, number, number];
  color: THREE.Color;
  size: number;
  imagePath: string;
}

function FloatingObject({ position, color, size, imagePath }: FloatingObjectProps) { 
    // propsで渡されたimagePathを使ってテクスチャを読み込む
  const texture = useLoader(THREE.TextureLoader, imagePath); 
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.lookAt(state.camera.position);
    }
  });

    return (
    <mesh position={position}>
      <planeGeometry args={[size, size]} /> 
      <meshStandardMaterial 
        map={texture}          // mapプロパティにテクスチャを指定
        transparent={true}     // 透明部分を有効にするために必須
        side={THREE.DoubleSide} // 両面表示
        color={color}          // もとの色で画像を薄く着色することも可能
        roughness={0.5} 
      />
    </mesh>
  );
}