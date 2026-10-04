import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export default function ChatPanel({ room, chat, user, displayName }) {
  const [msg, setMsg] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length]);

  const send = async () => {
    if (!msg.trim()) return;
    const text = msg.trim();
    setMsg("");
    await base44.entities.ChatMessage.create({
      room_id: room.id,
      user_id: user?.id || "",
      display_name: displayName || user?.full_name || "Guest",
      message: text,
    });
  };

  return (
    <div className="glass rounded-2xl p-4 text-white h-full flex flex-col">
      <h3 className="font-bold text-sm uppercase tracking-wide text-white/70 mb-3">Live Chat</h3>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1 min-h-0">
        {chat.length === 0 && (
          <p className="text-white/30 text-sm text-center py-6">Be the first to react…</p>
        )}
        {chat.map((c) => (
          <div key={c.id} className="text-sm">
            <span className="font-semibold text-amber-400">{c.display_name}: </span>
            <span className="text-white/80">{c.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Say something…"
          maxLength={200}
          className="bg-white/5 border-white/10 text-white"
        />
        <button
          onClick={send}
          className="px-3 rounded-lg bg-amber-500 text-black hover:bg-amber-400"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}