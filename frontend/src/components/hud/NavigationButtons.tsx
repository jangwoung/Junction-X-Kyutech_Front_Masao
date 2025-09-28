"use client";

import Link from "next/link";

export default function NavigationButtons() {
  return (
    <div className="flex gap-2">
      <Link
        href="/camera"
        className="px-4 py-2 text-white text-[10px] font-medium rounded border border-white-500/30"
      >
        Camera
      </Link>
      <Link
        href="/game"
        className="px-4 py-2 text-white text-[10px] font-medium rounded border border-white-500/30"
      >
        Pilot
      </Link>
    </div>
  );
}
