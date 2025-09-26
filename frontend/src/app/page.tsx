"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <Suspense fallback={<div className="p-4">Loading 3D...</div>}>
        <Scene />
      </Suspense>
    </div>
  );
}
