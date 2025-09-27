"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Html } from "@react-three/drei";
import { DebrisThreat, DebrisAppearance } from "./types";
import { generateMockDebrisData } from "./utils";
import { AnimatedDebris } from "./AnimatedDebris";

interface DebrisLayerProps {
  missionId?: string;
}

export function DebrisLayer({ missionId = "demo" }: DebrisLayerProps) {
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
  ): DebrisAppearance => {
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

    </group>
  );
}
