"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const HomeScene = dynamic(() => import("./components/HomeScene"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <div className="min-h-screen w-full">
      <Suspense fallback={<div className="p-4">Loading Home 3D...</div>}>
        <HomeScene />
      </Suspense>
    </div>
  );
}
