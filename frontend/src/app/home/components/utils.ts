import { DebrisThreat } from "./types";

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function hasValidPosition(
  d: Partial<DebrisThreat> | undefined | null
): d is DebrisThreat {
  return !!(
    d &&
    d.position &&
    typeof d.position === 'object' &&
    d.position !== null &&
    'x' in d.position &&
    'y' in d.position &&
    'z' in d.position &&
    isFiniteNumber(d.position.x) &&
    isFiniteNumber(d.position.y) &&
    isFiniteNumber(d.position.z)
  );
}

// モックデブリデータ生成関数
export function generateMockDebrisData(): DebrisThreat[] {
  const mockDebris: DebrisThreat[] = [];
  const earthRadius = 6371; // km

  for (let i = 0; i < 8; i++) {
    // 地球周辺の軌道にランダムに配置
    const altitude = 400 + Math.random() * 600; // 400-1000km高度
    const angle = (i / 8) * Math.PI * 2;
    const radius = earthRadius + altitude;

    const x = Math.cos(angle) * radius;
    const y = (Math.random() - 0.5) * 200; // ±100kmの高さ変動
    const z = Math.sin(angle) * radius;

    // 軌道速度（km/s）
    const orbitalSpeed = Math.sqrt(398600 / radius); // 軌道速度の簡易計算
    const vx = -Math.sin(angle) * orbitalSpeed;
    const vy = (Math.random() - 0.5) * 0.5;
    const vz = Math.cos(angle) * orbitalSpeed;

    mockDebris.push({
      id: `mock-debris-${i}`,
      norad_id: `NORAD-${10000 + i}`,
      name: `デブリ ${i + 1}`,
      position: { x, y, z },
      velocity: { x: vx, y: vy, z: vz },
      size: Math.random() * 5 + 0.5, // 0.5-5.5m
      mass: Math.random() * 1000 + 100, // 100-1100kg
      danger_level: Math.floor(Math.random() * 10) + 1, // 1-10
      time_to_closest: Math.random() * 7200000, // 0-2時間（ミリ秒）
      closest_distance: Math.random() * 50 + 1, // 1-51km
      collision_probability: Math.random() * 0.8, // 0-0.8
      detected_at: new Date().toISOString(),
    });
  }

  return mockDebris;
}
