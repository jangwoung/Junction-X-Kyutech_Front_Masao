"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
};

type Props = {
  className?: string;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default function GroundStationChat({
  className,
  title = "Ground Station",
  placeholder = "Type a message...",
  disabled = false,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isSending && !disabled,
    [input, isSending, disabled]
  );

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const mockAiReply = useCallback(
    async (userText: string) => {
      // 擬似的な応答待ち
      await new Promise((r) => setTimeout(r, 600));
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: `Roger. Received: "${userText}"`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      scrollToBottom();
    },
    [scrollToBottom]
  );

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();
    setIsSending(true);
    try {
      await mockAiReply(text);
    } finally {
      setIsSending(false);
    }
  }, [canSend, input, mockAiReply, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div
      className={`flex flex-col rounded-xl text-white backdrop-blur p-3 w-[33svw] h-[80svh] overflow-hidden ${
        className ?? ""
      }`}
    >
      <div className="flex items-center justify-between pb-2">
        <div className="text-sm font-medium text-gray-200">{title}</div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400">
          In-Link
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <div className="text-xs text-gray-400">
            Ground station link established. You can start chatting.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex">
              <div
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%] px-1 text-sm"
                    : "mr-auto max-w-[80%] px-1 text-sm text-orange-300"
                }
              >
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {m.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-end gap-2 shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={placeholder}
          disabled={disabled}
          className="h-8 flex-1 resize-none border-b border-white/20 px-2 py-1 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-b-white"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="h-8 whitespace-nowrap px-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:text-gray-500"
          title={isSending ? "..." : "Send"}
        >
          {isSending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
