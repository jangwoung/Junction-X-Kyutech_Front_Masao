import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GameState, Player, Mission, Satellite } from "@/lib/schemas";

type GameActions = {
  assignSatellite: (playerId: string, satelliteId: string) => void;
  completeMission: (missionId: string, playerId: string) => void;
  addScore: (playerId: string, points: number) => void;
  hydrate: (state: GameState) => void;
  reset: () => void;
  setSatellites: (satellites: Satellite[]) => void;
  setSelectedSatelliteId: (satelliteId: string | undefined) => void;
};

type SelectedSatelliteState = { selectedSatelliteId?: string };
export type GameStore = GameState & SelectedSatelliteState & GameActions;

const initialState: GameState & { selectedSatelliteId?: string } = {
  players: [],
  satellites: [],
  groundStations: [],
  missions: [],
  scoreByPlayerId: {},
};

export const useGameStore = create<GameStore>()(
  devtools((set) => ({
    ...initialState,
    selectedSatelliteId: undefined,
    setSatellites: (satellites) => set(() => ({ satellites })),
    setSelectedSatelliteId: (satelliteId) =>
      set(() => ({ selectedSatelliteId: satelliteId })),
    assignSatellite: (playerId, satelliteId) => {
      set((state) => ({
        players: state.players.map((p: Player) =>
          p.id === playerId ? { ...p, assignedSatelliteId: satelliteId } : p
        ),
      }));
    },
    completeMission: (missionId, playerId) => {
      set((state) => {
        const mission = state.missions.find((m: Mission) => m.id === missionId);
        const points = mission?.points ?? 0;
        return {
          missions: state.missions.map((m) =>
            m.id === missionId ? { ...m, completed: true } : m
          ),
          scoreByPlayerId: {
            ...state.scoreByPlayerId,
            [playerId]: (state.scoreByPlayerId[playerId] ?? 0) + points,
          },
        };
      });
    },
    addScore: (playerId, points) => {
      set((state) => ({
        scoreByPlayerId: {
          ...state.scoreByPlayerId,
          [playerId]: (state.scoreByPlayerId[playerId] ?? 0) + points,
        },
      }));
    },
    hydrate: (state) => set(() => ({ ...state })),
    reset: () => set(() => ({ ...initialState })),
  }))
);
