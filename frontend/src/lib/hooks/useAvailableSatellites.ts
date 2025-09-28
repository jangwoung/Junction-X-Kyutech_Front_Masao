import { useQuery } from "@tanstack/react-query";

interface Satellite {
  id: string;
  name: string;
  type: string;
  resolution: number;
  update_interval: string;
  coverage: string;
  status: string;
  capabilities: string[];
}

interface AvailableSatellitesResponse {
  satellites: Satellite[];
  total: number;
  message: string;
}

function getBaseUrl() {
  if (typeof window === "undefined")
    return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  return (
    (process.env.NEXT_PUBLIC_BACKEND_URL as string) || "http://localhost:8080"
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function useAvailableSatellites() {
  function getMockAvailable(): AvailableSatellitesResponse {
    const satellites: Satellite[] = [
      {
        id: "himawari8",
        name: "Himawari-8",
        type: "Geostationary Weather",
        resolution: 1000.0,
        update_interval: "10m",
        coverage: "Asia-Pacific",
        status: "active",
        capabilities: ["visible", "infrared", "water_vapor", "realtime"],
      },
      {
        id: "goes16",
        name: "GOES-16",
        type: "Geostationary Weather",
        resolution: 500.0,
        update_interval: "15m",
        coverage: "Americas",
        status: "active",
        capabilities: ["visible", "infrared", "lightning", "realtime"],
      },
      {
        id: "terra",
        name: "Terra",
        type: "Earth Observation",
        resolution: 250.0,
        update_interval: "1h",
        coverage: "Global",
        status: "active",
        capabilities: ["visible", "infrared", "thermal", "multispectral"],
      },
      {
        id: "landsat8",
        name: "Landsat 8",
        type: "Earth Observation",
        resolution: 30.0,
        update_interval: "24h",
        coverage: "Global",
        status: "active",
        capabilities: ["visible", "infrared", "thermal", "high_resolution"],
      },
      {
        id: "worldview3",
        name: "WorldView-3",
        type: "Commercial High-Resolution",
        resolution: 0.31,
        update_interval: "48h",
        coverage: "On-demand",
        status: "active",
        capabilities: ["visible", "infrared", "ultra_high_resolution"],
      },
    ];
    return {
      satellites,
      total: satellites.length,
      message: "mock",
    };
  }

  const { data, isLoading, isError, error } =
    useQuery<AvailableSatellitesResponse>({
      queryKey: ["availableSatellites"],
      queryFn: async () => {
        const useMockOnly =
          process.env.NEXT_PUBLIC_SATELLITES_USE_MOCK === "true";
        if (useMockOnly) return getMockAvailable();
        try {
          return await fetchJson<AvailableSatellitesResponse>(
            "/api/v1/satellite/available"
          );
        } catch (err: unknown) {
          // 404 やネットワークエラー時はモックへフォールバック
          return getMockAvailable();
        }
      },
      staleTime: 60 * 1000, // 1分間キャッシュ
    });

  return {
    satellites: data?.satellites || [],
    isLoading,
    isError,
    error,
  };
}
