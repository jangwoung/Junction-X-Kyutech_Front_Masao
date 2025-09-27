"use client";

import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useSatellitePanelData } from "@/lib/hooks/useSatellitePanelData";
import { useGameStore } from "@/stores/gameStore";
import * as THREE from "three";

interface CameraControllerProps {
  children?: React.ReactNode;
}

export function CameraController({ children }: CameraControllerProps) {
  const { camera } = useThree();
  const selectedSatelliteId = useGameStore((s) => s.selectedSatelliteId);
  const { orbit, altitudeKm } = useSatellitePanelData(selectedSatelliteId);
  const cameraRef = useRef(camera);

  useEffect(() => {
    if (!altitudeKm || !orbit?.position) return;

    // 地球半径（km）
    const earthRadius = 6371;
    
    // 衛星の高度（km）
    const satelliteAltitude = altitudeKm;
    
    // 衛星の軌道半径（地球中心からの距離）
    const orbitRadius = earthRadius + satelliteAltitude;
    
    // カメラ位置を計算（衛星の軌道半径の1.5倍の距離）
    const cameraDistance = orbitRadius * 1.5;
    
    // 衛星の位置を基準にカメラ位置を設定
    const satellitePosition = orbit.position;
    
    // カメラを衛星の位置から少し離れた場所に配置
    const cameraPosition = {
      x: satellitePosition.x * 1.5,
      y: satellitePosition.y * 1.5,
      z: satellitePosition.z * 1.5,
    };
    
    // カメラの位置を更新
    cameraRef.current.position.set(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    );
    
    // カメラが地球を向くように設定
    cameraRef.current.lookAt(0, 0, 0);
    
    // 視野角を調整（高度に応じて）
    const fov = Math.max(30, Math.min(80, 60 - (satelliteAltitude / 1000) * 10));
    if (cameraRef.current instanceof THREE.PerspectiveCamera) {
      cameraRef.current.fov = fov;
      cameraRef.current.updateProjectionMatrix();
    }
    
    console.log(`カメラ位置を更新: 衛星高度=${satelliteAltitude}km, カメラ距離=${cameraDistance}km, FOV=${fov}°`);
  }, [altitudeKm, orbit?.position]);

  // デフォルトのカメラ位置（衛星データがない場合）
  useEffect(() => {
    if (!altitudeKm && !orbit?.position) {
      // 地球を適切に表示するデフォルト位置
      cameraRef.current.position.set(0, 0, 15000); // 地球半径の約2.4倍
      cameraRef.current.lookAt(0, 0, 0);
      if (cameraRef.current instanceof THREE.PerspectiveCamera) {
        cameraRef.current.fov = 50;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  }, [altitudeKm, orbit?.position]);

  return <>{children}</>;
}
