"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from 'three';
import { ErrorBoundary } from "@/components/ErrorBoundary";

//アスペクト比2:1正距円筒図法
const EARTH_TEXTURE_PATH = '/textures/earth_map.avif';
const EARTH_BUMP_PATH = '/textures/earth_bump.jpg';

// A loader component to show while textures are loading
function Loader() {
  return (
    <Html center>
      <div style={{ color: 'white' }}>Loading textures...</div>
    </Html>
  );
}

// The Earth model component
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  
  // Load textures using useLoader
  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [EARTH_TEXTURE_PATH, EARTH_BUMP_PATH]);

  // Explicitly set texture properties to ensure it covers the entire surface.
  // This will rule out any strange defaults or modifications happening elsewhere.
  colorMap.wrapS = THREE.RepeatWrapping;      // Allow horizontal wrapping
  colorMap.wrapT = THREE.ClampToEdgeWrapping; // Prevent vertical wrapping
  colorMap.repeat.set(1, 1);                 // Use the texture exactly once
  colorMap.offset.set(0, 0);                 // Do not offset the texture

  // Rotate the Earth on each frame
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

// The main scene component
export default function HomeScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#111827' }}>
      <ErrorBoundary>
        <Canvas 
          camera={{ position: [0, 0, 10], fov: 50 }}
        >
          <ambientLight intensity={1.5} /> 
          <directionalLight position={[5, 5, 5]} intensity={1.5} /> 
          
          <Suspense fallback={<Loader />}> 
            <Earth />
          </Suspense>
          
          <OrbitControls enableDamping />
        </Canvas>
      </ErrorBoundary>
      <div style={{
          position: 'absolute', top: '1rem', left: '1rem', color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '0.5rem',
          fontFamily: 'sans-serif', pointerEvents: 'none'
      }}>
          Drag to rotate, scroll to zoom
      </div>
    </div>
  );
}