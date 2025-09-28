"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";

const HomeScene = dynamic(() => import("./components/HomeScene"), {
  ssr: false,
});

const Hud = dynamic(() => import("@/components/Hud"), { ssr: false });

export default function HomePage() {
  const [showHud, setShowHud] = useState(false);
  return (
    <div className="min-h-screen w-full">
      <Suspense fallback={<div className="p-4">Loading Home 3D...</div>}>
        {!showHud && <HomeScene />}
      </Suspense>
      {/* UI Overlay Layer */}
      <button
        type="button"
        onClick={() => setShowHud((v) => !v)}
        className="fixed z-20 bottom-4 right-4 border border-white-500/30 rounded text-white blackblur px-3 py-1 shadow pointer-events-auto"
        aria-pressed={showHud}
        aria-label="Chat"
      >
        {showHud ? "Disconnect" : "Connect"}
      </button>
      {showHud && (
        <div className="pointer-events-none fixed inset-0 z-10">
          <div className="pointer-events-auto h-full w-full">
            <div className="absolute left-1/2 -translate-x-1/2">
              <Hud />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
