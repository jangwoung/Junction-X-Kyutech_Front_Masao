"use client";

import { useMemo } from "react";
import { useGameStore } from "@/stores/gameStore";

export default function MissionProgress() {
  const missions = useGameStore((s) => s.missions);

  const missionProgress = useMemo(() => {
    const total = missions.length;
    const completed = missions.filter((m) => m.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [missions]);

  const missionSummary = useMemo(() => {
    if (missions.length === 0) return "No missions";
    const items = missions
      .map((m) => `${m.completed ? "✓ " : ""}${m.title}`)
      .slice(0, 3);
    const more = missions.length - items.length;
    return more > 0 ? `${items.join(", ")}, +${more} more` : items.join(", ");
  }, [missions]);

  return (
    <div className="mt-auto pt-3">
      <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
        <span className="truncate">{missionSummary}</span>
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
  );
}
