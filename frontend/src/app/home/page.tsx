"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import NavButton from "@/components/NavButton";

const HomeScene = dynamic(() => import("./components/HomeScene"), {
  ssr: false,
});

const Hud = dynamic(() => import("@/components/Hud"), { ssr: false });

export default function HomePage() {
  return (
    <div className="min-h-screen w-full">
      <NavButton href="/game">Play Game</NavButton>

      <Suspense fallback={<div className="p-4">Loading Home 3D...</div>}>
        <HomeScene />
      </Suspense>
      {/* UI Overlay Layer */}
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="pointer-events-auto h-full w-full">
          <div className="absolute left-1/2 -translate-x-1/2">
            <Hud />
          </div>
        </div>
      </div>
    </div>
  );
}