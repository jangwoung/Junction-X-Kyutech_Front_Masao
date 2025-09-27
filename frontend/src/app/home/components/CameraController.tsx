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
    // 3Dシーンでの地球半径（単位）
    const earthRadius3D = 1.5;
    
    // 地球半径（km）
    const earthRadiusKm = 6371;
    
    let cameraPosition: { x: number; y: number; z: number };
    let fov: number;
    let logMessage: string;
    
    if (altitudeKm && orbit?.position) {
      // 衛星データがある場合：APIから取得した高度と位置に基づいて計算
      const satelliteAltitude = altitudeKm;
      
      // 衛星の軌道半径（地球中心からの距離）
      const orbitRadiusKm = earthRadiusKm + satelliteAltitude;
      
      // 3Dシーンでの衛星の軌道半径を計算
      const orbitRadius3D = (orbitRadiusKm / earthRadiusKm) * earthRadius3D;
      
      // カメラ位置を計算（衛星の軌道半径の1.5倍の距離）
      const cameraDistance3D = orbitRadius3D * 1.5;
      
      // 衛星の位置を基準にカメラ位置を設定
      const satellitePosition = orbit.position;
      
      // 3Dシーンでの衛星位置を計算
      const satellitePosition3D = {
        x: (satellitePosition.x / earthRadiusKm) * earthRadius3D,
        y: (satellitePosition.y / earthRadiusKm) * earthRadius3D,
        z: (satellitePosition.z / earthRadiusKm) * earthRadius3D,
      };
      
      // カメラを衛星の位置から少し離れた場所に配置
      cameraPosition = {
        x: satellitePosition3D.x * 1.5,
        y: satellitePosition3D.y * 1.5,
        z: satellitePosition3D.z * 1.5,
      };
      
      // 視野角を調整（高度に応じて）
      fov = Math.max(30, Math.min(80, 60 - (satelliteAltitude / 1000) * 10));
      
      logMessage = `カメラ位置を更新: 衛星高度=${satelliteAltitude}km, 3Dカメラ距離=${cameraDistance3D}, FOV=${fov}°`;
    } else {
      // 衛星データがない場合：デフォルトの高度（例：400km）に基づいて計算
      const defaultAltitude = 400; // km
      const orbitRadiusKm = earthRadiusKm + defaultAltitude;
      const orbitRadius3D = (orbitRadiusKm / earthRadiusKm) * earthRadius3D;
      const cameraDistance3D = orbitRadius3D * 1.5;
      
      // デフォルト位置（Z軸上）
      cameraPosition = {
        x: 0,
        y: 0,
        z: cameraDistance3D,
      };
      
      fov = 50; // デフォルト視野角
      
      logMessage = `デフォルトカメラ位置: 仮想高度=${defaultAltitude}km, 3Dカメラ距離=${cameraDistance3D}, FOV=${fov}°`;
    }
    
    // カメラの位置を更新
    cameraRef.current.position.set(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    );
    
    // カメラが地球を向くように設定
    cameraRef.current.lookAt(0, 0, 0);
    
    // 視野角を設定
    if (cameraRef.current instanceof THREE.PerspectiveCamera) {
      cameraRef.current.fov = fov;
      cameraRef.current.updateProjectionMatrix();
    }
    
    console.log(logMessage);
  }, [altitudeKm, orbit?.position]);


  return <>{children}</>;
}
