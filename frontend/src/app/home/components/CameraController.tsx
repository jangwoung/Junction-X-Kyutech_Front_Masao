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

    // 3Dシーンでの地球半径（単位）
    const earthRadius3D = 1.5;

    // 衛星の高度（km）
    const satelliteAltitude = altitudeKm;

    // 地球半径（km）
    const earthRadiusKm = 6371;

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
    const cameraPosition = {
      x: satellitePosition3D.x * 1.5,
      y: satellitePosition3D.y * 1.5,
      z: satellitePosition3D.z * 1.5,
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
    const fov = Math.max(
      30,
      Math.min(80, 60 - (satelliteAltitude / 1000) * 10)
    );
    if (cameraRef.current instanceof THREE.PerspectiveCamera) {
      cameraRef.current.fov = fov;
      cameraRef.current.updateProjectionMatrix();
    }

    console.log(
      `カメラ位置を更新: 衛星高度=${satelliteAltitude}km, 3Dカメラ距離=${cameraDistance3D}, FOV=${fov}°`
    );
  }, [altitudeKm, orbit?.position]);

  // デフォルトのカメラ位置（衛星データがない場合）
  useEffect(() => {
    if (!altitudeKm && !orbit?.position) {
      // 地球を適切に表示するデフォルト位置（3Dシーンでの地球半径1.5の約4倍）
      cameraRef.current.position.set(0, 0, 6);
      cameraRef.current.lookAt(0, 0, 0);
      if (cameraRef.current instanceof THREE.PerspectiveCamera) {
        cameraRef.current.fov = 50;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  }, [altitudeKm, orbit?.position]);

  return <>{children}</>;
}
