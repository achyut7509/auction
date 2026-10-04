import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "@/lib/useRoom";
import { formatMoney, exportAuctionResults } from "@/lib/auction";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Download, Trophy, Loader2, Home, Share2, Hammer } from "lucide-react";

export default function Results({ room: propRoom, teams: propTeams, players: propPlayers, onBack }) {
  const { roomCode } = useParams();
  const data = useRoom(roomCode);
  const navigate = useNavigate();
  const room = propRoom || data.room;
  const teams = propTeams || data.teams;
  const players = propPlayers || data.players;

  if (!room)
    return (
      <div className="min-h-screen auction-bg flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );

  const sold = players.filter((p) => p.status === "SOLD");
  const unsold = players.filter((p) => p.status === "UNSOLD");

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: room.name, url });
      else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
    } catch {}
  };

  return (
    <div className="min-h-screen auction-bg text-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <header className="glass-strong rounded-2xl p-6 text-center">
          <Trophy className="h-12 w-12 text-amber-400 mx-auto mb-2" />
          <h1 className="text-3xl font-extrabold">AUCTION COMPLETE</h1>
          <p className="text-white/60 mt-1">{room.name} · {room.room_code}</p>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            <Button onClick={() => exportAuctionResults(room, teams, players)} className="bg-amber-500 hover:bg-amber-400 text-black"><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button onClick={share} className="" variant="secondary"><Share2 className="h-4 w-4 mr-2" />Share</Button>
            <Button variant="ghost" className="text-white/70" onClick={() => (onBack ? onBack() : navigate("/"))}><Home className="h-4 w-4 mr-2" />Home</Button>
          </div>
        </header>

        <div className="grid sm:grid-cols-3 gap-3">
          <Stat label="Teams" value={teams.length} />
          <Stat label="Players Sold" value={sold.length} />
          <Stat label="Unsold" value={unsold.length} />
        </div>

        <div className="space-y-4">
          {teams.map((t) => {
            const squad = players.filter((p) => p.sold_to_team_id === t.id);
            return (
              <div key={t.id} className="glass rounded-2xl p-5" style={{ borderTopColor: t.color, borderTopWidth: 3 }}>
                <div className="flex items-center gap-3 mb-3">
                  {t.logo_url ? <Image src={t.logo_url} fittingType="fill" className="h-12 w-12 rounded-xl object-cover" /> :
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold" style={{ background: t.color }}>{t.short_code}</div>}
                  <div className="flex-1">
                    <div className="font-bold text-lg">{t.name}</div>
                    <div className="text-xs text-white/50">{t.owner_name || "Unassigned"}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-emerald-400 font-bold">{formatMoney(t.remaining_purse, room.currency)} left</div>
                    <div className="text-white/50">{formatMoney(t.total_spent, room.currency)} spent · {squad.length} players</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {squad.map((p) => (
                    <div key={p.id} className="bg-white/5 rounded-lg p-2 flex items-center gap-2">
                      {p.photo_url ? <img src={p.photo_url} className="h-8 w-8 rounded-full object-cover" alt="" /> : <div className="h-8 w-8 rounded-full bg-white/10" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-amber-400">{formatMoney(p.sold_price, room.currency)}</div>
                      </div>
                    </div>
                  ))}
                  {squad.length === 0 && <p className="text-white/30 text-sm">No players bought</p>}
                </div>
              </div>
            );
          })}
        </div>

        {unsold.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <h3 className="font-bold flex items-center gap-2 mb-2"><Hammer className="h-4 w-4 text-white/50" /> Unsold</h3>
            <div className="flex flex-wrap gap-2">
              {unsold.map((p) => (
                <span key={p.id} className="text-sm px-2 py-1 rounded bg-white/5 text-white/60">{p.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <div className="text-3xl font-extrabold text-amber-400">{value}</div>
      <div className="text-xs text-white/50 uppercase tracking-wide">{label}</div>
    </div>
  );
}