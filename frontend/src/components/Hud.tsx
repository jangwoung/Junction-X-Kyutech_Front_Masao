"use client";

import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/stores/gameStore";

type Props = {
  className?: string;
  sessionEndsAtMs?: number;
};

function formatUtcTime(date: Date) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${f.format(date)}Z`;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function Hud({ className, sessionEndsAtMs }: Props) {
  const satellites = useGameStore((s) => s.satellites);
  const missions = useGameStore((s) => s.missions);
  const selectedSatelliteId = useGameStore((s) => s.selectedSatelliteId);

  const selected = useMemo(
    () => satellites.find((s) => s.id === selectedSatelliteId),
    [satellites, selectedSatelliteId]
  );

  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const endsAt = useMemo(() => {
    if (sessionEndsAtMs && sessionEndsAtMs > Date.now()) return sessionEndsAtMs;
    // fallback: 30分セッション
    return Date.now() + 30 * 60 * 1000;
  }, [sessionEndsAtMs, now]);

  const remaining = useMemo(() => endsAt - now.getTime(), [endsAt, now]);

  const missionProgress = useMemo(() => {
    const total = missions.length;
    const completed = missions.filter((m) => m.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [missions]);

  return (
    <div
      className={`pointer-events-auto w-svw h-svh select-none rounded-lg text-white shadow-lg p-4 flex flex-col ${
        className ?? ""
      }`}
    >
      {/* 左側に位置する情報 */}
      <div className="flex justify-between gap-8 text-sm backdrop-blur">
        <div className="flex flex-col gap-1 min-w-[16rem]">
          <div className="flex items-center">
            <span className="text-xs text-gray-300">UTC</span>
            <span className="mx-1 text-gray-500">|</span>
            <span className="font-mono">{formatUtcTime(now)}</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-300">Remaining</span>
            <span className="mx-1 text-gray-500">|</span>
            <span className="font-mono">{formatRemaining(remaining)}</span>
          </div>
          <div className="flex items-center truncate">
            <span className="text-xs text-gray-300">Satellite</span>
            <span className="mx-1 text-gray-500">|</span>
            {selected ? (
              <span className="truncate">
                <span title={selected.id} className="font-medium">
                  {selected.name}
                </span>
                <span className="text-gray-300"> (</span>
                <span className="font-mono text-xs" title={selected.id}>
                  {selected.id.slice(0, 8)}
                </span>
                <span className="text-gray-300">)</span>
              </span>
            ) : (
              <span className="text-gray-300">None</span>
            )}
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-300">Altitude</span>
            <span className="mx-1 text-gray-500">|</span>
            <span className="font-mono">—</span>
            <span className="text-xs text-gray-300"> km</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-300">Visibility</span>
            <span className="mx-1 text-gray-500">|</span>
            <span>In-View / Out-of-View</span>
            <span className="text-xs text-gray-300"> @ </span>
            <span className="font-mono">—</span>
          </div>
        </div>

        {/* 右側に位置する情報 */}
        <div className="flex flex-col gap-1 min-w-[16rem] backdrop-blur">
          <div className="flex items-center">
            <span className="text-xs text-gray-300">Elevation</span>
            <span className="mx-1 text-gray-500">|</span>
            <span className="font-mono">—</span>
            <span className="text-xs text-gray-300"> °</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-300">Attitude R/P/Y</span>
            <span className="mx-1 text-gray-500">|</span>
            <span className="font-mono">— / — / —</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-300">Power</span>
            <span className="mx-1 text-gray-500">|</span>
            <span className="font-mono">—%</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-300">Comms</span>
            <span className="mx-1 text-gray-500">|</span>
            <span className="font-mono">Down 0/0 kbps</span>
          </div>
        </div>
      </div>

      {/* 画面下部のミッション進捗 */}
      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
          <span>Mission Progress</span>
          <span className="font-mono">
            {missionProgress.completed} / {missionProgress.total} (
            {missionProgress.percent}%)
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded">
          <div
            className="h-1.5 bg-emerald-400 rounded"
            style={{ width: `${missionProgress.percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
