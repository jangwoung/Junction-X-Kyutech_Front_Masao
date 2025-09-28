"use client";

import { useCallback, useMemo, useState, useRef } from "react";

type RealtimeVideoResponse = {
  video_id: string;
  satellite_id: string;
  satellite_name: string;
  location: { latitude: number; longitude: number; zoom: number };
  video_data: {
    video_url: string;
    thumbnail_url: string;
    stream_url: string;
    format: string;
    codec: string;
    bitrate: string;
    frame_rate: number;
    duration: number;
    size: { width: number; height: number };
  };
  capture_time: string;
  resolution: number;
  quality: {
    overall_quality: number;
    cloud_coverage: number;
    atmospheric_clarity: number;
    sun_angle: number;
    signal_strength: number;
    viewing_angle: number;
  };
  next_update: string;
  status: string;
};

export default function CameraPage() {
  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
    []
  );

  const [latitude, setLatitude] = useState<string>("35.6812");
  const [longitude, setLongitude] = useState<string>("139.7671");
  const [zoom, setZoom] = useState<string>("10");
  const [requiredResolution, setRequiredResolution] = useState<string>("");
  const [preferSatellite, setPreferSatellite] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RealtimeVideoResponse | null>(null);

  // JAXA Earth API 画像取得用
  const [jaxaLoading, setJaxaLoading] = useState(false);
  const [jaxaError, setJaxaError] = useState<string | null>(null);
  const [jaxaImageUrl, setJaxaImageUrl] = useState<string | null>(null);
  const jaxaCanvasHostRef = useRef<HTMLDivElement | null>(null);
  const [jaxaUsedCoords, setJaxaUsedCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const validate = useCallback(() => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const zm = Number(zoom);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      return "Latitude must be a number between -90 and 90";
    }
    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      return "Longitude must be a number between -180 and 180";
    }
    if (!Number.isNaN(zm) && (zm < 1 || zm > 20)) {
      return "Zoom must be a number between 1 and 20";
    }
    if (requiredResolution !== "") {
      const rr = Number(requiredResolution);
      if (Number.isNaN(rr) || rr <= 0) {
        return "Required resolution must be a positive number";
      }
    }
    return null;
  }, [latitude, longitude, zoom, requiredResolution]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setData(null);
      const v = validate();
      if (v) {
        setError(v);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({
          latitude: latitude.trim(),
          longitude: longitude.trim(),
          zoom: zoom.trim() || "10",
        });
        if (requiredResolution.trim() !== "") {
          params.set("required_resolution", requiredResolution.trim());
        }
        if (preferSatellite.trim() !== "") {
          params.set("prefer_satellite", preferSatellite.trim());
        }
        const res = await fetch(
          `${baseUrl}/api/v1/satellite/video/realtime?${params.toString()}`,
          { headers: { "Content-Type": "application/json" } }
        );
        const text = await res.text();
        let json: unknown = text;
        try {
          json = JSON.parse(text);
        } catch {}
        if (!res.ok) {
          throw new Error(
            typeof json === "string" ? json : JSON.stringify(json)
          );
        }
        setData(json as RealtimeVideoResponse);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [
      baseUrl,
      latitude,
      longitude,
      zoom,
      requiredResolution,
      preferSatellite,
      validate,
    ]
  );

  const onFetchJaxa = useCallback(async () => {
    setJaxaError(null);
    setJaxaLoading(true);
    setJaxaImageUrl(null);
    try {
      const lat = Number(latitude);
      const lon = Number(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        throw new Error("Please enter numeric latitude and longitude");
      }
      // UMD版を<script>で読み込み、window.jeを利用
      await new Promise<void>((resolve, reject) => {
        if (typeof window !== "undefined" && (window as any).je)
          return resolve();
        const script = document.createElement("script");
        script.src = "/jaxa.earth.umd.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load JAXA UMD"));
        document.body.appendChild(script);
      });

      const je: any = (window as any).je;
      if (!je || typeof je.getImage !== "function") {
        throw new Error("JAXA API unavailable (je.getImage is undefined)");
      }

      // 周辺 1 度四方を取得（必要に応じて調整）
      const bbox = [lon - 1, lat - 1, lon + 1, lat + 1];
      const image = await je.getImage({
        collection:
          "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.EORC_ALOS.PRISM_AW3D30.v3.2_global/collection.json",
        band: "DSM",
        bbox,
        width: 800,
        height: 800,
        colorMap: { min: 0, max: 6000, colors: "jet" },
      });

      // CanvasをDataURLに変換して表示（SSR影響回避のためDOM追加はオプション）
      const canvas: HTMLCanvasElement = image.getCanvas();
      if (jaxaCanvasHostRef.current) {
        jaxaCanvasHostRef.current.innerHTML = "";
        jaxaCanvasHostRef.current.appendChild(canvas);
      }
      const url = canvas.toDataURL("image/png");
      setJaxaImageUrl(url);
      setJaxaUsedCoords({ lat, lon });
    } catch (e: unknown) {
      setJaxaError(e instanceof Error ? e.message : String(e));
    } finally {
      setJaxaLoading(false);
    }
  }, [latitude, longitude]);

  const onFetchJaxaRandom = useCallback(async () => {
    setJaxaError(null);
    setJaxaLoading(true);
    setJaxaImageUrl(null);
    try {
      // 海洋を避けやすいように、大陸の代表的なバウンディングボックスから選択
      const landBoxes = [
        { name: "Eurasia", latMin: 0, latMax: 70, lonMin: -10, lonMax: 180 },
        {
          name: "NorthAmerica",
          latMin: 15,
          latMax: 72,
          lonMin: -168,
          lonMax: -52,
        },
        {
          name: "SouthAmerica",
          latMin: -55,
          latMax: 12,
          lonMin: -82,
          lonMax: -34,
        },
        { name: "Africa", latMin: -35, latMax: 37, lonMin: -18, lonMax: 51 },
        {
          name: "Australia",
          latMin: -44,
          latMax: -10,
          lonMin: 112,
          lonMax: 154,
        },
        { name: "Japan", latMin: 24, latMax: 46, lonMin: 122, lonMax: 146 },
      ];
      const box = landBoxes[Math.floor(Math.random() * landBoxes.length)];
      const lat = box.latMin + Math.random() * (box.latMax - box.latMin);
      const lon = box.lonMin + Math.random() * (box.lonMax - box.lonMin);

      await new Promise<void>((resolve, reject) => {
        if (typeof window !== "undefined" && (window as any).je)
          return resolve();
        const script = document.createElement("script");
        script.src = "/jaxa.earth.umd.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load JAXA UMD"));
        document.body.appendChild(script);
      });

      const je: any = (window as any).je;
      if (!je || typeof je.getImage !== "function") {
        throw new Error("JAXA API unavailable (je.getImage is undefined)");
      }

      const bbox = [lon - 1, lat - 1, lon + 1, lat + 1];
      const image = await je.getImage({
        collection:
          "https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/JAXA.EORC_ALOS.PRISM_AW3D30.v3.2_global/collection.json",
        band: "DSM",
        bbox,
        width: 800,
        height: 800,
        colorMap: { min: 0, max: 6000, colors: "jet" },
      });

      const canvas: HTMLCanvasElement = image.getCanvas();
      if (jaxaCanvasHostRef.current) {
        jaxaCanvasHostRef.current.innerHTML = "";
        jaxaCanvasHostRef.current.appendChild(canvas);
      }
      const url = canvas.toDataURL("image/png");
      setJaxaImageUrl(url);
      setJaxaUsedCoords({ lat, lon });
    } catch (e: unknown) {
      setJaxaError(e instanceof Error ? e.message : String(e));
    } finally {
      setJaxaLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="max-w-5xl mx-auto p-4 border-2 border-white rounded-2xl bg-black">
        <h1 className="text-2xl font-bold mb-4">Satellite Camera</h1>
        <form
          onSubmit={onSubmit}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Latitude (-90 to 90)</span>
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="px-3 py-2 rounded bg-black border border-white/30 focus:border-white placeholder:text-gray-500"
              placeholder="35.6812"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">
              Longitude (-180 to 180)
            </span>
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="px-3 py-2 rounded bg-black border border-white/30 focus:border-white placeholder:text-gray-500"
              placeholder="139.7671"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Zoom (1 to 20)</span>
            <input
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              className="px-3 py-2 rounded bg-black border border-white/30 focus:border-white placeholder:text-gray-500"
              placeholder="10"
              inputMode="numeric"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">
              Required resolution (m/px, optional)
            </span>
            <input
              value={requiredResolution}
              onChange={(e) => setRequiredResolution(e.target.value)}
              className="px-3 py-2 rounded bg-black border border-white/30 focus:border-white placeholder:text-gray-500"
              placeholder="250"
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">
              Preferred Satellite ID (optional)
            </span>
            <input
              value={preferSatellite}
              onChange={(e) => setPreferSatellite(e.target.value)}
              className="px-3 py-2 rounded bg-black border border-white/30 focus:border-white placeholder:text-gray-500"
              placeholder="e.g., himawari8 / terra"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded border border-white text-white bg-transparent hover:bg-white/10 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Capture/Fetch"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded border border-red-800 bg-red-900/30 p-3 text-red-200">
            {error}
          </div>
        )}

        {data && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="rounded border border-white/20 bg-black p-4">
                <div className="text-sm text-gray-400 mb-2">Thumbnail</div>
                <img
                  src={`${baseUrl}${data.video_data.thumbnail_url}`}
                  alt="thumbnail"
                  className="w-full h-auto rounded border border-white/20"
                />
              </div>
              <div className="rounded border border-white/20 bg-black p-4">
                <div className="text-sm text-gray-400 mb-2">Video</div>
                <video
                  controls
                  className="w-full rounded border border-white/20"
                  src={`${baseUrl}${data.video_data.video_url}`}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded border border-white/20 bg-black p-4">
                <h2 className="font-semibold mb-2">Capture Info</h2>
                <div className="text-sm grid grid-cols-2 gap-1 text-gray-300">
                  <div>Satellite</div>
                  <div>
                    {data.satellite_name} ({data.satellite_id})
                  </div>
                  <div>Time</div>
                  <div>{new Date(data.capture_time).toLocaleString()}</div>
                  <div>Resolution</div>
                  <div>{data.resolution} m</div>
                  <div>Location</div>
                  <div>
                    {data.location.latitude.toFixed(4)},{" "}
                    {data.location.longitude.toFixed(4)} (z{data.location.zoom})
                  </div>
                </div>
              </div>
              <div className="rounded border border-white/20 bg-black p-4">
                <h2 className="font-semibold mb-2">Quality Metrics</h2>
                <div className="text-sm grid grid-cols-2 gap-1 text-gray-300">
                  <div>Overall</div>
                  <div>{(data.quality.overall_quality * 100).toFixed(0)}%</div>
                  <div>Cloud Coverage</div>
                  <div>{(data.quality.cloud_coverage * 100).toFixed(0)}%</div>
                  <div>Atmospheric Clarity</div>
                  <div>
                    {(data.quality.atmospheric_clarity * 100).toFixed(0)}%
                  </div>
                  <div>Sun Angle</div>
                  <div>{(data.quality.sun_angle * 100).toFixed(0)}%</div>
                  <div>Signal Strength</div>
                  <div>{(data.quality.signal_strength * 100).toFixed(0)}%</div>
                  <div>Viewing Angle</div>
                  <div>{(data.quality.viewing_angle * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JAXA Earth API image section */}
        <div className="mt-8 rounded border border-white/30 bg-black p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="font-semibold">JAXA Earth API Image</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onFetchJaxa}
                disabled={jaxaLoading}
                className="px-3 py-2 rounded border border-white text-white bg-transparent hover:bg-white/10 disabled:opacity-60"
              >
                {jaxaLoading ? "Loading..." : "Fetch from JAXA"}
              </button>
              <button
                type="button"
                onClick={onFetchJaxaRandom}
                disabled={jaxaLoading}
                className="px-3 py-2 rounded border border-white text-white bg-transparent hover:bg-white/10 disabled:opacity-60"
              >
                {jaxaLoading ? "Loading..." : "Fetch Random"}
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-2">
            Fetch a 1-degree square image around the given latitude/longitude,
            or use a random coordinate.
          </div>
          {jaxaUsedCoords && (
            <div className="text-xs text-gray-400 mb-2">
              Coordinates used: {jaxaUsedCoords.lat.toFixed(4)},{" "}
              {jaxaUsedCoords.lon.toFixed(4)}
            </div>
          )}
          {jaxaError && (
            <div className="mb-3 rounded border border-red-800 bg-red-900/30 p-3 text-red-200">
              {jaxaError}
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded border border-white/20 p-3">
              <div className="text-sm text-gray-400 mb-2">Canvas View</div>
              <div
                ref={jaxaCanvasHostRef}
                className="w-full overflow-auto"
              ></div>
            </div>
            <div className="rounded border border-white/20 p-3">
              <div className="text-sm text-gray-400 mb-2">Image Preview</div>
              {jaxaImageUrl ? (
                <img
                  src={jaxaImageUrl}
                  alt="JAXA preview"
                  className="w-full h-auto rounded border border-white/20"
                />
              ) : (
                <div className="text-gray-500 text-sm">Not fetched</div>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-3">
            Powered by: JAXA Earth API for JavaScript (docs:
            https://data.earth.jaxa.jp/api/javascript/v1.2.3/docs/)
          </div>
        </div>
      </div>
    </div>
  );
}
