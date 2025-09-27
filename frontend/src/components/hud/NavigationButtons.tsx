"use client";

import Link from "next/link";

export default function NavigationButtons() {
  return (
    <div className="flex gap-2">
      <Link
        href="/"
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded transition-colors duration-200 backdrop-blur-sm border border-blue-500/30"
      >
        Home
      </Link>
      <Link
        href="/game"
        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-medium rounded transition-colors duration-200 backdrop-blur-sm border border-green-500/30"
      >
        Game
      </Link>
    </div>
  );
}
