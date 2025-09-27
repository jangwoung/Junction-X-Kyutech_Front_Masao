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

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function useAvailableSatellites() {
  const { data, isLoading, isError, error } =
    useQuery<AvailableSatellitesResponse>({
      queryKey: ["availableSatellites"],
      queryFn: () => fetchJson("/api/v1/satellite/available"),
      staleTime: 60 * 1000, // 1分間キャッシュ
    });

  return {
    satellites: data?.satellites || [],
    isLoading,
    isError,
    error,
  };
}
