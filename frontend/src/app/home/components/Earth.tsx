"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { useSatellitePanelData } from "@/lib/hooks/useSatellitePanelData";
import { useGameStore } from "@/stores/gameStore";
import { useAvailableSatellites } from "../../../lib/hooks/useAvailableSatellites";
import { useMultipleSatelliteOrbits } from "../../../lib/hooks/useMultipleSatelliteOrbits";

// react-globe.glを動的にインポート（SSRを避けるため）
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "1.2rem",
      }}
    >
      地球を読み込み中...
    </div>
  ),
});

// 昼夜サイクル機能を持つ地球コンポーネント
export function Earth() {
  const globeRef = useRef<any>(null);
  const [time, setTime] = useState(new Date());
  const [globeSize, setGlobeSize] = useState({ width: 800, height: 600 });
  const [selectedSatellite, setSelectedSatellite] = useState<string | null>(
    null
  );

  // 衛星データを取得
  const satellites = useGameStore((s: any) => s.satellites);
  const selectedSatelliteId = satellites[0]?.id; // 最初の衛星を選択（後で改善可能）
  const satelliteData = useSatellitePanelData(selectedSatelliteId);

  // 利用可能な衛星一覧を取得（最初の3つを使用）
  const { satellites: availableSatellites } = useAvailableSatellites();
  const selectedSatelliteIds = availableSatellites
    .slice(0, 3)
    .map((sat: any) => sat.id);

  // 複数の衛星の軌道データを取得
  const { satelliteOrbits } = useMultipleSatelliteOrbits(selectedSatelliteIds);

  // デフォルトの衛星データ（APIが失敗した場合のフォールバック）
  const defaultSatellites = [
    {
      satellite_id: "himawari8",
      altitude: 35786,
      orbital_speed: 3.07,
      position: { x: 0, y: 0, z: 0 },
    },
    {
      satellite_id: "terra",
      altitude: 705,
      orbital_speed: 7.5,
      position: { x: 0, y: 0, z: 0 },
    },
    {
      satellite_id: "landsat8",
      altitude: 705,
      orbital_speed: 7.5,
      position: { x: 0, y: 0, z: 0 },
    },
  ];

  // 実際に使用する衛星データ
  const activeSatellites =
    satelliteOrbits.length > 0 ? satelliteOrbits : defaultSatellites;

  // 衛星の現在位置を取得する関数
  const getSatelliteCurrentPosition = (satelliteId: string) => {
    let altitude = 400;
    let inclination = 0;

    switch (satelliteId) {
      case "himawari8":
        altitude = 35786;
        inclination = 0;
        break;
      case "goes16":
        altitude = 35786;
        inclination = 0;
        break;
      case "terra":
        altitude = 705;
        inclination = 98.5;
        break;
      case "landsat8":
        altitude = 705;
        inclination = 98.2;
        break;
      case "worldview3":
        altitude = 617;
        inclination = 98.0;
        break;
    }

    const lat = calculateSatelliteLatitude(satelliteId, altitude, inclination);
    const lng = calculateSatelliteLongitude(satelliteId, altitude, inclination);

    return { lat, lng, altitude: altitude / 1000 }; // km単位に変換
  };

  // カメラを衛星の位置に移動する関数（選択状態も管理）
  const moveCameraToSatellite = (satelliteId: string) => {
    console.log(`Selecting satellite: ${satelliteId}`);

    if (globeRef.current) {
      const satellitePos = getSatelliteCurrentPosition(satelliteId);

      // 衛星の位置にカメラを移動（少し離れた位置から見る）
      const cameraPosition = {
        lat: satellitePos.lat,
        lng: satellitePos.lng,
        altitude: Math.max(0.5, satellitePos.altitude * 0.1), // 衛星の10%の距離から見る
      };

      console.log(`Moving camera to:`, { satellitePos, cameraPosition });

      globeRef.current.pointOfView(cameraPosition, 2000); // 2秒でアニメーション

      // 選択状態を更新
      setSelectedSatellite(satelliteId);
      console.log(`Selected satellite set to: ${satelliteId}`);
    }
  };

  // 選択された衛星にカメラを追従させる関数
  const followSelectedSatellite = () => {
    if (globeRef.current && selectedSatellite) {
      const satellitePos = getSatelliteCurrentPosition(selectedSatellite);

      // 衛星の位置にカメラを追従（少し離れた位置から見る）
      const cameraPosition = {
        lat: satellitePos.lat,
        lng: satellitePos.lng,
        altitude: Math.max(0.5, satellitePos.altitude * 0.1), // 衛星の10%の距離から見る
      };

      globeRef.current.pointOfView(cameraPosition, 100); // 短いアニメーションで追従
    }
  };

  // 時間を更新して昼夜サイクルを実装
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000); // 1秒ごとに更新

    return () => clearInterval(interval);
  }, []);

  // 選択された衛星に追従するためのuseEffect
  useEffect(() => {
    console.log(`Selected satellite changed to: ${selectedSatellite}`);

    if (!selectedSatellite || !globeRef.current) {
      console.log("No satellite selected or globe not ready");
      return;
    }

    console.log("Starting follow interval for:", selectedSatellite);

    const followInterval = setInterval(() => {
      if (globeRef.current && selectedSatellite) {
        const satellitePos = getSatelliteCurrentPosition(selectedSatellite);

        const cameraPosition = {
          lat: satellitePos.lat,
          lng: satellitePos.lng,
          altitude: Math.max(0.5, satellitePos.altitude * 0.1),
        };

        console.log(`Following ${selectedSatellite}:`, {
          satellitePos,
          cameraPosition,
        });
        globeRef.current.pointOfView(cameraPosition, 200);
      }
    }, 200); // 200ms間隔で追従

    return () => {
      console.log("Clearing follow interval");
      clearInterval(followInterval);
    };
  }, [selectedSatellite]);

  // ウィンドウサイズに応じて地球のサイズを調整
  useEffect(() => {
    const updateSize = () => {
      setGlobeSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // コンポーネントのクリーンアップ時にアニメーションを停止
  useEffect(() => {
    return () => {
      if (globeRef.current && (globeRef.current as any).stopRotation) {
        (globeRef.current as any).stopRotation();
      }
    };
  }, []);

  // 衛星の高度データが変更されたときにカメラ位置を更新
  useEffect(() => {
    if (globeRef.current && satelliteData.altitudeKm !== undefined) {
      const cameraPos = getCameraPosition();
      globeRef.current.pointOfView(cameraPos, 1000); // 1秒でアニメーション
    }
  }, [satelliteData.altitudeKm]);

  // 地球のテクスチャとライティング設定（高品質8Kテクスチャを使用）
  const globeImageUrl = "/textures/earth_map_8k.jpg";
  const bumpImageUrl = "/textures/earth_bump.jpg";

  // 昼夜サイクルのための太陽位置計算
  const getSunPosition = () => {
    const hours = time.getUTCHours() + time.getUTCMinutes() / 60;
    // 太陽は地球から非常に離れた位置に固定
    // 地球の自転によって昼夜サイクルが生まれる
    const distance = 10000; // 太陽までの距離（地球半径の10000倍）
    return {
      x: distance, // 太陽は常にX軸の正の方向にある
      y: 0,
      z: 0,
    };
  };

  // 衛星の高度に基づいてカメラ位置を計算
  const getCameraPosition = () => {
    const altitudeKm = satelliteData.altitudeKm || 400; // デフォルト高度400km

    // より近いカメラ位置に調整
    // 高度400km → カメラ高度2.0
    // 高度800km → カメラ高度2.5
    // 高度1200km → カメラ高度3.0
    const cameraAltitude = Math.max(
      1.8, // 最小距離を近くに
      Math.min(4.0, 1.8 + (altitudeKm / 1000) * 0.3) // より近い計算式
    );

    return {
      lat: 20,
      lng: 0,
      altitude: cameraAltitude,
    };
  };

  // 衛星の軌道パスを生成
  const generateOrbitPath = (
    satelliteId: string,
    altitude: number,
    inclination: number = 0
  ) => {
    const points = [];
    const radius = 1 + altitude / 6371; // 地球半径を1として正規化

    // 軌道パスを生成（360点）
    for (let i = 0; i < 360; i++) {
      const angle = (i * Math.PI) / 180;
      const x = radius * Math.cos(angle) * Math.cos(inclination);
      const y = radius * Math.sin(angle);
      const z = radius * Math.cos(angle) * Math.sin(inclination);
      points.push([x, y, z]);
    }

    return points;
  };

  // 衛星の色を取得
  const getSatelliteColor = (index: number): string => {
    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"];
    return colors[index % colors.length];
  };

  // 衛星の緯度を計算（時間ベース）
  const calculateSatelliteLatitude = (
    satelliteId: string,
    altitude: number,
    inclination: number
  ): number => {
    const time = Date.now() * 0.0001; // 時間を遅くして見やすく
    const orbitalPeriod =
      (2 * Math.PI * Math.sqrt(Math.pow((6371 + altitude) / 6371, 3))) / 24; // 軌道周期

    // 軌道傾斜角に基づく緯度の範囲
    const maxLatitude = inclination;
    return maxLatitude * Math.sin(time * orbitalPeriod);
  };

  // 衛星の経度を計算（時間ベース）
  const calculateSatelliteLongitude = (
    satelliteId: string,
    altitude: number,
    inclination: number
  ): number => {
    const time = Date.now() * 0.0001; // 時間を遅くして見やすく
    const orbitalPeriod =
      (2 * Math.PI * Math.sqrt(Math.pow((6371 + altitude) / 6371, 3))) / 24; // 軌道周期

    // 衛星の軌道速度に基づく経度の変化
    let longitudeOffset = 0;
    switch (satelliteId) {
      case "himawari8":
        longitudeOffset = 140.7; // 東経140.7度の静止軌道
        break;
      case "goes16":
        longitudeOffset = -75.2; // 西経75.2度の静止軌道
        break;
      default:
        longitudeOffset = 0; // 極軌道などは経度が変化
        break;
    }

    return longitudeOffset + time * orbitalPeriod * 57.3; // ラジアンを度に変換
  };

  // 衛星の軌道と現在位置を描画
  const drawSatelliteOrbits = (scene: THREE.Scene) => {
    // 既存の衛星関連オブジェクトを削除
    const existingSatellites = scene.children.filter(
      (child: any) =>
        child.userData?.type === "satellite" ||
        child.userData?.type === "orbit" ||
        child.userData?.type === "satellite-ring" ||
        child.userData?.type === "satellite-outer-ring"
    );
    existingSatellites.forEach((satellite: any) => scene.remove(satellite));

    // 軌道データを準備（実際の衛星軌道データに基づく）
    const orbitPaths = activeSatellites.map((orbit: any, index: number) => {
      // 各衛星の実際の軌道高度を設定
      let actualAltitude = orbit.altitude;
      let orbitalInclination = 0;

      // 衛星タイプに応じて実際の軌道パラメータを設定
      switch (orbit.satellite_id) {
        case "himawari8":
          actualAltitude = 35786; // 静止軌道
          orbitalInclination = 0;
          break;
        case "goes16":
          actualAltitude = 35786; // 静止軌道
          orbitalInclination = 0;
          break;
        case "terra":
          actualAltitude = 705; // 極軌道
          orbitalInclination = 98.5; // 極軌道の傾斜角
          break;
        case "landsat8":
          actualAltitude = 705; // 極軌道
          orbitalInclination = 98.2;
          break;
        case "worldview3":
          actualAltitude = 617; // 低軌道
          orbitalInclination = 98.0;
          break;
        default:
          actualAltitude = 400 + index * 200; // デフォルト高度
          orbitalInclination = index * 30;
      }

      return {
        satelliteId: orbit.satellite_id,
        path: generateOrbitPath(
          orbit.satellite_id,
          actualAltitude,
          orbitalInclination
        ),
        color: getSatelliteColor(index),
        currentPosition: {
          // 実際の軌道位置を計算（時間ベースの位置）
          lat: calculateSatelliteLatitude(
            orbit.satellite_id,
            actualAltitude,
            orbitalInclination
          ),
          lng: calculateSatelliteLongitude(
            orbit.satellite_id,
            actualAltitude,
            orbitalInclination
          ),
          altitude: actualAltitude / 1000, // km単位に変換
        },
        actualAltitude,
        orbitalInclination,
      };
    });

    // 軌道線を描画
    orbitPaths.forEach((orbit: any, index: number) => {
      const curve = new THREE.CatmullRomCurve3(
        orbit.path.map((point: any) => new THREE.Vector3(...point))
      );

      const geometry = new THREE.TubeGeometry(curve, 100, 0.05, 8, false); // 軌道線をさらに太く
      const material = new THREE.MeshBasicMaterial({
        color: orbit.color,
        transparent: true,
        opacity: 1.0, // 完全不透明にして視認性を最大化
      });

      const orbitMesh = new THREE.Mesh(geometry, material);
      orbitMesh.userData = { type: "orbit", satelliteId: orbit.satelliteId };
      scene.add(orbitMesh);

      // 衛星の現在位置にマーカーを追加（大きく視認しやすく）
      const point = orbit.currentPosition;

      // メインの衛星マーカー（非常に大きく、目立つ赤い球体）
      const geometry2 = new THREE.SphereGeometry(0.3, 32, 32); // サイズを大幅に拡大、高解像度
      const material2 = new THREE.MeshBasicMaterial({
        color: "#ff0000", // 鮮やかな赤色
      });

      const satelliteMesh = new THREE.Mesh(geometry2, material2);

      // 衛星の周りに光るリングを追加（大きく）
      const ringGeometry = new THREE.RingGeometry(0.4, 0.6, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: "#ff0000",
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

      // 外側の光るエフェクト（さらに大きく）
      const outerRingGeometry = new THREE.RingGeometry(0.8, 1.0, 32);
      const outerRingMaterial = new THREE.MeshBasicMaterial({
        color: "#ff0000",
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const outerRingMesh = new THREE.Mesh(
        outerRingGeometry,
        outerRingMaterial
      );

      // 緯度経度を3D座標に変換
      const latRad = (point.lat * Math.PI) / 180;
      const lngRad = (point.lng * Math.PI) / 180;
      const radius = 1 + point.altitude / 6371;

      const satellitePosition = new THREE.Vector3(
        radius * Math.cos(latRad) * Math.cos(lngRad),
        radius * Math.sin(latRad),
        radius * Math.cos(latRad) * Math.sin(lngRad)
      );

      // 衛星マーカーの位置を設定
      satelliteMesh.position.copy(satellitePosition);
      satelliteMesh.userData = {
        type: "satellite",
        satelliteId: orbit.satelliteId,
        originalColor: "#ff0000", // 赤色に統一
      };
      scene.add(satelliteMesh);

      // リングの位置と向きを設定
      ringMesh.position.copy(satellitePosition);
      outerRingMesh.position.copy(satellitePosition);

      // リングを地球の中心から衛星への方向に向ける
      const direction = satellitePosition.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = direction.clone().cross(up).normalize();
      up.copy(right.clone().cross(direction));

      ringMesh.lookAt(satellitePosition.clone().add(direction));
      outerRingMesh.lookAt(satellitePosition.clone().add(direction));

      // リングをシーンに追加
      ringMesh.userData = {
        type: "satellite-ring",
        satelliteId: orbit.satelliteId,
      };
      outerRingMesh.userData = {
        type: "satellite-outer-ring",
        satelliteId: orbit.satelliteId,
      };
      scene.add(ringMesh);
      scene.add(outerRingMesh);
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Globe
        ref={globeRef}
        width={globeSize.width}
        height={globeSize.height}
        backgroundColor="#000000"
        globeImageUrl={globeImageUrl}
        bumpImageUrl={bumpImageUrl}
        backgroundImageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0ic3RhciI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IndoaXRlIiBzdG9wLW9wYWNpdHk9IjEiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSJ3aGl0ZSIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICA8L3JhZGlhbEdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDAwMDAwIi8+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIzMCIgcj0iMSIgZmlsbD0idXJsKCNzdGFyKSIvPgogIDxjaXJjbGUgY3g9IjQwIiBjeT0iNzAiIHI9IjEuNSIgZmlsbD0idXJsKCNzdGFyKSIvPgogIDxjaXJjbGUgY3g9IjkwIiBjeT0iNDAiIHI9IjAuNSIgZmlsbD0idXJsKCNzdGFyKSIvPgogIDxjaXJjbGUgY3g9IjEzMCIgY3k9IjgwIiByPSIxIiBmaWxsPSJ1cmwoI3N0YXIpIi8+CiAgPGNpcmNsZSBjeD0iMTYwIiBjeT0iMzAiIHI9IjEuNSIgZmlsbD0idXJsKCNzdGFyKSIvPgogIDxjaXJjbGUgY3g9IjE5MCIgY3k9IjcwIiByPSIxIiBmaWxsPSJ1cmwoI3N0YXIpIi8+CiAgPGNpcmNsZSBjeD0iMjIwIiBjeT0iNDAiIHI9IjAuNSIgZmlsbD0idXJsKCNzdGFyKSIvPgogIDxjaXJjbGUgY3g9IjI1MCIgY3k9IjgwIiByPSIxLjUiIGZpbGw9InVybCgjc3RhcikiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIzMCIgcj0iMSIgZmlsbD0idXJsKCNzdGFyKSIvPgogIDxjaXJjbGUgY3g9IjMxMCIgY3k9IjcwIiByPSIxIiBmaWxsPSJ1cmwoI3N0YXIpIi8+CiAgPGNpcmNsZSBjeD0iMzQwIiBjeT0iNDAiIHI9IjEuNSIgZmlsbD0idXJsKCNzdGFyKSIvPgogIDxjaXJjbGUgY3g9IjM3MCIgY3k9IjgwIiByPSIwLjUiIGZpbGw9InVybCgjc3RhcikiLz4KICA8Y2lyY2xlIGN4PSIzMDAiIGN5PSIxMDAiIHI9IjEiIGZpbGw9InVybCgjc3RhcikiLz4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjE1MCIgcj0iMS41IiBmaWxsPSJ1cmwoI3N0YXIpIi8+CiAgPGNpcmNsZSBjeD0iMTIwIiBjeT0iMTIwIiByPSIwLjUiIGZpbGw9InVybCgjc3RhcikiLz4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjEiIGZpbGw9InVybCgjc3RhcikiLz4KICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIxMjAiIHI9IjEuNSIgZmlsbD0idXJsKCNzdGFyKSIvPgogIDxjaXJjbGUgY3g9IjM1MCIgY3k9IjE4MCIgcj0iMSIgZmlsbD0idXJsKCNzdGFyKSIvPgogPC9zdmc+"
        showAtmosphere={true}
        atmosphereColor="#1e40af"
        atmosphereAltitude={0.15}
        enablePointerInteraction={true}
        showPointerCursor={true}
        animateIn={true}
        onGlobeReady={() => {
          if (globeRef.current) {
            // カメラの初期位置を設定（衛星が見やすい位置に）
            const cameraPos = {
              lat: 20,
              lng: 0,
              altitude: 3.5, // より遠くから見て衛星を確認しやすく
            };
            globeRef.current.pointOfView(cameraPos);

            // 昼夜サイクルのためのライト設定
            const scene = globeRef.current.scene();
            if (scene) {
              // 既存のライトを削除
              const existingLights = scene.children.filter((child: any) =>
                child.type.includes("Light")
              );
              existingLights.forEach((light: any) => scene.remove(light));

              // 太陽の位置に基づく方向ライトを追加（太陽光の色に変更）
              const sunPos = getSunPosition();
              const hours = time.getUTCHours() + time.getUTCMinutes() / 60;

              // 時間に応じて太陽光の色を変化させる
              let sunColor = "#ffffff"; // デフォルトは白色
              let sunIntensity = 5.0;

              if (hours >= 6 && hours <= 18) {
                // 日中：暖かい太陽光
                sunColor = "#fff8e1";
                sunIntensity = 5.0;
              } else if (hours >= 5 && hours <= 7) {
                // 日の出・日の入り：オレンジ色
                sunColor = "#ffb74d";
                sunIntensity = 3.0;
              } else if (hours >= 17 && hours <= 19) {
                // 夕方：オレンジ色
                sunColor = "#ff8a65";
                sunIntensity = 3.0;
              } else {
                // 夜間：月光
                sunColor = "#e3f2fd";
                sunIntensity = 1.0;
              }

              const directionalLight = new THREE.DirectionalLight(
                sunColor,
                sunIntensity
              );
              directionalLight.position.set(sunPos.x, sunPos.y, sunPos.z);
              scene.add(directionalLight);

              // 太陽は光としてのみ表現（実際の太陽は地球から1億5000万km離れているため可視化しない）

              // 環境光を追加（明るく調整）
              const ambientLight = new THREE.AmbientLight("#5b9bd5", 0.8);
              scene.add(ambientLight);

              // 追加の補助ライトを追加（全方向から照らす）
              const hemisphereLight = new THREE.HemisphereLight(
                "#87ceeb",
                "#4a90e2",
                1.2
              );
              scene.add(hemisphereLight);

              // 衛星の軌道と現在位置を描画
              drawSatelliteOrbits(scene);

              // 地球の自転を開始
              let animationId: number;

              const rotateGlobe = () => {
                const time = Date.now() * 0.001; // 時間を秒単位に変換

                // シーン内の地球メッシュを探して回転させる
                scene.traverse((child: any) => {
                  if (
                    child.isMesh &&
                    child.geometry &&
                    child.geometry.type === "SphereGeometry"
                  ) {
                    // 地球のメッシュを回転（Y軸周り）
                    child.rotation.y += 0.001; // 自転速度（調整可能）
                  }

                  // 衛星の位置をリアルタイム更新
                  if (
                    child.userData?.type === "satellite" ||
                    child.userData?.type === "satellite-ring" ||
                    child.userData?.type === "satellite-outer-ring"
                  ) {
                    const satelliteId = child.userData.satelliteId;
                    if (satelliteId) {
                      // 衛星の新しい位置を計算
                      let altitude = 400;
                      let inclination = 0;

                      switch (satelliteId) {
                        case "himawari8":
                          altitude = 35786;
                          inclination = 0;
                          break;
                        case "goes16":
                          altitude = 35786;
                          inclination = 0;
                          break;
                        case "terra":
                          altitude = 705;
                          inclination = 98.5;
                          break;
                        case "landsat8":
                          altitude = 705;
                          inclination = 98.2;
                          break;
                        case "worldview3":
                          altitude = 617;
                          inclination = 98.0;
                          break;
                      }

                      const lat = calculateSatelliteLatitude(
                        satelliteId,
                        altitude,
                        inclination
                      );
                      const lng = calculateSatelliteLongitude(
                        satelliteId,
                        altitude,
                        inclination
                      );

                      // 緯度経度を3D座標に変換
                      const latRad = (lat * Math.PI) / 180;
                      const lngRad = (lng * Math.PI) / 180;
                      const radius = 1 + altitude / 6371;

                      const newPosition = new THREE.Vector3(
                        radius * Math.cos(latRad) * Math.cos(lngRad),
                        radius * Math.sin(latRad),
                        radius * Math.cos(latRad) * Math.sin(lngRad)
                      );

                      child.position.copy(newPosition);
                    }
                  }

                  // 衛星マーカーの点滅効果（赤色で統一）
                  if (child.userData?.type === "satellite") {
                    const pulse = Math.sin(time * 4) * 0.5 + 1.0; // 0.5〜1.5の間で点滅（より激しく）
                    const color = new THREE.Color("#ff0000"); // 鮮やかな赤色
                    color.multiplyScalar(pulse);
                    child.material.color = color;
                  }

                  // リングの透明度も点滅（赤色で統一）
                  if (child.userData?.type === "satellite-ring") {
                    const pulse = Math.sin(time * 3) * 0.3 + 0.7; // 0.4〜1.0の間で点滅
                    child.material.opacity = pulse;
                  }

                  if (child.userData?.type === "satellite-outer-ring") {
                    const pulse = Math.sin(time * 2) * 0.2 + 0.4; // 0.2〜0.6の間で点滅
                    child.material.opacity = pulse;
                  }
                });

                animationId = requestAnimationFrame(rotateGlobe);
              };

              // アニメーション開始
              rotateGlobe();

              // クリーンアップ用の関数を保存
              (globeRef.current as any).stopRotation = () => {
                if (animationId) {
                  cancelAnimationFrame(animationId);
                }
              };
            }
          }
        }}
      />

      {/* デバッグ情報表示 */}
      {/* <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          color: "white",
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "11px",
          maxWidth: "200px",
        }}
      >
        <div>API Satellites: {satelliteOrbits.length}</div>
        <div>Active Satellites: {activeSatellites.length}</div>
        <div>Available: {availableSatellites.length}</div>
        <div>Selected IDs: {selectedSatelliteIds.join(", ")}</div>
        <div>Following: {selectedSatellite || "None"}</div>
        {activeSatellites.map((orbit: any, index: number) => {
          const pos = getSatelliteCurrentPosition(orbit.satellite_id);
          return (
            <div key={orbit.satellite_id} style={{ fontSize: "10px" }}>
              {orbit.satellite_id}: {orbit.altitude}km
              <br />
              Pos: {pos.lat.toFixed(1)}°, {pos.lng.toFixed(1)}°
            </div>
          );
        })}
      </div> */}

      {/* 衛星情報表示 */}
      {/* {activeSatellites.length > 0 && ( 
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            color: "white",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "15px",
            borderRadius: "8px",
            fontSize: "12px",
            maxWidth: "300px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#4ecdc4" }}>
            🛰️ Active Satellites
          </h3>
          {activeSatellites.map((orbit: any, index: number) => {
            // 実際の軌道高度を取得
            let actualAltitude = orbit.altitude;
            let orbitalType = "Unknown";

            switch (orbit.satellite_id) {
              case "himawari8":
                actualAltitude = 35786;
                orbitalType = "Geostationary";
                break;
              case "goes16":
                actualAltitude = 35786;
                orbitalType = "Geostationary";
                break;
              case "terra":
                actualAltitude = 705;
                orbitalType = "Polar";
                break;
              case "landsat8":
                actualAltitude = 705;
                orbitalType = "Polar";
                break;
              case "worldview3":
                actualAltitude = 617;
                orbitalType = "Low Earth";
                break;
            }

            return (
              <div
                key={orbit.satellite_id}
                onClick={() => moveCameraToSatellite(orbit.satellite_id)}
                style={{
                  marginBottom: "10px",
                  borderLeft: `3px solid ${getSatelliteColor(index)}`,
                  paddingLeft: "10px",
                  backgroundColor:
                    selectedSatellite === orbit.satellite_id
                      ? "rgba(255,0,0,0.3)" // 選択時は赤い背景
                      : "rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  padding: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform:
                    selectedSatellite === orbit.satellite_id
                      ? "scale(1.05)"
                      : "scale(1)",
                  boxShadow:
                    selectedSatellite === orbit.satellite_id
                      ? "0 0 10px rgba(255,0,0,0.5)" // 選択時は赤い光
                      : "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <strong style={{ color: getSatelliteColor(index) }}>
                  {orbit.satellite_id.toUpperCase()}
                </strong>
                <br />
                <span style={{ fontSize: "11px", opacity: 0.8 }}>
                  Type: {orbitalType}
                  <br />
                  Altitude: {actualAltitude.toFixed(0)} km
                  <br />
                  Speed: {orbit.orbital_speed.toFixed(2)} km/s
                  <br />
                  <span
                    style={{
                      fontSize: "10px",
                      opacity: 0.6,
                      fontStyle: "italic",
                    }}
                  >
                    Click to view
                  </span>
                </span>
              </div>
            );
          })}
          <div
            style={{
              fontSize: "10px",
              opacity: 0.6,
              marginTop: "10px",
              textAlign: "center",
            }}
          >
            Real-time orbital simulation
          </div>
          <button
            onClick={() => {
              if (globeRef.current) {
                globeRef.current.pointOfView(
                  {
                    lat: 20,
                    lng: 0,
                    altitude: 3.5,
                  },
                  2000
                );
                // 選択状態をクリア
                setSelectedSatellite(null);
              }
            }}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "8px",
              backgroundColor: "rgba(78, 205, 196, 0.2)",
              border: "1px solid #4ecdc4",
              borderRadius: "4px",
              color: "#4ecdc4",
              cursor: "pointer",
              fontSize: "11px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(78, 205, 196, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(78, 205, 196, 0.2)";
            }}
          >
            Reset Camera View
          </button>
        </div>
      )} */}
    </div>
  );
}
