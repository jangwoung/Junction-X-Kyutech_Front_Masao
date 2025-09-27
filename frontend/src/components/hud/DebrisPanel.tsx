"use client";

import React, { useEffect, useState, useRef } from "react";
import { DebrisThreat } from "@/app/home/components/types";
import { generateMockDebrisData } from "@/app/home/components/utils";

interface DebrisPanelProps {
  missionId?: string;
}

export default function DebrisPanel({ missionId = "demo" }: DebrisPanelProps) {
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
        const items: DebrisThreat[] = json?.threats ?? [];

        // データが空または無効な場合、モックデータを生成
        let finalItems = items;
        if (
          items.length === 0 ||
          !items.some((item) => item.position && item.velocity)
        ) {
          finalItems = generateMockDebrisData();
        }

        if (mountedRef.current) {
          setDebris(finalItems);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          return;
        }
        console.error("デブリデータ取得エラー:", err);

        if (mountedRef.current) {
          setDebris(generateMockDebrisData());
          setError(null);
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

  // 危険度レベルごとにデブリをグループ化
  const debrisByLevel = React.useMemo(() => {
    const groups: { [key: number]: DebrisThreat[] } = {};
    debris.forEach((d) => {
      const level = d.danger_level;
      if (!groups[level]) groups[level] = [];
      groups[level].push(d);
    });
    return groups;
  }, [debris]);

  // 危険度に応じた色を取得
  const getDangerColor = (dangerLevel: number): string => {
    if (dangerLevel >= 9) return "#ff0000"; // 最高危険度：赤
    if (dangerLevel >= 7) return "#ff4500"; // 高危険度：オレンジ赤
    if (dangerLevel >= 5) return "#ff7043"; // 中高危険度：オレンジ
    if (dangerLevel >= 3) return "#ffa726"; // 中危険度：黄色オレンジ
    if (dangerLevel >= 2) return "#ffeb3b"; // 低危険度：黄色
    return "#66bb6a"; // 最低危険度：緑
  };

  if (loading) {
    return (
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 min-w-[200px]">
        <div className="text-white text-sm">デブリ情報を読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 min-w-[200px]">
        <div className="text-red-400 text-sm">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 min-w-[200px]">
      <div className="text-white font-bold text-sm mb-2">
        デブリ脅威: {debris.length}個
      </div>

      {/* 危険度別のデブリ数表示 */}
      {Object.entries(debrisByLevel)
        .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 危険度の高い順にソート
        .map(([level, levelDebris]) => {
          const color = getDangerColor(parseInt(level));
          return (
            <div
              key={level}
              className="flex items-center mb-1 text-xs"
            >
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 4px ${color}`,
                }}
              />
              <span className="text-white">
                危険度{level}: {levelDebris.length}個
              </span>
            </div>
          );
        })}

      {/* 追加統計情報 */}
      {debris.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/20 text-xs text-white/80">
          <div className="mb-1">
            衝突確率 &gt; 50%:{" "}
            {debris.filter((d) => (d.collision_probability ?? 0) > 0.5).length}個
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
  );
}
