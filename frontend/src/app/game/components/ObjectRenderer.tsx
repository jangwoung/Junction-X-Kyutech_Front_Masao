"use client";

import React from 'react';
import * as THREE from 'three';

type RandomObject = {
  id: number;
  position: [number, number, number];
  color: THREE.Color;
  spawnTime: number; 
  size: number;
};

interface ObjectRendererProps {
  objects: RandomObject[];
}

export function ObjectRenderer({ objects }: ObjectRendererProps) {
  return (
    <>
      {objects.map((obj) => (
        <FloatingObject key={obj.id} position={obj.position} color={obj.color} size={obj.size} />
      ))}
    </>
  );
}

function FloatingObject({ position, color, size }: { position: [number, number, number], color: THREE.Color, size: number }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
}