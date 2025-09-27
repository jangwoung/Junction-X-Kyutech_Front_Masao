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

function Loader() {
  return (
    <Html center>
      <div style={{ color: 'white' }}>Loading textures...</div>
    </Html>
  );
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [EARTH_TEXTURE_PATH, EARTH_BUMP_PATH]);

  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.ClampToEdgeWrapping;
  colorMap.repeat.set(1, 1);
  colorMap.offset.set(0, 0);

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

function OrbitingSatelliteCamera({ targetY, controlsRef }: { targetY: number, controlsRef: React.RefObject<OrbitControlsImpl> }) {
  const { camera } = useThree();
  const targetLookAt = new THREE.Vector3(0, 0, 0);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    const radius = 4;
    camera.position.x = Math.cos(time * 0.3) * radius;
    camera.position.z = Math.sin(time * 0.3) * radius;
    
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.01);
    
    camera.lookAt(targetLookAt);

    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return null;
}

export default function GameScene() {
  const [camPos, setCamPos] = useState(new THREE.Vector3());
  const [camRot, setCamRot] = useState(new THREE.Euler());
  const [hasMounted, setHasMounted] = useState(false);
  const [targetCameraY, setTargetCameraY] = useState(1);
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const step = 1.0;
      if (event.key === 'ArrowUp') {
        setTargetCameraY(y => y + step);
      } else if (event.key === 'ArrowDown') {
        setTargetCameraY(y => y - step);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#111827' }}>
      <ErrorBoundary>
        <Canvas 
          camera={{ position: [0, 1, 4], fov: 50 }}
        >
          <ambientLight intensity={1.5} /> 
          <directionalLight position={[5, 5, 5]} intensity={1.5} /> 
          
          <Suspense fallback={<Loader />}> 
            <Earth />
          </Suspense>
          
          <OrbitControls 
            ref={controlsRef}
            enableDamping 
            target={[0, 0, 0]}
          />

          <OrbitingSatelliteCamera targetY={targetCameraY} controlsRef={controlsRef} />

          <CameraTracker setPosition={setCamPos} setRotation={setCamRot} />
        </Canvas>
      </ErrorBoundary>
      {hasMounted && <CameraDisplay position={camPos} rotation={camRot} />}
    </div>
  );
}