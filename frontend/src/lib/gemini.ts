// src/lib/api.ts
const API_BASE_URL = "http://localhost:8080/api/v1";

export interface DisasterEvent {
  type: string;
  location: string;
  severity: string;
  magnitude?: number;
}

export interface Mission {
  id: string;
  call_sign: string;
  disaster: DisasterEvent;
  status: string;
  priority: string;
  chat_history: ChatMessage[];
  operator_info: {
    name: string;
    rank: string;
    station: string;
    shift: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  message_type: string;
  urgent: boolean;
}

// ミッション一覧取得
export async function getMissions(): Promise<Mission[]> {
  const response = await fetch(`${API_BASE_URL}/missions`);
  const data = await response.json();
  return data.missions || [];
}

// ミッション作成
export async function createMission(disasterEvent: DisasterEvent): Promise<Mission> {
  const response = await fetch(`${API_BASE_URL}/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(disasterEvent),
  });
  return response.json();
}

// ミッション詳細取得
export async function getMission(missionId: string): Promise<Mission> {
  const response = await fetch(`${API_BASE_URL}/missions/${missionId}`);
  return response.json();
}

// Ground Controlにメッセージ送信
export async function sendMessage(missionId: string, message: string): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE_URL}/missions/${missionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return response.json();
}