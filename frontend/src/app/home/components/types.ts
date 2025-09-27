export type Vector3 = { x: number; y: number; z: number };

export type DebrisThreat = {
  id: string;
  norad_id?: string;
  name: string;
  position: Vector3; // km (ECI座標系)
  velocity: Vector3; // km/s (ECI座標系)
  size?: number; // メートル
  mass?: number; // kg
  danger_level: number; // 1-10 (バックエンドでは1-10)
  time_to_closest?: number; // 最接近時間 (ミリ秒)
  closest_distance?: number; // 最接近距離 (km)
  collision_probability?: number; // 衝突確率 (0-1)
  detected_at?: string; // 検出時刻
  _index?: number; // 内部使用のインデックス
};

export type DebrisAppearance = {
  color: string;
  size: number;
  emissiveIntensity: number;
  massMultiplier: number;
};
