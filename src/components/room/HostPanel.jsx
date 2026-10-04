import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/auction";
import {
  Hammer, Ban, SkipForward, Pause, Play, Square, RotateCcw, Timer,
  Trophy, Loader2, UserCog,
} from "lucide-react";

export default function HostPanel({ room, players, joinRequests, teams, onAction }) {
  const [busy, setBusy] = useState(null);
  const run = async (action, payload) => {
    setBusy(action);
    try {
      await base44.functions.invoke("hostAction", { room_id: room.id, action, payload });
      onAction?.();
    } finally {
      setBusy(null);
    }
  };

  const pending = joinRequests.filter((j) => j.status === "PENDING" && j.role === "BIDDER");
  const unsold = players.filter((p) => p.status === "UNSOLD" || p.status === "SKIPPED");
  const isLive = room.status === "LIVE" || room.status === "PAUSED";

  return (
    <div className="glass-strong rounded-2xl p-4 text-white space-y-4">
      <div className="flex items-center gap-2">
        <UserCog className="h-5 w-5 text-amber-400" />
        <h3 className="font-bold uppercase tracking-wide text-sm">Host Control Center</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-lg bg-white/5 py-2">
          <div className="text-white/40">Current Bid</div>
          <div className="font-bold text-amber-400">{formatMoney(room.current_bid, room.currency)}</div>
        </div>
        <div className="rounded-lg bg-white/5 py-2">
          <div className="text-white/40">Status</div>
          <div className="font-bold">{room.status}</div>
        </div>
      </div>

      {!isLive ? (
        <Button
          onClick={() => run("start")}
          disabled={busy === "start"}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black"
        >
          {busy === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          Start Auction
        </Button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => run("sold")} disabled={busy === "sold" || !room.current_bidder_team_id} className="bg-amber-500 hover:bg-amber-400 text-black">
              {busy === "sold" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hammer className="h-4 w-4 mr-1" />} SOLD
            </Button>
            <Button onClick={() => run("unsold")} disabled={busy === "unsold"} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              {busy === "unsold" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4 mr-1" />} UNSOLD
            </Button>
            <Button onClick={() => run("skip")} disabled={busy === "skip"} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              {busy === "skip" ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkipForward className="h-4 w-4 mr-1" />} SKIP
            </Button>
            <Button onClick={() => run("resetTimer")} disabled={busy === "resetTimer"} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              {busy === "resetTimer" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4 mr-1" />} RESET
            </Button>
            {room.status === "LIVE" ? (
              <Button onClick={() => run("pause")} disabled={busy === "pause"} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 col-span-2">
                <Pause className="h-4 w-4 mr-2" /> PAUSE
              </Button>
            ) : (
              <Button onClick={() => run("resume")} disabled={busy === "resume"} className="bg-sky-500 hover:bg-sky-400 text-black col-span-2">
                <Play className="h-4 w-4 mr-2" /> RESUME
              </Button>
            )}
          </div>
        </>
      )}

      {unsold.length > 0 && room.reauction_unsold && (
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-xs text-white/50 mb-2 flex items-center gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Re-auction ({unsold.length})
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {unsold.map((p) => (
              <button
                key={p.id}
                onClick={() => run("reauction", { player_id: p.id })}
                disabled={busy === "reauction"}
                className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-amber-500/30 text-white/80"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-200">
          {pending.length} join request{pending.length > 1 ? "s" : ""} waiting — review in Lobby
        </div>
      )}

      {isLive && (
        <Button onClick={() => run("end")} disabled={busy === "end"} variant="destructive" className="w-full">
          <Square className="h-4 w-4 mr-2" /> END AUCTION
        </Button>
      )}

      <div className="pt-2 border-t border-white/10 text-center">
        <Button
          onClick={() => onAction?.("goResults")}
          variant="ghost"
          className="text-white/60 hover:text-white w-full"
        >
          <Trophy className="h-4 w-4 mr-2" /> View Results
        </Button>
      </div>
    </div>
  );
}