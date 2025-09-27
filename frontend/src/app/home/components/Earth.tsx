"use client";

import React, { useRef } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";

//アスペクト比2:1正距円筒図法
const EARTH_TEXTURE_PATH = "/textures/earth_map.avif";
const EARTH_BUMP_PATH = "/textures/earth_bump.jpg";

// The Earth model component
export function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!);

  // Load textures using useLoader
  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [
    EARTH_TEXTURE_PATH,
    EARTH_BUMP_PATH,
  ]);

  // Explicitly set texture properties to ensure it covers the entire surface.
  // This will rule out any strange defaults or modifications happening elsewhere.
  colorMap.wrapS = THREE.RepeatWrapping; // Allow horizontal wrapping
  colorMap.wrapT = THREE.ClampToEdgeWrapping; // Prevent vertical wrapping
  colorMap.repeat.set(1, 1); // Use the texture exactly once
  colorMap.offset.set(0, 0); // Do not offset the texture

  // Rotate the Earth on each frame
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial map={colorMap} bumpMap={bumpMap} bumpScale={0.05} />
    </mesh>
  );
}
