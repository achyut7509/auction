import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGuestId } from "@/lib/guest";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, UserPlus, Loader2, Trophy } from "lucide-react";

export default function JoinScreen({ room, teams, user }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState(user?.full_name || "");
  const [team, setTeam] = useState("");
  const [busy, setBusy] = useState(false);

  const identityId = user?.id || getGuestId();
  const taken = new Set(
    teams.filter((t) => t.owner_id).map((t) => t.id)
  );

  const submit = async (role) => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await base44.entities.JoinRequest.create({
        room_id: room.id,
        user_id: identityId,
        display_name: name.trim(),
        requested_team: role === "BIDDER" ? team : "",
        status: role === "SPECTATOR" ? "APPROVED" : "PENDING",
        role,
        team_id: "",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen auction-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-strong rounded-3xl p-8 text-white">
        <div className="flex items-center gap-3 mb-1">
          {room.logo_url ? (
            <img src={room.logo_url} className="h-12 w-12 rounded-xl object-cover" alt="" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-amber-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            <p className="text-white/50 text-sm">Room Code: {room.room_code}</p>
          </div>
        </div>
        {room.description && (
          <p className="text-white/60 text-sm mt-3">{room.description}</p>
        )}

        {!mode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => setMode("play")}
              className="glass rounded-2xl p-6 text-left hover:ring-glow transition group"
            >
              <UserPlus className="h-7 w-7 text-amber-400 mb-3" />
              <div className="font-semibold text-lg">Request to Play</div>
              <div className="text-white/50 text-sm">Become an active bidder (host approval required)</div>
            </button>
            <button
              onClick={() => setMode("spectator")}
              className="glass rounded-2xl p-6 text-left hover:ring-glow transition group"
            >
              <Eye className="h-7 w-7 text-sky-400 mb-3" />
              <div className="font-semibold text-lg">Watch as Spectator</div>
              <div className="text-white/50 text-sm">Watch the live auction in real time</div>
            </button>
          </div>
        )}

        {mode === "play" && (
          <div className="mt-8 space-y-4">
            <div>
              <Label className="text-white/70">Display Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-white/70">Team Preference (optional)</Label>
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="No preference" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      disabled={taken.has(t.id)}
                      className={taken.has(t.id) ? "opacity-40" : ""}
                    >
                      {t.name} {taken.has(t.id) ? "(taken)" : `· ${t.short_code}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => submit("BIDDER")}
                disabled={busy || !name.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-black flex-1"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Request"}
              </Button>
              <Button variant="ghost" onClick={() => setMode(null)} className="text-white/70">
                Back
              </Button>
            </div>
          </div>
        )}

        {mode === "spectator" && (
          <div className="mt-8 space-y-4">
            <div>
              <Label className="text-white/70">Display Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>
            <p className="text-white/60 text-sm">
              You'll watch the auction live. You can switch to bidding later by requesting from inside the room.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => submit("SPECTATOR")}
                disabled={busy || !name.trim()}
                className="bg-sky-500 hover:bg-sky-400 text-black flex-1"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter as Spectator"}
              </Button>
              <Button variant="ghost" onClick={() => setMode(null)} className="text-white/70">
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}