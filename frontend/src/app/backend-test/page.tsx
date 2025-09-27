"use client";

import { useCallback, useMemo, useState } from "react";

type JsonValue = unknown;

export default function BackendTestPage() {
  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
    []
  );

  const [satelliteId, setSatelliteId] = useState("himawari8");
  const [maneuverPlayerId, setManeuverPlayerId] = useState("player_001");
  const [thrustX, setThrustX] = useState(0.0);
  const [thrustY, setThrustY] = useState(1.0);
  const [thrustZ, setThrustZ] = useState(0.0);
  const [duration, setDuration] = useState(10);
  const [missionId, setMissionId] = useState("demo_mission");

  const [result, setResult] = useState<JsonValue>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (path: string, init?: RequestInit) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
          },
        });
        const text = await res.text();
        let data: JsonValue = text;
        try {
          data = JSON.parse(text);
        } catch {
          // keep raw text
        }
        if (!res.ok) {
          throw new Error(
            typeof data === "string" ? data : JSON.stringify(data)
          );
        }
        setResult(data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  return (
    <div className="min-h-screen w-full p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">バックエンド動作確認</h1>
        <p className="text-sm text-gray-600">Base URL: {baseUrl}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">基本</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={() => request("/health")}
            disabled={loading}
          >
            GET /health
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">衛星 API</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-gray-600">satelliteId</span>
            <input
              className="border rounded px-2 py-1"
              value={satelliteId}
              onChange={(e) => setSatelliteId(e.target.value)}
            />
          </label>

          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={() =>
              request(
                `/api/v1/satellite/${encodeURIComponent(satelliteId)}/orbit`
              )
            }
            disabled={loading}
          >
            GET /api/v1/satellite/:id/orbit
          </button>

          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={() =>
              request(
                `/api/v1/satellite/${encodeURIComponent(satelliteId)}/status`
              )
            }
            disabled={loading}
          >
            GET /api/v1/satellite/:id/status
          </button>

          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={() => request(`/api/v1/satellite/available`)}
            disabled={loading}
          >
            GET /api/v1/satellite/available
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-gray-600">player_id</span>
            <input
              className="border rounded px-2 py-1"
              value={maneuverPlayerId}
              onChange={(e) => setManeuverPlayerId(e.target.value)}
            />
          </label>
          <div className="flex items-end gap-2">
            <label className="text-sm">
              <span className="block text-gray-600">thrust.x</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-28"
                value={thrustX}
                onChange={(e) => setThrustX(parseFloat(e.target.value))}
              />
            </label>
            <label className="text-sm">
              <span className="block text-gray-600">thrust.y</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-28"
                value={thrustY}
                onChange={(e) => setThrustY(parseFloat(e.target.value))}
              />
            </label>
            <label className="text-sm">
              <span className="block text-gray-600">thrust.z</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-28"
                value={thrustZ}
                onChange={(e) => setThrustZ(parseFloat(e.target.value))}
              />
            </label>
            <label className="text-sm">
              <span className="block text-gray-600">duration (s)</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-28"
                value={duration}
                onChange={(e) =>
                  setDuration(parseInt(e.target.value || "0", 10))
                }
              />
            </label>
          </div>
          <button
            className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
            onClick={() =>
              request(
                `/api/v1/satellite/${encodeURIComponent(satelliteId)}/maneuver`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    player_id: maneuverPlayerId,
                    thrust_vector: { x: thrustX, y: thrustY, z: thrustZ },
                    duration,
                  }),
                }
              )
            }
            disabled={loading}
          >
            POST /api/v1/satellite/:id/maneuver
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">ミッション/デブリ</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-gray-600">missionId</span>
            <input
              className="border rounded px-2 py-1"
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
            />
          </label>
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={() =>
              request(
                `/api/v1/mission/debris/${encodeURIComponent(
                  missionId
                )}/threats`
              )
            }
            disabled={loading}
          >
            GET /api/v1/mission/debris/:id/threats
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">結果</h2>
        {loading ? (
          <div className="text-black">Loading...</div>
        ) : error ? (
          <pre className="whitespace-pre-wrap break-words p-3 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </pre>
        ) : result ? (
          <pre className="whitespace-pre-wrap break-words text-black p-3 bg-gray-50 border rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : (
          <div className="text-black">実行結果がここに表示されます。</div>
        )}
      </section>
    </div>
  );
}
