"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <div className="p-4">
        <a
          href="/backend-test"
          className="inline-block rounded bg-indigo-600 px-3 py-2 text-white"
        >
          バックエンド動作確認ページへ
        </a>
      </div>
      <Suspense fallback={<div className="p-4">Loading 3D...</div>}>
        <Scene />
      </Suspense>
    </div>
  );
}
