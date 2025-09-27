import { useQuery } from "@tanstack/react-query";
import { OrbitResponse } from "./useSatellitePanelData"; // 既存の型を再利用

interface OrbitData extends OrbitResponse {
  id: string;
}

interface MultipleSatelliteOrbitsResult {
  data: OrbitData[];
  errors: { id: string; error: Error }[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function useMultipleSatelliteOrbits(satelliteIds: string[]) {
  const { data, isLoading, isError, error } =
    useQuery<MultipleSatelliteOrbitsResult>({
      queryKey: ["multipleSatelliteOrbits", satelliteIds],
      queryFn: async () => {
        const promises = satelliteIds.map(async (id) => {
          try {
            const data = await fetchJson<OrbitResponse>(
              `/api/v1/satellite/${encodeURIComponent(id)}/orbit`
            );
            return { id, data, error: null };
          } catch (error: any) {
            return { id, data: null, error };
          }
        });

        const results = await Promise.all(promises);

        // 成功したデータのみを返す
        const successfulData = results
          .filter((result) => result.data !== null)
          .map((result) => ({ id: result.id, ...result.data! }));

        const errors = results
          .filter((result) => result.error !== null)
          .map((result) => ({ id: result.id, error: result.error! }));

        return { data: successfulData, errors };
      },
      enabled: satelliteIds.length > 0,
      staleTime: 10 * 1000, // 10秒間キャッシュ
      refetchInterval: 10 * 1000, // 10秒ごとに更新
    });

  return {
    satelliteOrbits: data?.data || [],
    errors: data?.errors || [],
    isLoading,
    isError,
    error,
  };
}
