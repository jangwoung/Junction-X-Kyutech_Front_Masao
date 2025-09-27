"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
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

export default function TimePanel({ sessionEndsAtMs }: Props) {
  const [now, setNow] = useState<Date>(new Date());

  // endsAt は初期化時に固定し、props が変更された場合のみ更新する
  const endsAtRef = useRef<number>(
    sessionEndsAtMs && sessionEndsAtMs > Date.now()
      ? sessionEndsAtMs
      : Date.now() + 30 * 60 * 1000
  );

  useEffect(() => {
    if (sessionEndsAtMs && sessionEndsAtMs > Date.now()) {
      endsAtRef.current = sessionEndsAtMs;
    }
  }, [sessionEndsAtMs]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    const endsAt = endsAtRef.current ?? Date.now() + 30 * 60 * 1000;
    return Math.max(0, endsAt - now.getTime());
  }, [now]);

  return (
    <div className="flex flex-col gap-1 min-w-[16rem] backdrop-blur">
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
    </div>
  );
}
