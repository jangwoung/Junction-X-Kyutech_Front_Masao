// src/components/GroundStationChat.tsx
"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { sendMessage, createMission, type Mission, type ChatMessage } from "../lib/gemini";

type Props = {
  className?: string;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
  missionId?: string;
};

export default function GroundStationChat({
  className,
  title = "Ground Control",
  placeholder = "Send message to Ground Control...",
  disabled = false,
  missionId: initialMissionId,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [missionId, setMissionId] = useState<string | null>(initialMissionId || null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isSending && !disabled && missionId,
    [input, isSending, disabled, missionId]
  );

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  // ミッション作成
  const createNewMission = useCallback(async () => {
    try {
      const newMission = await createMission({
        type: "earthquake",
        location: "Tokyo, Japan",
        severity: "high",
        magnitude: 7.2,
      });
      setMission(newMission);
      setMissionId(newMission.id);
      setMessages(newMission.chat_history || []);
    } catch (error) {
      console.error("Failed to create mission:", error);
    }
  }, []);

  // Ground Controlに実際のメッセージ送信
  const sendToGroundControl = useCallback(
    async (userText: string) => {
      if (!missionId) return;

      try {
        const response = await sendMessage(missionId, userText);
        setMessages(prev => [...prev, response]);
        scrollToBottom();
      } catch (error) {
        console.error("Failed to send message:", error);
        // エラー時のフォールバック
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Ground Control: Communication system error. Please repeat your transmission. Over.",
          timestamp: new Date().toISOString(),
          message_type: "error",
          urgent: false,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    },
    [missionId, scrollToBottom]
  );

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    
    // ユーザーメッセージを追加
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      message_type: "field_report",
      urgent: false,
    };
    
    setMessages(prev => [...prev, userMsg]);
    scrollToBottom();
    setIsSending(true);
    
    try {
      await sendToGroundControl(text);
    } finally {
      setIsSending(false);
    }
  }, [canSend, input, sendToGroundControl, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ミッションがない場合は自動作成
  useEffect(() => {
    if (!missionId) {
      createNewMission();
    }
  }, [missionId, createNewMission]);

  return (
    <div
      className={`flex flex-col rounded-xl text-white backdrop-blur p-3 w-[66svw] h-[80svh] overflow-hidden ${
        className ?? ""
      }`}
    >
      <div className="flex items-center justify-between pb-2">
        <div className="text-sm font-medium text-gray-200">{title}</div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400">
          {mission ? `${mission.call_sign} - ${mission.priority}` : "Establishing Link..."}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <div className="text-xs text-gray-400">
            {mission 
              ? "Ground Control standing by. Transmit when ready. Over."
              : "Establishing mission link..."
            }
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex">
              <div
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%] px-2 py-1 text-sm bg-blue-600/20 rounded-lg"
                    : "mr-auto max-w-[80%] px-2 py-1 text-sm text-orange-300 bg-orange-900/20 rounded-lg"
                }
              >
                <div className="text-[10px] uppercase tracking-wider mb-1 opacity-60">
                  {m.role === "user" ? "Field Team" : "Ground Control"}
                  {m.urgent && " [URGENT]"}
                </div>
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {m.content}
                </div>
                <div className="text-[9px] opacity-40 mt-1">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isSending && (
          <div className="flex">
            <div className="mr-auto max-w-[80%] px-2 py-1 text-sm text-orange-300 bg-orange-900/20 rounded-lg animate-pulse">
              <div className="text-[10px] uppercase tracking-wider mb-1 opacity-60">
                Ground Control
              </div>
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                Transmitting response...
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2 shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={missionId ? placeholder : "Establishing mission link..."}
          disabled={disabled || !missionId}
          className="h-8 flex-1 resize-none border-b border-white/20 px-2 py-1 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-b-white bg-transparent"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="h-8 whitespace-nowrap px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:text-gray-500 hover:text-orange-300 transition-colors"
          title={isSending ? "Transmitting..." : "Send"}
        >
          {isSending ? "..." : "SEND"}
        </button>
      </div>

      {mission && (
        <div className="mt-2 text-[10px] text-gray-500">
          Mission: {mission.disaster.type} | Location: {mission.disaster.location} | Severity: {mission.disaster.severity}
        </div>
      )}
    </div>
  );
}