import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Crown, Check, X, Eye, Clock, Play, Users, Ban, Loader2, Trophy,
} from "lucide-react";

export default function Lobby({ room, teams, joinRequests, players, user, isHost, onStart, onGoResults, onManageTeams }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(null);

  const bidders = joinRequests.filter((j) => j.status === "APPROVED" && j.role === "BIDDER");
  const waiting = joinRequests.filter((j) => j.status === "PENDING" && j.role === "BIDDER");
  const spectators = joinRequests.filter((j) => j.role === "SPECTATOR");
  const availablePlayers = players.filter((p) => p.status === "AVAILABLE");

  const approve = async (jr, teamId) => {
    setBusy(jr.id);
    try {
      const team = teamId ? teams.find((t) => t.id === teamId) : null;
      if (teamId) {
        const taken = teams.find((t) => t.id === teamId && t.owner_id);
        if (taken) {
          toast({ title: "Team already assigned", variant: "destructive" });
          return;
        }
        await base44.entities.Team.update(teamId, { owner_id: jr.user_id, owner_name: jr.display_name });
      }
      await base44.entities.JoinRequest.update(jr.id, {
        status: "APPROVED",
        team_id: teamId || "",
      });
      await base44.entities.AuctionEvent.create({
        room_id: room.id, type: "USER_APPROVED",
        description: `${jr.display_name} approved as bidder${team ? ` (${team.name})` : ""}`,
      });
    } finally { setBusy(null); }
  };

  // Rejecting or removing a user deletes their join request, freeing their
  // team (if any) and letting the user request to join again from scratch.
  const reject = async (jr) => {
    setBusy(jr.id);
    try {
      await base44.entities.JoinRequest.delete(jr.id);
    } finally { setBusy(null); }
  };

  const ban = async (jr) => {
    setBusy(jr.id);
    try {
      if (jr.team_id) {
        await base44.entities.Team.update(jr.team_id, { owner_id: "", owner_name: "" });
      }
      await base44.entities.JoinRequest.delete(jr.id);
    } finally { setBusy(null); }
  };

  const approveAll = async () => {
    setBusy("all");
    try {
      for (const jr of waiting) {
        await base44.entities.JoinRequest.update(jr.id, { status: "APPROVED", team_id: "" });
      }
    } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen auction-bg text-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <header className="glass-strong rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <Crown className="h-4 w-4" /> LOBBY · {room.room_code}
            </div>
            <h1 className="text-2xl font-bold mt-1">{room.name}</h1>
            <p className="text-white/50 text-sm">Host: {room.host_name}</p>
          </div>
          <div className="flex gap-2">
            <div className="glass rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-emerald-400">{bidders.length}</div>
              <div className="text-xs text-white/50">Bidders</div>
            </div>
            <div className="glass rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-amber-400">{spectators.length}</div>
              <div className="text-xs text-white/50">Spectators</div>
            </div>
            <div className="glass rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold">{availablePlayers.length}</div>
              <div className="text-xs text-white/50">Players</div>
            </div>
          </div>
        </header>

        {isHost && waiting.length > 0 && (
          <section className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold flex items-center gap-2"><Users className="h-4 w-4 text-amber-400" /> Join Requests ({waiting.length})</h2>
              <Button size="sm" onClick={approveAll} disabled={busy === "all"} className="bg-emerald-500 hover:bg-emerald-400 text-black">
                Approve All
              </Button>
            </div>
            <div className="space-y-2">
              {waiting.map((jr) => (
                <RequestRow key={jr.id} jr={jr} teams={teams} busy={busy} onApprove={approve} onReject={reject} onBan={ban} />
              ))}
            </div>
          </section>
        )}

        <section className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-4">
            <h2 className="font-bold mb-3 flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Active Bidders</h2>
            {bidders.length === 0 && <p className="text-white/30 text-sm">No approved bidders yet</p>}
            <div className="space-y-2">
              {bidders.map((jr) => {
                const team = teams.find((t) => t.id === jr.team_id);
                return (
                  <div key={jr.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {jr.display_name}
                    </span>
                    {team && <span className="text-xs px-2 py-0.5 rounded" style={{ background: team.color }}>{team.short_code}</span>}
                    {isHost && (
                      <button onClick={() => ban(jr)} className="text-white/30 hover:text-red-400 text-xs">remove</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <h2 className="font-bold mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-amber-400" /> Waiting</h2>
            {waiting.length === 0 && <p className="text-white/30 text-sm">No pending requests</p>}
            <div className="space-y-2">
              {waiting.map((jr) => (
                <div key={jr.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {jr.display_name}
                  {jr.requested_team && <span className="text-white/40">· wants {jr.requested_team}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Eye className="h-4 w-4 text-sky-400" /> Teams</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {teams.map((t) => (
              <div key={t.id} className="bg-white/5 rounded-lg p-2 text-sm" style={{ borderLeft: `3px solid ${t.color}` }}>
                <div className="font-semibold truncate">{t.name}</div>
                <div className="text-xs text-white/50">{t.owner_name || "Unassigned"}</div>
              </div>
            ))}
          </div>
        </section>

        {isHost && (
          <div className="sticky bottom-4 flex gap-3">
            <Button onClick={onStart} disabled={availablePlayers.length === 0} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black h-12 text-base">
              <Play className="h-5 w-5 mr-2" /> Start Auction
            </Button>
            {isHost && (
              <Button onClick={() => onManageTeams()} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 h-12">
                <Users className="h-5 w-5 mr-1" /> Manage
              </Button>
            )}
            <Button onClick={onGoResults} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 h-12">
              <Trophy className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestRow({ jr, teams, busy, onApprove, onReject, onBan }) {
  const [teamId, setTeamId] = useState("");
  return (
    <div className="bg-white/5 rounded-xl p-3 flex flex-wrap items-center gap-2">
      <div className="flex-1 min-w-[140px]">
        <div className="font-semibold">{jr.display_name}</div>
        {jr.requested_team && <div className="text-xs text-white/40">Wants: {jr.requested_team}</div>}
      </div>
      <Select value={teamId} onValueChange={setTeamId}>
        <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white h-9">
          <SelectValue placeholder="Assign team" />
        </SelectTrigger>
        <SelectContent>
          {teams.filter((t) => !t.owner_id).map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={() => onApprove(jr, teamId)} disabled={busy === jr.id} className="bg-emerald-500 hover:bg-emerald-400 text-black h-9">
        {busy === jr.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => onReject(jr)} disabled={busy === jr.id} className="bg-white/10 text-white hover:bg-white/20 h-9">
        <X className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onBan(jr)} disabled={busy === jr.id} className="text-red-400 hover:text-red-300 h-9">
        <Ban className="h-4 w-4" />
      </Button>
    </div>
  );
}