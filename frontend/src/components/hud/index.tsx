"use client";

import TimePanel from "./TimePanel";
import SatellitePanel from "./SatellitePanel";
import MissionProgress from "./MissionProgress";
import GroundStationChat from "@/components/GroundStationChat";

type Props = {
  className?: string;
  sessionEndsAtMs?: number;
};

export default function Hud({ className, sessionEndsAtMs }: Props) {
  return (
    <div
      className={`pointer-events-auto w-svw h-svh select-none text-white shadow-lg p-4 flex flex-col ${
        className ?? ""
      }`}
    >
      <div className="flex justify-between gap-8 text-sm rounded-lg">
        <div className="flex flex-col gap-1 min-w-[16rem] backdrop-blur">
          <TimePanel sessionEndsAtMs={sessionEndsAtMs} />
          <SatellitePanel />
        </div>
        <div className="flex justify-between gap-8 text-sm rounded-lg">
          <GroundStationChat />
        </div>
      </div>

      <MissionProgress />
    </div>
  );
}
