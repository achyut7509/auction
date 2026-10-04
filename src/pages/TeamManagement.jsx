import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/ImageUpload";
import { useRoom } from "@/lib/useRoom";
import { formatMoney } from "@/lib/auction";
import {
  ChevronLeft, Loader2, Users, Save, ArrowRightLeft, Shuffle,
} from "lucide-react";

export default function TeamManagement() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { room, teams, players, loading, error, refresh } = useRoom(roomCode);
  const [edits, setEdits] = useState({});
  const [savingId, setSavingId] = useState(null);

  if (loading)
    return (
      <div className="min-h-screen auction-bg flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );

  if (error || !room)
    return (
      <div className="min-h-screen auction-bg flex flex-col items-center justify-center text-white gap-3 p-4">
        <Users className="h-10 w-10 text-white/30" />
        <p className="text-white/60">{error || "Room not found"}</p>
        <Button variant="ghost" className="text-white/70" onClick={() => navigate(`/room/${roomCode}`)}>Back</Button>
      </div>
    );

  const soldPlayers = players.filter((p) => p.status === "SOLD");

  const editFor = (t) => edits[t.id] || { name: t.name, short_code: t.short_code, color: t.color, logo_url: t.logo_url };
  const setField = (id, k, v) => setEdits((s) => ({ ...s, [id]: { ...editFor({ id }), [k]: v } }));

  const saveTeam = async (t) => {
    const e = editFor(t);
    if (!e.name?.trim()) { toast({ title: "Team name is required", variant: "destructive" }); return; }
    setSavingId(t.id);
    try {
      await base44.entities.Team.update(t.id, {
        name: e.name.trim(),
        short_code: (e.short_code || "").trim().toUpperCase() || t.short_code,
        color: e.color,
        logo_url: e.logo_url,
      });
      setEdits((s) => { const n = { ...s }; delete n[t.id]; return n; });
      toast({ title: "Team updated" });
      refresh();
    } catch (err) {
      toast({ title: err?.message || "Failed to save", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const reassign = async (player, toTeamId) => {
    if (!toTeamId || toTeamId === player.sold_to_team_id) return;
    const fromTeam = teams.find((t) => t.id === player.sold_to_team_id);
    const toTeam = teams.find((t) => t.id === toTeamId);
    const price = player.sold_price || 0;
    try {
      await base44.entities.Player.update(player.id, { sold_to_team_id: toTeamId });
      if (fromTeam) {
        await base44.entities.Team.update(fromTeam.id, {
          remaining_purse: (fromTeam.remaining_purse || 0) + price,
          total_spent: Math.max(0, (fromTeam.total_spent || 0) - price),
          players_count: Math.max(0, (fromTeam.players_count || 0) - 1),
        });
      }
      if (toTeam) {
        await base44.entities.Team.update(toTeam.id, {
          remaining_purse: (toTeam.remaining_purse || 0) - price,
          total_spent: (toTeam.total_spent || 0) + price,
          players_count: (toTeam.players_count || 0) + 1,
        });
      }
      await base44.entities.AuctionEvent.create({
        room_id: room.id, type: "PLAYER_REASSIGNED",
        description: `${player.name} moved ${fromTeam ? `from ${fromTeam.name} ` : ""}to ${toTeam?.name || ""}`,
        data: { player_id: player.id, from_team_id: fromTeam?.id, to_team_id: toTeamId, price },
      });
      toast({ title: `${player.name} → ${toTeam?.name}` });
      refresh();
    } catch (err) {
      toast({ title: err?.message || "Reassign failed", variant: "destructive" });
    }
  };

  const shuffleOrder = async () => {
    try {
      const avail = players.filter((p) => p.status === "AVAILABLE");
      if (!avail.length) { toast({ title: "No available players to shuffle" }); return; }
      const shuffled = [...avail];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      await base44.entities.Player.bulkUpdate(
        shuffled.map((p, i) => ({ id: p.id, order_index: i }))
      );
      await base44.entities.AuctionEvent.create({
        room_id: room.id, type: "PLAYERS_SHUFFLED",
        description: `Bidding order shuffled (${shuffled.length} players)`,
      });
      toast({ title: `Shuffled ${shuffled.length} players` });
      refresh();
    } catch (err) {
      toast({ title: err?.message || "Shuffle failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen auction-bg text-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <header className="glass-strong rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <Users className="h-4 w-4" /> TEAM MANAGEMENT · {room.room_code}
            </div>
            <h1 className="text-2xl font-bold mt-1">{room.name}</h1>
            <p className="text-white/50 text-sm">{teams.length} teams · {players.length} players</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={shuffleOrder} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              <Shuffle className="h-4 w-4 mr-1" /> Shuffle Order
            </Button>
            <Button onClick={() => navigate(`/room/${room.room_code}`)} className="bg-amber-500 hover:bg-amber-400 text-black">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Lobby
            </Button>
          </div>
        </header>

        {/* Teams editor */}
        <section className="space-y-3">
          <h2 className="font-bold text-sm uppercase tracking-wide text-white/60 px-1">Teams</h2>
          {teams.map((t) => {
            const e = editFor(t);
            const isDirty = (e.name !== t.name || e.short_code !== t.short_code || e.color !== t.color || e.logo_url !== t.logo_url);
            const squad = players.filter((p) => p.sold_to_team_id === t.id);
            return (
              <div key={t.id} className="glass-strong rounded-2xl p-4" style={{ borderLeft: `4px solid ${t.color}` }}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70">Team Name</Label>
                    <Input
                      value={e.name}
                      onChange={(ev) => setField(t.id, "name", ev.target.value)}
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70">Short Code</Label>
                    <Input
                      value={e.short_code}
                      onChange={(ev) => setField(t.id, "short_code", ev.target.value)}
                      maxLength={4}
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <ImageUpload value={e.logo_url} onChange={(v) => setField(t.id, "logo_url", v)} label="Update logo" size="h-14 w-14" />
                  <div>
                    <Label className="text-white/70 block mb-1">Color</Label>
                    <input
                      type="color"
                      value={e.color}
                      onChange={(ev) => setField(t.id, "color", ev.target.value)}
                      className="h-10 w-14 rounded bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="text-xs text-white/50">
                    <div>Purse: {formatMoney(t.remaining_purse, room.currency)}</div>
                    <div>Squad: {t.players_count || 0}/{t.max_players}</div>
                    {t.owner_name && <div>Owner: {t.owner_name}</div>}
                  </div>
                  {isDirty && (
                    <Button
                      size="sm"
                      onClick={() => saveTeam(t)}
                      disabled={savingId === t.id}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black ml-auto"
                    >
                      {savingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Save</>}
                    </Button>
                  )}
                </div>

                {/* Squad with reassign */}
                {squad.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <div className="text-xs uppercase tracking-wide text-white/50 mb-2 flex items-center gap-1">
                      <ArrowRightLeft className="h-3.5 w-3.5" /> Squad ({squad.length}) — reassign
                    </div>
                    <div className="space-y-2">
                      {squad.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                          {p.photo_url ? <img src={p.photo_url} className="h-7 w-7 rounded-full object-cover" alt="" /> :
                            <div className="h-7 w-7 rounded-full bg-white/10" />}
                          <span className="font-medium text-sm flex-1 truncate">{p.name}</span>
                          <span className="text-xs text-amber-400">{formatMoney(p.sold_price, room.currency)}</span>
                          <Select value={p.sold_to_team_id} onValueChange={(v) => reassign(p, v)}>
                            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {teams.map((to) => (
                                <SelectItem key={to.id} value={to.id}>{to.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {teams.length === 0 && <p className="text-white/30 text-sm text-center py-6">No teams yet</p>}
        </section>
      </div>
    </div>
  );
}