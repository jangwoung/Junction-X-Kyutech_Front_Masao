# 衛星操作ゲーム MVP 設計書

## 概要

本設計書は、衛星操作ゲーム MVP の技術的実装方針を定義します。リアルタイムマルチプレイヤー体験を提供するため、フロントエンドでの Three.js 3D 可視化、Go バックエンドでの軌道計算・通信判定、WebSocket による状態同期を中核とするアーキテクチャを採用します。

## アーキテクチャ

### システム全体構成

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Frontend      │◄──────────────►│   Backend       │
│   (Next.js)     │    REST API     │   (Go)          │
│                 │◄──────────────►│                 │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   Three.js      │                 │   MCP Server    │
│   3D Engine     │                 │   (Space Data)  │
└─────────────────┘                 └─────────────────┘
```

### レイヤー構成

1. **プレゼンテーション層** (Next.js + Three.js)

   - ユーザーインターフェース
   - 3D 可視化エンジン
   - リアルタイム状態表示

2. **アプリケーション層** (Go Backend)

   - ゲームロジック
   - 軌道計算エンジン
   - 通信判定システム

3. **データ層** (MCP + In-Memory)
   - 宇宙データ取得
   - ゲーム状態管理
   - セッション情報

## コンポーネントと インターフェース

### フロントエンド コンポーネント

#### 1. GameScene (Three.js)

```typescript
interface GameScene {
  earth: Earth3D;
  satellites: Satellite3D[];
  groundStations: GroundStation3D[];

  updateSatellitePosition(id: string, position: Vector3): void;
  updateSatelliteAttitude(id: string, attitude: Quaternion): void;
  showVisibilityLine(satelliteId: string, stationId: string): void;
}
```

#### 2. AttitudeController

```typescript
interface AttitudeController {
  roll: number; // -180 to 180 degrees
  pitch: number; // -90 to 90 degrees
  yaw: number; // -180 to 180 degrees

  onAttitudeChange: (attitude: Attitude) => void;
}
```

#### 3. MissionCard

```typescript
interface MissionCard {
  id: string;
  title: string;
  description: string;
  targetStation: string;
  reward: number;
  timeLimit?: number;

  checkCompletion(event: CommunicationEvent): boolean;
}
```

#### 4. GameHUD

```typescript
interface GameHUD {
  currentScore: number;
  timeRemaining: number;
  activeMission: MissionCard;
  playerRanking: PlayerScore[];

  updateScore(newScore: number): void;
  showNotification(message: string, type: "success" | "error"): void;
}
```

### バックエンド コンポーネント

#### 1. OrbitCalculator

```go
type OrbitCalculator struct {
    satellites map[string]*SatelliteOrbit
}

func (oc *OrbitCalculator) CalculatePosition(satelliteId string, timestamp time.Time) Position3D
func (oc *OrbitCalculator) CheckVisibility(satelliteId, stationId string, timestamp time.Time) VisibilityResult
func (oc *OrbitCalculator) GetElevationAngle(satellitePos, stationPos Position3D) float64
```

#### 2. CommunicationValidator

```go
type CommunicationValidator struct {
    minElevationAngle float64
    maxRange          float64
}

func (cv *CommunicationValidator) ValidateAttempt(request CommunicationRequest) ValidationResult
func (cv *CommunicationValidator) CheckLineOfSight(satellitePos, stationPos Position3D) bool
```

#### 3. GameSessionManager

```go
type GameSessionManager struct {
    sessions map[string]*GameSession
    players  map[string]*Player
}

func (gsm *GameSessionManager) CreateSession(sessionId string) *GameSession
func (gsm *GameSessionManager) JoinSession(playerId, sessionId string) error
func (gsm *GameSessionManager) BroadcastUpdate(sessionId string, update GameUpdate)
```

#### 4. MissionGenerator

```go
type MissionGenerator struct {
    templates []MissionTemplate
    difficulty DifficultyLevel
}

func (mg *MissionGenerator) GenerateMission(playerId string, currentScore int) Mission
func (mg *MissionGenerator) ValidateCompletion(mission Mission, event CommunicationEvent) bool
```

### WebSocket メッセージ仕様

#### クライアント → サーバー

```typescript
type ClientMessage =
  | { type: "attitude_change"; satelliteId: string; attitude: Attitude }
  | { type: "communication_attempt"; satelliteId: string; stationId: string }
  | { type: "join_session"; playerId: string; sessionId: string };
```

#### サーバー → クライアント

```typescript
type ServerMessage =
  | {
      type: "satellite_update";
      satelliteId: string;
      position: Position3D;
      attitude: Attitude;
    }
  | { type: "communication_result"; success: boolean; message: string }
  | {
      type: "mission_completed";
      playerId: string;
      mission: Mission;
      newScore: number;
    }
  | { type: "score_update"; rankings: PlayerScore[] }
  | { type: "game_end"; finalRankings: PlayerScore[] };
```

## データモデル

### 核心エンティティ

#### Satellite

```typescript
interface Satellite {
  id: string;
  name: string;
  orbit: OrbitalElements;
  attitude: Attitude;
  assignedPlayerId?: string;

  // 軌道要素
  semiMajorAxis: number; // 長半径 (km)
  eccentricity: number; // 離心率
  inclination: number; // 軌道傾斜角 (degrees)
  argumentOfPerigee: number; // 近地点引数 (degrees)
  longitudeOfAscendingNode: number; // 昇交点経度 (degrees)
  meanAnomaly: number; // 平均近点角 (degrees)
}
```

#### GroundStation

```typescript
interface GroundStation {
  id: string;
  name: string;
  location: GeographicCoordinate;
  minElevationAngle: number; // 最小仰角 (degrees)
  maxRange: number; // 最大通信距離 (km)
}
```

#### GameSession

```typescript
interface GameSession {
  id: string;
  players: Player[];
  startTime: Date;
  duration: number; // ゲーム時間 (minutes)
  status: "waiting" | "active" | "completed";
  satellites: Satellite[];
  groundStations: GroundStation[];
}
```

#### Mission

```typescript
interface Mission {
  id: string;
  type: "data_transmission" | "attitude_control" | "multi_station";
  title: string;
  description: string;
  targetStationId: string;
  requirements: MissionRequirement[];
  reward: number;
  timeLimit?: number;
}
```

### 計算モデル

#### 軌道力学計算

```go
// Kepler方程式による位置計算
func CalculateOrbitalPosition(elements OrbitalElements, timestamp time.Time) Position3D {
    // 1. 平均運動の計算
    meanMotion := math.Sqrt(GM / math.Pow(elements.SemiMajorAxis, 3))

    // 2. 平均近点角の更新
    timeFromEpoch := timestamp.Sub(elements.Epoch).Seconds()
    meanAnomaly := elements.MeanAnomaly + meanMotion*timeFromEpoch

    // 3. 離心近点角の解法 (Newton-Raphson法)
    eccentricAnomaly := solveKeplerEquation(meanAnomaly, elements.Eccentricity)

    // 4. 真近点角の計算
    trueAnomaly := calculateTrueAnomaly(eccentricAnomaly, elements.Eccentricity)

    // 5. 軌道座標系での位置計算
    orbitalPosition := calculateOrbitalPosition(elements, trueAnomaly)

    // 6. 地心慣性座標系への変換
    return transformToECI(orbitalPosition, elements)
}
```

#### 可視性判定アルゴリズム

```go
func CheckVisibility(satellitePos, stationPos Position3D, earthRadius float64) VisibilityResult {
    // 1. 距離計算
    distance := calculateDistance(satellitePos, stationPos)

    // 2. 仰角計算
    elevationAngle := calculateElevationAngle(satellitePos, stationPos)

    // 3. 地球による遮蔽チェック
    lineOfSight := checkLineOfSight(satellitePos, stationPos, earthRadius)

    return VisibilityResult{
        Distance:        distance,
        ElevationAngle:  elevationAngle,
        LineOfSight:     lineOfSight,
        IsVisible:       lineOfSight && elevationAngle > minElevationAngle,
    }
}
```

## エラーハンドリング

### フロントエンド エラー処理

1. **WebSocket 接続エラー**

   - 指数バックオフによる自動再接続
   - 接続状態の視覚的表示
   - オフライン時のローカル状態保持

2. **Three.js レンダリングエラー**

   - WebGL 非対応時の 2D フォールバック
   - メモリ不足時のモデル簡略化
   - フレームレート低下時の描画最適化

3. **ユーザー入力エラー**
   - 姿勢制御値の範囲チェック
   - 無効な操作の視覚的フィードバック
   - 操作ガイドの動的表示

### バックエンド エラー処理

1. **軌道計算エラー**

   - 数値計算の収束チェック
   - 異常値の検出と補正
   - 計算タイムアウト処理

2. **通信判定エラー**

   - 座標変換の妥当性チェック
   - 物理的制約の検証
   - エラー時のデフォルト値設定

3. **セッション管理エラー**
   - プレイヤー切断時の状態保持
   - セッション満員時の待機列管理
   - 異常終了時の自動復旧

## テスト戦略

### 単体テスト

1. **軌道計算の精度テスト**

   - 既知の軌道要素による位置検証
   - 数値計算の収束性テスト
   - 境界値での動作確認

2. **通信判定ロジックテスト**

   - 可視性条件の組み合わせテスト
   - 地球遮蔽の正確性検証
   - 仰角計算の精度確認

3. **ゲームロジックテスト**
   - ミッション生成の多様性テスト
   - スコア計算の正確性検証
   - セッション状態遷移テスト

### 統合テスト

1. **WebSocket 通信テスト**

   - メッセージ送受信の整合性
   - 複数クライアント同期テスト
   - 接続断時の復旧テスト

2. **3D 可視化テスト**

   - 軌道表示の正確性検証
   - リアルタイム更新の滑らかさ
   - パフォーマンス負荷テスト

3. **エンドツーエンドテスト**
   - 完全なゲームフロー実行
   - マルチプレイヤーシナリオ
   - エラー回復シナリオ

### パフォーマンステスト

1. **レンダリング性能**

   - 60FPS 維持の確認
   - メモリ使用量の監視
   - 複数衛星表示時の負荷測定

2. **ネットワーク性能**

   - WebSocket メッセージ遅延測定
   - 帯域幅使用量の最適化
   - 同時接続数の限界テスト

3. **計算性能**
   - 軌道計算の実行時間測定
   - 可視性判定の処理速度
   - メモリ使用効率の評価
