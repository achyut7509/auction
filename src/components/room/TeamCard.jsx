import { formatMoney } from "@/lib/auction";
import { Image } from "@/components/ui/image";
import { Users, Wallet } from "lucide-react";

export default function TeamCard({ team, active, players }) {
  const pct = team.starting_purse
    ? Math.min(100, Math.round(((team.starting_purse - (team.remaining_purse ?? 0)) / team.starting_purse) * 100))
    : 0;
  const lowPurse = team.starting_purse
    ? (team.remaining_purse ?? 0) < team.starting_purse * 0.1
    : false;
  const squad = players.filter((p) => p.sold_to_team_id === team.id);
  return (
    <div
      className={`rounded-2xl p-4 text-white transition ${active ? "ring-glow scale-[1.02]" : ""} ${lowPurse ? "bg-red-500/20 border border-red-500/60" : "glass"}`}
      style={{ borderTopColor: team.color, borderTopWidth: 3 }}
    >
      <div className="flex items-center gap-3">
        {team.logo_url ? (
          <Image src={team.logo_url} fittingType="fill" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: team.color || "#1e3a8a" }}
          >
            {team.short_code || team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-bold truncate">{team.name}</div>
          <div className="text-xs text-white/50 truncate">
            {team.owner_name || "Unassigned"} · {team.short_code}
          </div>
        </div>
        {lowPurse && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">LOW PURSE</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="rounded-lg bg-white/5 py-2">
          <div className="text-[10px] text-white/40 uppercase">Purse</div>
          <div className="text-sm font-bold text-emerald-400">{formatMoney(team.remaining_purse, "")}</div>
        </div>
        <div className="rounded-lg bg-white/5 py-2">
          <div className="text-[10px] text-white/40 uppercase">Spent</div>
          <div className="text-sm font-bold">{formatMoney(team.total_spent, "")}</div>
        </div>
        <div className="rounded-lg bg-white/5 py-2">
          <div className="text-[10px] text-white/40 uppercase">Squad</div>
          <div className="text-sm font-bold">
            <Users className="inline h-3 w-3 mr-1" />
            {team.players_count || 0}/{team.max_players}
          </div>
        </div>
      </div>

      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>

      {squad.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {squad.slice(0, 8).map((p) => (
            <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 truncate max-w-[90px]">
              {p.name}
            </span>
          ))}
          {squad.length > 8 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
              +{squad.length - 8}
            </span>
          )}
        </div>
      )}
    </div>
  );
}