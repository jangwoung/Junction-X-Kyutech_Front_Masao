import { z } from "zod";

// 基本型
export const UUID = z.string().uuid();
export const ISODateString = z.string().datetime();

// 衛星
export const SatelliteSchema = z.object({
  id: UUID,
  name: z.string().min(1),
  tleLine1: z.string().min(1),
  tleLine2: z.string().min(1),
});
export type Satellite = z.infer<typeof SatelliteSchema>;

// 地上局
export const GroundStationSchema = z.object({
  id: UUID,
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  elevationM: z.number().min(-430).max(9000),
});
export type GroundStation = z.infer<typeof GroundStationSchema>;

// プレイヤー
export const PlayerSchema = z.object({
  id: UUID,
  name: z.string().min(1),
  assignedSatelliteId: UUID.optional(),
});
export type Player = z.infer<typeof PlayerSchema>;

// ミッション
export const MissionTaskTypeSchema = z.enum([
  "downlink_data",
  "change_attitude",
  "establish_contact",
]);
export type MissionTaskType = z.infer<typeof MissionTaskTypeSchema>;

export const MissionSchema = z.object({
  id: UUID,
  title: z.string().min(1),
  taskType: MissionTaskTypeSchema,
  description: z.string().min(1),
  points: z.number().int().min(1),
  expiresAt: ISODateString.optional(),
  completed: z.boolean().default(false),
});
export type Mission = z.infer<typeof MissionSchema>;

// ゲーム状態
export const GameStateSchema = z.object({
  players: z.array(PlayerSchema),
  satellites: z.array(SatelliteSchema),
  groundStations: z.array(GroundStationSchema),
  missions: z.array(MissionSchema),
  scoreByPlayerId: z.record(UUID, z.number().int().nonnegative()),
});
export type GameState = z.infer<typeof GameStateSchema>;

// ユーティリティ: 型安全なパース
export function parseWith<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown
): z.infer<TSchema> {
  return schema.parse(data);
}
