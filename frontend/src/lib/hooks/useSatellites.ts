"use client";

import { useQuery } from "@tanstack/react-query";
import { parseWith, SatelliteSchema } from "@/lib/schemas";

async function fetchSatellites() {
  const res = await fetch("/api/satellites", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch satellites");
  const data = await res.json();
  return parseWith(SatelliteSchema.array(), data);
}

export function useSatellites() {
  return useQuery({
    queryKey: ["satellites"],
    queryFn: fetchSatellites,
    staleTime: 30_000,
  });
}
