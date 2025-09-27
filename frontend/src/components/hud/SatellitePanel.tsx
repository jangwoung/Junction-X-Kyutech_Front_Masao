"use client";

import { useMemo } from "react";
import { useGameStore } from "@/stores/gameStore";

export default function SatellitePanel() {
  const satellites = useGameStore((s) => s.satellites);
  const selectedSatelliteId = useGameStore((s) => s.selectedSatelliteId);

  const selected = useMemo(
    () => satellites.find((s) => s.id === selectedSatelliteId),
    [satellites, selectedSatelliteId]
  );

  return (
    <div className="flex flex-col gap-1">
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
  );
}
