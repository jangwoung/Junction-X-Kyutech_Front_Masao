"use client";

import React from "react";
import { Html } from "@react-three/drei";

// A loader component to show while textures are loading
export function Loader() {
  return (
    <Html center>
      <div style={{ color: "white" }}>Loading textures...</div>
    </Html>
  );
}
