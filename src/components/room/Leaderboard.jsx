import { useState } from "react";
import { formatMoney } from "@/lib/auction";
import { Image } from "@/components/ui/image";
import { Trophy, TrendingUp, Wallet, Medal } from "lucide-react";

const RANK_COLORS = {
  0: "from-amber-400 to-yellow-500",
  1: "from-slate-300 to-slate-400",
  2: "from-orange-400 to-amber-600",
};

export default function Leaderboard({ room, teams, players }) {
  const [mode, setMode] = useState("purse"); // "purse" | "spent"

  if (!teams.length)
    return (
      <div className="glass rounded-2xl p-6 text-center text-white/50 text-sm">
        No teams in this auction yet.
      </div>
    );

  const sorted = [...teams].sort((a, b) => {
    if (mode === "purse") return (b.remaining_purse || 0) - (a.remaining_purse || 0);
    return (b.total_spent || 0) - (a.total_spent || 0);
  });

  const maxPurse = room.starting_purse || 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 uppercase tracking-wide text-white/60 text-sm">
          <Trophy className="h-4 w-4 text-amber-400" /> Leaderboard
        </h3>
        <div className="flex rounded-lg bg-white/5 p-0.5 text-xs">
          <button
            onClick={() => setMode("purse")}
            className={`px-2.5 py-1 rounded-md transition ${mode === "purse" ? "bg-amber-500 text-black font-semibold" : "text-white/60"}`}
          >
            Purse
          </button>
          <button
            onClick={() => setMode("spent")}
            className={`px-2.5 py-1 rounded-md transition ${mode === "spent" ? "bg-amber-500 text-black font-semibold" : "text-white/60"}`}
          >
            Spent
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((t, i) => {
          const rank = i + 1;
          const pct = ((t.remaining_purse || 0) / maxPurse) * 100;
          const isLeader = i === 0 && teams.length > 1;
          return (
            <div
              key={t.id}
              className={`glass rounded-xl p-3 flex items-center gap-3 transition ${isLeader ? "ring-1 ring-amber-400/50" : ""}`}
            >
              <div
                className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-extrabold text-sm text-black ${
                  RANK_COLORS[i] ? `bg-gradient-to-br ${RANK_COLORS[i]}` : "bg-white/10"
                }`}
              >
                {rank <= 3 ? <Medal className="h-4 w-4" /> : rank}
              </div>

              {t.logo_url ? (
                <Image src={t.logo_url} fittingType="fill" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: t.color || "#1e3a8a" }}
                >
                  {(t.short_code || t.name || "?").slice(0, 3)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{t.name}</span>
                  {isLeader && <span className="text-amber-400"><Trophy className="h-4 w-4" /></span>}
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isLeader ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                  />
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-sm font-bold ${mode === "purse" ? "text-emerald-400" : "text-amber-400"}`}>
                  {formatMoney(mode === "purse" ? t.remaining_purse : t.total_spent, room.currency)}
                </div>
                <div className="text-[11px] text-white/50 flex items-center justify-end gap-1">
                  {mode === "purse" ? (
                    <><Wallet className="h-3 w-3" /> {t.players_count || 0} players</>
                  ) : (
                    <><TrendingUp className="h-3 w-3" /> spent</>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}