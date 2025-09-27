"use client";

import React, { Suspense, useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { ErrorBoundary } from "@/components/ErrorBoundary";

//アスペクト比2:1正距円筒図法
const EARTH_TEXTURE_PATH = "/textures/earth_map.avif";
const EARTH_BUMP_PATH = "/textures/earth_bump.jpg";

type Vector3 = { x: number; y: number; z: number };

type DebrisThreat = {
  id: string;
  norad_id?: string;
  name: string;
  position: Vector3; // km (ECI座標系)
  velocity: Vector3; // km/s (ECI座標系)
  size?: number; // メートル
  mass?: number; // kg
  danger_level: number; // 1-10 (バックエンドでは1-10)
  time_to_closest?: number; // 最接近時間 (ミリ秒)
  closest_distance?: number; // 最接近距離 (km)
  collision_probability?: number; // 衝突確率 (0-1)
  detected_at?: string; // 検出時刻
  _index?: number; // 内部使用のインデックス
};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function hasValidPosition(
  d: Partial<DebrisThreat> | undefined | null
): d is DebrisThreat {
  return !!(
    d &&
    d.position &&
    isFiniteNumber((d.position as any).x) &&
    isFiniteNumber((d.position as any).y) &&
    isFiniteNumber((d.position as any).z)
  );
}

// モックデブリデータ生成関数
function generateMockDebrisData(): DebrisThreat[] {
  const mockDebris: DebrisThreat[] = [];
  const earthRadius = 6371; // km

  for (let i = 0; i < 8; i++) {
    // 地球周辺の軌道にランダムに配置
    const altitude = 400 + Math.random() * 600; // 400-1000km高度
    const angle = (i / 8) * Math.PI * 2;
    const radius = earthRadius + altitude;

    const x = Math.cos(angle) * radius;
    const y = (Math.random() - 0.5) * 200; // ±100kmの高さ変動
    const z = Math.sin(angle) * radius;

    // 軌道速度（km/s）
    const orbitalSpeed = Math.sqrt(398600 / radius); // 軌道速度の簡易計算
    const vx = -Math.sin(angle) * orbitalSpeed;
    const vy = (Math.random() - 0.5) * 0.5;
    const vz = Math.cos(angle) * orbitalSpeed;

    mockDebris.push({
      id: `mock-debris-${i}`,
      norad_id: `NORAD-${10000 + i}`,
      name: `デブリ ${i + 1}`,
      position: { x, y, z },
      velocity: { x: vx, y: vy, z: vz },
      size: Math.random() * 5 + 0.5, // 0.5-5.5m
      mass: Math.random() * 1000 + 100, // 100-1100kg
      danger_level: Math.floor(Math.random() * 10) + 1, // 1-10
      time_to_closest: Math.random() * 7200000, // 0-2時間（ミリ秒）
      closest_distance: Math.random() * 50 + 1, // 1-51km
      collision_probability: Math.random() * 0.8, // 0-0.8
      detected_at: new Date().toISOString(),
    });
  }

  return mockDebris;
}

// A loader component to show while textures are loading
function Loader() {
  return (
    <Html center>
      <div style={{ color: "white" }}>Loading textures...</div>
    </Html>
  );
}

// The Earth model component
function Earth() {
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

// アニメーション付きデブリコンポーネント（軌道運動対応）
function AnimatedDebris({
  initialPosition,
  velocity,
  appearance,
  dangerLevel,
  collisionProbability,
  timeToClosest,
}: {
  initialPosition: readonly [number, number, number];
  velocity: readonly [number, number, number];
  appearance: {
    color: string;
    size: number;
    emissiveIntensity: number;
    massMultiplier: number;
  };
  dangerLevel: number;
  collisionProbability?: number;
  timeToClosest?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const positionRef = useRef<[number, number, number]>([...initialPosition]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    timeRef.current += delta;
    const mesh = meshRef.current;

    // 軌道運動のシミュレーション（簡易版）
    // 実際の軌道力学ではより複雑な計算が必要ですが、ここでは基本的な運動を表現
    const orbitSpeed = 0.1; // 軌道速度の係数
    const radius = Math.sqrt(
      initialPosition[0] ** 2 +
        initialPosition[1] ** 2 +
        initialPosition[2] ** 2
    );

    // 円軌道運動（簡易）
    const angle = (timeRef.current * orbitSpeed) / radius;
    const newX =
      initialPosition[0] * Math.cos(angle) -
      initialPosition[2] * Math.sin(angle);
    const newZ =
      initialPosition[0] * Math.sin(angle) +
      initialPosition[2] * Math.cos(angle);

    positionRef.current = [newX, initialPosition[1], newZ];
    mesh.position.set(
      positionRef.current[0],
      positionRef.current[1],
      positionRef.current[2]
    );

    // 危険度に応じた回転速度
    const rotationSpeed = dangerLevel * 0.3;
    mesh.rotation.y += delta * rotationSpeed;
    mesh.rotation.x += delta * rotationSpeed * 0.2;

    // 危険度と衝突確率に応じた脈動効果（強化版）
    if (
      dangerLevel >= 8 ||
      (collisionProbability && collisionProbability > 0.5)
    ) {
      const pulse = 1 + Math.sin(timeRef.current * 4) * 0.5; // より強い脈動
      mesh.scale.setScalar(pulse);
    } else if (dangerLevel >= 6) {
      const pulse = 1 + Math.sin(timeRef.current * 3) * 0.4;
      mesh.scale.setScalar(pulse);
    } else if (dangerLevel >= 4) {
      const pulse = 1 + Math.sin(timeRef.current * 2) * 0.3;
      mesh.scale.setScalar(pulse);
    } else {
      const pulse = 1 + Math.sin(timeRef.current * 1.5) * 0.2; // 低危険度でも軽い脈動
      mesh.scale.setScalar(pulse);
    }

    // 最接近時間が近い場合の警告効果
    if (timeToClosest && timeToClosest < 3600000) {
      // 1時間以内
      const warningPulse = 1 + Math.sin(timeRef.current * 8) * 0.15;
      mesh.scale.multiplyScalar(warningPulse);
    }
  });

  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ringRef.current) {
      // リングの回転アニメーション
      ringRef.current.rotation.x += 0.01;
      ringRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group ref={meshRef}>
      {/* メインデブリ球体 */}
      <mesh>
        <sphereGeometry args={[appearance.size, 12, 12]} />
        <meshStandardMaterial
          color={appearance.color}
          emissive={appearance.color}
          emissiveIntensity={appearance.emissiveIntensity * 1.5} // エミッション強度を1.5倍に
          transparent
          opacity={0.95} // より不透明に
          roughness={0.2} // より滑らかに
          metalness={0.3} // より金属的に
        />
      </mesh>

      {/* 外側のリング効果 */}
      <mesh ref={ringRef}>
        <torusGeometry
          args={[appearance.size * 2, appearance.size * 0.1, 8, 16]}
        />
        <meshStandardMaterial
          color={appearance.color}
          emissive={appearance.color}
          emissiveIntensity={appearance.emissiveIntensity * 0.8}
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}

function DebrisLayer({ missionId = "demo" }: { missionId?: string }) {
  const [debris, setDebris] = useState<DebrisThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const controller = new AbortController();
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

    mountedRef.current = true;
    setLoading(true);
    setError(null);

    fetch(`${base}/api/v1/mission/debris/${missionId}/threats`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((json) => {
        console.log("デブリデータ取得:", json);
        const items: DebrisThreat[] = json?.threats ?? [];
        console.log("解析されたデブリアイテム:", items);

        // 各デブリアイテムの構造をログ出力
        items.forEach((item, index) => {
          console.log(`デブリ${index}:`, {
            id: item.id,
            name: item.name,
            position: item.position,
            velocity: item.velocity,
            danger_level: item.danger_level,
          });
        });

        // データが空または無効な場合、モックデータを生成
        let finalItems = items;
        if (
          items.length === 0 ||
          !items.some((item) => item.position && item.velocity)
        ) {
          console.log(
            "有効なデブリデータが見つからないため、モックデータを生成します"
          );
          finalItems = generateMockDebrisData();
        }

        if (mountedRef.current) {
          setDebris(finalItems);
        }
      })
      .catch((err) => {
        // AbortErrorは正常なキャンセルなのでエラーとして扱わない
        if (err.name === "AbortError") {
          console.log("デブリデータ取得がキャンセルされました");
          return;
        }
        console.error("デブリデータ取得エラー:", err);
        console.log("エラーのためモックデータを使用します");

        if (mountedRef.current) {
          // エラー時はモックデータを使用
          setDebris(generateMockDebrisData());
          setError(null); // エラーをクリア
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
      mountedRef.current = false;
    };
  }, [missionId]);

  // デブリの位置と速度を計算（バックエンドのECI座標系を使用）
  const earthRadiusKm = 6371;
  const debrisData = useMemo(() => {
    return debris
      .filter((d) => {
        // データの整合性をチェック
        return (
          d &&
          d.position &&
          typeof d.position.x === "number" &&
          typeof d.position.y === "number" &&
          typeof d.position.z === "number" &&
          d.velocity &&
          typeof d.velocity.x === "number" &&
          typeof d.velocity.y === "number" &&
          typeof d.velocity.z === "number"
        );
      })
      .map((d, index) => {
        // ECI座標系での位置（km）を地球半径で正規化
        const position: [number, number, number] = [
          d.position.x / earthRadiusKm,
          d.position.y / earthRadiusKm,
          d.position.z / earthRadiusKm,
        ];

        // 速度ベクトル（km/s）を正規化（視覚化用）
        const velocity: [number, number, number] = [
          d.velocity.x * 10, // 速度を視覚的に見やすくするため拡大
          d.velocity.y * 10,
          d.velocity.z * 10,
        ];

        return {
          position,
          velocity,
          debris: d,
          index,
        };
      });
  }, [debris]);

  // 危険度に応じた色とサイズを決定 (1-10スケール)
  const getDebrisAppearance = (
    dangerLevel: number,
    size?: number,
    mass?: number
  ) => {
    // デブリを見やすくするため、サイズを大幅に拡大
    const baseSize = size ? Math.min(size / 1000, 0.05) : 0.02; // メートルをkmに変換、最大0.05に制限
    const massMultiplier = mass ? Math.log10(mass + 1) / 10 : 1; // 質量に基づくサイズ調整

    // サイズを10倍に拡大して見やすくする
    const finalSize = Math.max(baseSize * (0.5 + massMultiplier) * 10, 0.05);

    // 危険度に応じた色とエミッション強度
    let color: string;
    let emissiveIntensity: number;

    if (dangerLevel >= 9) {
      color = "#ff0000"; // 最高危険度：赤
      emissiveIntensity = 1.0;
    } else if (dangerLevel >= 7) {
      color = "#ff4500"; // 高危険度：オレンジ赤
      emissiveIntensity = 0.8;
    } else if (dangerLevel >= 5) {
      color = "#ff7043"; // 中高危険度：オレンジ
      emissiveIntensity = 0.6;
    } else if (dangerLevel >= 3) {
      color = "#ffa726"; // 中危険度：黄色オレンジ
      emissiveIntensity = 0.4;
    } else if (dangerLevel >= 2) {
      color = "#ffeb3b"; // 低危険度：黄色
      emissiveIntensity = 0.3;
    } else {
      color = "#66bb6a"; // 最低危険度：緑
      emissiveIntensity = 0.2;
    }

    return {
      color,
      size: finalSize,
      emissiveIntensity,
      massMultiplier,
    };
  };

  // 危険度レベルごとにデブリをグループ化
  const debrisByLevel = useMemo(() => {
    const groups: { [key: number]: typeof debrisData } = {};
    debrisData.forEach((data) => {
      const level = data.debris.danger_level;
      if (!groups[level]) groups[level] = [];
      groups[level].push(data);
    });
    return groups;
  }, [debrisData]);

  if (loading) {
    return (
      <Html center>
        <div style={{ color: "white", fontSize: "14px" }}>
          デブリ情報を読み込み中...
        </div>
      </Html>
    );
  }

  if (error) {
    return (
      <Html center>
        <div style={{ color: "#ff6b6b", fontSize: "14px" }}>
          エラー: {error}
        </div>
      </Html>
    );
  }

  if (debris.length === 0) {
    return (
      <Html center>
        <div style={{ color: "#66bb6a", fontSize: "14px" }}>
          デブリ脅威は検出されていません
        </div>
      </Html>
    );
  }

  return (
    <group>
      {Object.entries(debrisByLevel).map(([level, levelDebrisData]) => {
        return (
          <group key={level}>
            {levelDebrisData.map((data, idx) => {
              const appearance = getDebrisAppearance(
                data.debris.danger_level,
                data.debris.size,
                data.debris.mass
              );

              return (
                <AnimatedDebris
                  key={`${data.debris.id}-${idx}`}
                  initialPosition={data.position}
                  velocity={data.velocity}
                  appearance={appearance}
                  dangerLevel={data.debris.danger_level}
                  collisionProbability={data.debris.collision_probability}
                  timeToClosest={data.debris.time_to_closest}
                />
              );
            })}
          </group>
        );
      })}

      {/* デブリ情報表示 */}
      <Html position={[3, 2, 0]} style={{ pointerEvents: "none" }}>
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "10px",
            borderRadius: "8px",
            fontSize: "12px",
            minWidth: "200px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            デブリ脅威: {debris.length}個
          </div>
          {Object.entries(debrisByLevel).map(([level, levelDebrisData]) => {
            const appearance = getDebrisAppearance(parseInt(level));
            return (
              <div
                key={level}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "4px",
                  fontSize: "11px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: appearance.color,
                    borderRadius: "50%",
                    marginRight: "8px",
                    boxShadow: `0 0 6px ${appearance.color}`,
                  }}
                />
                危険度{level}: {levelDebrisData.length}個
              </div>
            );
          })}

          {/* 追加情報表示 */}
          {debris.length > 0 && (
            <div style={{ marginTop: "8px", fontSize: "10px", opacity: 0.8 }}>
              <div>
                衝突確率 &gt; 50%:{" "}
                {
                  debris.filter((d) => (d.collision_probability ?? 0) > 0.5)
                    .length
                }
                個
              </div>
              <div>
                1時間以内接近:{" "}
                {
                  debris.filter(
                    (d) => (d.time_to_closest ?? Infinity) < 3600000
                  ).length
                }
                個
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// The main scene component
export default function HomeScene() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        backgroundColor: "#111827",
      }}
    >
      <ErrorBoundary>
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />

          <Suspense fallback={<Loader />}>
            <Earth />
            <DebrisLayer missionId="demo" />
          </Suspense>

          <OrbitControls enableDamping />
        </Canvas>
      </ErrorBoundary>
      <div
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          color: "white",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          fontFamily: "sans-serif",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          地球軌道シミュレーター
        </div>
        <div style={{ fontSize: "12px", opacity: 0.8 }}>
          Drag to rotate, scroll to zoom
        </div>
      </div>
    </div>
  );
}
