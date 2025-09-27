"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

type Vector3 = { x: number; y: number; z: number };

type OrbitResponse = {
  satellite_id: string;
  timestamp: string | number | Date;
  position?: Vector3;
  velocity?: Vector3;
  altitude?: number; // km
  orbital_speed?: number; // km/s
};

type StatusState = {
  position?: Vector3;
  velocity?: Vector3;
  attitude?: { roll?: number; pitch?: number; yaw?: number };
  fuel?: number;
  power?: number; // percent
  health?: string;
  last_update?: string;
};

type StatusResponse = {
  satellite_id: string;
  status: StatusState;
};

type CoverageResponse = {
  satellite_id: string;
  coverage_area?: unknown;
  current_position?: {
    latitude?: number;
    longitude?: number;
    altitude_km?: number;
  };
  next_pass?: string;
  visibility?: string; // e.g. "excellent", "good"
};

function getBaseUrl() {
  if (typeof window === "undefined")
    return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  return (
    (process.env.NEXT_PUBLIC_BACKEND_URL as string) || "http://localhost:8080"
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function useSatellitePanelData(satelliteId?: string) {
  const enabled = !!satelliteId;

  const {
    data: orbit,
    isLoading: orbitLoading,
    isError: orbitError,
    error: orbitErr,
  } = useQuery<OrbitResponse>({
    queryKey: ["satellite", satelliteId, "orbit"],
    queryFn: () =>
      fetchJson(
        `/api/v1/satellite/${encodeURIComponent(satelliteId as string)}/orbit`
      ),
    enabled,
    staleTime: 10_000,
  });

  const {
    data: status,
    isLoading: statusLoading,
    isError: statusError,
    error: statusErr,
  } = useQuery<StatusResponse>({
    queryKey: ["satellite", satelliteId, "status"],
    queryFn: () =>
      fetchJson(
        `/api/v1/satellite/${encodeURIComponent(satelliteId as string)}/status`
      ),
    enabled,
    staleTime: 5_000,
  });

  const {
    data: coverage,
    isLoading: coverageLoading,
    isError: coverageError,
    error: coverageErr,
  } = useQuery<CoverageResponse>({
    queryKey: ["satellite", satelliteId, "coverage"],
    queryFn: () =>
      fetchJson(
        `/api/v1/satellite/${encodeURIComponent(
          satelliteId as string
        )}/coverage`
      ),
    enabled,
    staleTime: 30_000,
  });

  const derived = useMemo(() => {
    const altitudeKm =
      orbit?.altitude ?? coverage?.current_position?.altitude_km;
    const attitude = status?.status?.attitude;
    const power = status?.status?.power;
    const visibility = coverage?.visibility;
    const nextPass = coverage?.next_pass;
    const orbitalSpeed = orbit?.orbital_speed;
    return { altitudeKm, attitude, power, visibility, nextPass, orbitalSpeed };
  }, [orbit, status, coverage]);

  const isLoading =
    enabled && (orbitLoading || statusLoading || coverageLoading);
  const isError = orbitError || statusError || coverageError;
  function getErrorMessage(err: unknown): string | undefined {
    if (err instanceof Error) return err.message;
    return undefined;
  }
  const errorMessage =
    getErrorMessage(orbitErr) ||
    getErrorMessage(statusErr) ||
    getErrorMessage(coverageErr);

  return {
    orbit,
    status,
    coverage,
    ...derived,
    isLoading,
    isError,
    errorMessage,
    errors: { orbit: orbitErr, status: statusErr, coverage: coverageErr },
  };
}
