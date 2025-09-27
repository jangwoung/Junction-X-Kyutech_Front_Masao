"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useSatellitePanelData } from "@/lib/hooks/useSatellitePanelData";
import { DebrisThreat } from "@/app/home/components/types";
import { generateMockDebrisData } from "@/app/home/components/utils";

type MaybeStr = string | number | undefined | null;

function toLowerStr(v: MaybeStr) {
  return typeof v === "string" ? v.toLowerCase() : String(v ?? "");
}

// Space-Track 準拠の候補（優先順）: コンポーネント外に配置して安定参照にする
const HIMAWARI_PRIORITY = [
  // 1) SATCAT (NORAD)
  { field: "noradId", value: 41836 }, // Himawari-9
  { field: "satcat", value: 41836 },
  { field: "norad", value: 41836 },

  { field: "noradId", value: 40267 }, // Himawari-8
  { field: "satcat", value: 40267 },
  { field: "norad", value: 40267 },

  // 2) OBJECT_ID (COSPAR)
  { field: "objectId", value: "2016-064A" }, // H-9
  { field: "cosparId", value: "2016-064A" },
  { field: "object_id", value: "2016-064A" },

  { field: "objectId", value: "2014-060A" }, // H-8
  { field: "cosparId", value: "2014-060A" },
  { field: "object_id", value: "2014-060A" },

  // 3) OBJECT_NAME（Space-Track の名前表記）
  { field: "objectName", value: "HIMAWARI-9" },
  { field: "name", value: "HIMAWARI-9" },

  { field: "objectName", value: "HIMAWARI-8" },
  { field: "name", value: "HIMAWARI-8" },

  // 4) 自由表記のゆらぎ（id/nameに含まれる）
  { field: "id", value: "himawari-9" },
  { field: "id", value: "himawari9" },
  { field: "name", value: "himawari 9" },

  { field: "id", value: "himawari-8" },
  { field: "id", value: "himawari8" },
  { field: "name", value: "himawari 8" },

  // 5) 最後の保険：'himawari' 部分一致
  { field: "id", value: "himawari" },
  { field: "name", value: "himawari" },
] as const;

function getFieldValue(obj: unknown, key: string): MaybeStr {
  if (obj && typeof obj === "object") {
    const rec = obj as Record<string, unknown>;
    const value = rec[key];
    if (typeof value === "string" || typeof value === "number") return value;
    return value == null ? undefined : String(value);
  }
  return undefined;
}

export default function SatellitePanel() {
  const satellites = useGameStore((s) => s.satellites);
  const selectedSatelliteId = useGameStore((s) => s.selectedSatelliteId);
  const setSelectedSatelliteId = useGameStore((s) => s.setSelectedSatelliteId);

  // デブリ情報の状態管理
  const [debris, setDebris] = useState<DebrisThreat[]>([]);
  const [debrisLoading, setDebrisLoading] = useState(true);
  const mountedRef = useRef(true);

  const selected = useMemo(
    () => satellites.find((s) => s.id === selectedSatelliteId),
    [satellites, selectedSatelliteId]
  );

  const defaultSatelliteId = useMemo(() => {
    // .env 明示があれば最優先
    const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_SATELLITE_ID as
      | string
      | undefined;
    if (fromEnv) return fromEnv;

    // STARLINK-32713 を最優先で試す
    const starlinkExact = satellites.find(
      (s) =>
        toLowerStr(s?.id) === "starlink-32713" ||
        toLowerStr(s?.name) === "starlink-32713"
    );
    if (starlinkExact) return starlinkExact.id as string;
    // ストア未取得でもバックエンドに存在する想定で固定IDを返す
    const prefer = "STARLINK-32713";
    if (prefer) return prefer;

    // 次点：既存Himawari優先ルール
    for (const rule of HIMAWARI_PRIORITY) {
      const hit = satellites.find((s) => {
        const v: MaybeStr = getFieldValue(s as unknown, rule.field);
        if (v == null) return false;
        if (typeof rule.value === "number") {
          const num = typeof v === "number" ? v : Number(v);
          return num === rule.value;
        }
        const vs = toLowerStr(v);
        const rs = String(rule.value).toLowerCase();
        return rs === "himawari" ? vs.includes(rs) : vs === rs;
      });
      if (hit) return hit.id as string;
    }

    // 最後のフォールバック：先頭
    return satellites[0]?.id;
  }, [satellites]);

  useEffect(() => {
    if (!selectedSatelliteId && defaultSatelliteId) {
      setSelectedSatelliteId(defaultSatelliteId);
    }
  }, [selectedSatelliteId, defaultSatelliteId, setSelectedSatelliteId]);

  // デブリ情報の取得
  useEffect(() => {
    const controller = new AbortController();
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

    mountedRef.current = true;
    setDebrisLoading(true);

    fetch(`${base}/api/v1/mission/debris/demo/threats`, {
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
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setDebrisLoading(false);
        }
      });

    return () => {
      controller.abort();
      mountedRef.current = false;
    };
  }, []);

  const effectiveSatelliteId = selectedSatelliteId || defaultSatelliteId;
  const panel = useSatellitePanelData(effectiveSatelliteId);
  if (panel.isLoading) {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-gray-300">Loading...</div>
      </div>
    );
  }
  if (panel.isError) {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-red-400">
          Error: {panel.errorMessage || "データ取得に失敗しました"}
        </div>
      </div>
    );
  }
  const altitudeText =
    panel.altitudeKm != null ? panel.altitudeKm.toFixed(1) : "—";
  const visibilityText = panel.visibility ?? "—";
  const nextPassText = panel.nextPass
    ? new Date(panel.nextPass).toLocaleTimeString("ja-JP", {
        timeZone: "Asia/Tokyo",
      })
    : "—";
  const r = panel.status?.status?.attitude?.roll;
  const p = panel.status?.status?.attitude?.pitch;
  const y = panel.status?.status?.attitude?.yaw;
  const attitudeText =
    r != null && p != null && y != null
      ? `${r.toFixed(1)} / ${p.toFixed(1)} / ${y.toFixed(1)}`
      : "— / — / —";
  const powerText =
    panel.status?.status?.power != null
      ? `${Math.round(panel.status.status.power)}%`
      : "—%";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center truncate">
        <span className="text-[10px] text-gray-300">Satellite</span>
        <span className="mx-1 text-gray-500">|</span>
        {selected ? (
          <span className="truncate">
            <span title={selected.id} className="font-medium text-[10px]">
              {selected.name}
            </span>
            <span className="text-gray-300 text-[10px]"> (</span>
            <span className="font-mono text-[10px]" title={selected.id}>
              {selected.id.slice(0, 8)}
            </span>
            <span className="text-gray-300 text-[10px]">)</span>
          </span>
        ) : (
          <span className="text-gray-300 text-[10px]">
            {effectiveSatelliteId ?? "None"}
          </span>
        )}
      </div>
      <div className="flex items-center">
        <span className="text-[10px] text-gray-300">Altitude</span>
        <span className="mx-1 text-gray-500">|</span>
        <span className="font-mono text-[10px]">{altitudeText}</span>
        <span className="text-[10px] text-gray-300"> km</span>
      </div>
      <div className="flex items-center">
        <span className="text-[10px] text-gray-300">Visibility</span>
        <span className="mx-1 text-gray-500">|</span>
        <span className="text-[10px]">{visibilityText}</span>
        <span className="text-[10px] text-gray-300"> @ </span>
        <span className="font-mono text-[10px]">{nextPassText}</span>
      </div>
      <div className="flex items-center">
        <span className="text-[10px] text-gray-300">Speed</span>
        <span className="mx-1 text-gray-500">|</span>
        <span className="font-mono text-[10px]">
          {panel.orbit?.orbital_speed != null
            ? panel.orbit.orbital_speed.toFixed(2)
            : "—"}
        </span>
        <span className="text-[10px] text-gray-300"> km/s</span>
      </div>
      <div className="flex items-center">
        <span className="text-[10px] text-gray-300">Attitude R/P/Y</span>
        <span className="mx-1 text-gray-500">|</span>
        <span className="font-mono text-[10px]">{attitudeText}</span>
      </div>
      <div className="flex items-center">
        <span className="text-[10px] text-gray-300">Power</span>
        <span className="mx-1 text-gray-500">|</span>
        <span className="font-mono text-[10px]">{powerText}</span>
      </div>
      <div className="flex items-center">
        <span className="text-[10px] text-gray-300">Health/Fuel</span>
        <span className="mx-1 text-gray-500">|</span>
        <span className="font-mono text-[10px]">
          {panel.status?.status?.health ?? "—"}
        </span>
        <span className="text-[10px] text-gray-300"> / </span>
        <span className="font-mono text-[10px]">
          {panel.status?.status?.fuel != null
            ? `${panel.status.status.fuel.toFixed(1)} kg`
            : "— kg"}
        </span>
      </div>
      {!debrisLoading && debris.length > 0 && (
        <>
          <div className="flex items-center">
            <span className="text-[10px] text-gray-300">
              Debris Collision Risk
            </span>
            <span className="mx-1 text-gray-500">|</span>
            <span className="font-mono text-[10px]">
              {" "}
              50%:{" "}
              {
                debris.filter((d) => (d.collision_probability ?? 0) > 0.5)
                  .length
              }
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-[10px] text-gray-300">Close Approach 1h</span>
            <span className="mx-1 text-gray-500">|</span>
            <span className="font-mono text-[10px]">
              {" "}
              {
                debris.filter((d) => (d.time_to_closest ?? Infinity) < 3600000)
                  .length
              }
            </span>
          </div>
        </>
      )}
    </div>
  );
}
