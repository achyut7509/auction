import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/ImageUpload";
import TeamForm from "@/components/create/TeamForm";
import PlayerForm from "@/components/create/PlayerForm";
import PlayerImport from "@/components/create/PlayerImport";
import { genRoomCode, formatMoney } from "@/lib/auction";
import {
  ChevronLeft, ChevronRight, Check, Trash2, Loader2, Rocket, Users, Trophy, Settings, ListChecks, Search,
} from "lucide-react";

const STEPS = ["Details", "Settings", "Teams", "Players", "Review"];

export default function Create() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [basic, setBasic] = useState({ name: "", description: "", host_name: "", logo_url: "", banner_url: "" });
  const [settings, setSettings] = useState({
    currency: "₹", starting_purse: 20000000, base_bid: 500000, bid_increment: 500000,
    timer_seconds: 10, auto_timer: true, timer_reset_after_bid: true, sound_enabled: true,
    allow_unsold: true, reauction_unsold: true, chat_enabled: true, spectator_reactions: true,
    privacy: "PUBLIC",
  });
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerQuery, setPlayerQuery] = useState("");

  const filteredPlayers = players.filter((p) => {
    const q = playerQuery.trim().toLowerCase();
    if (!q) return true;
    return [p.name, p.role, p.country, p.set_name].some((v) => (v || "").toLowerCase().includes(q));
  });

  const setS = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const create = async () => {
    if (!basic.name.trim() || !basic.host_name.trim()) {
      toast({ title: "Name and host name are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const code = genRoomCode();
      const room = await base44.entities.Room.create({
        room_code: code,
        name: basic.name.trim(),
        description: basic.description,
        host_name: basic.host_name.trim(),
        logo_url: basic.logo_url,
        banner_url: basic.banner_url,
        status: "LOBBY",
        ...settings,
        current_bid: 0, timer_paused: false,
      });
      if (teams.length) {
        await base44.entities.Team.bulkCreate(teams.map((t) => ({ ...t, room_id: room.id })));
      }
      if (players.length) {
        await base44.entities.Player.bulkCreate(
          players.map((p, i) => ({ ...p, room_id: room.id, order_index: i, status: "AVAILABLE" }))
        );
      }
      toast({ title: "Auction created!", description: `Room code: ${code}` });
      navigate(`/room/${code}`);
    } catch (e) {
      toast({ title: e.message || "Failed to create", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const canNext = () => {
    if (step === 0) return basic.name.trim() && basic.host_name.trim();
    if (step === 2) return teams.length > 0;
    if (step === 3) return players.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen auction-bg text-white">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1 text-amber-400 text-sm font-semibold">
          <Rocket className="h-4 w-4" /> CREATE AUCTION
        </div>
        <h1 className="text-2xl font-bold">Set up your cricket auction</h1>

        {/* Stepper */}
        <div className="flex items-center gap-1 mt-5 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${i === step ? "bg-amber-500 text-black" : i < step ? "bg-emerald-500/20 text-emerald-300" : "glass text-white/50"}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>} {s}
              </div>
              {i < STEPS.length - 1 && <div className="h-px w-4 bg-white/20" />}
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-5 space-y-4">
          {step === 0 && (
            <div className="space-y-3">
              <div>
                <Label className="text-white/70">Auction Name *</Label>
                <Input value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} placeholder="APL Season 4 Auction" className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
              <div>
                <Label className="text-white/70">Host Name *</Label>
                <Input value={basic.host_name} onChange={(e) => setBasic({ ...basic, host_name: e.target.value })} placeholder="Achyut" className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
              <div>
                <Label className="text-white/70">Description</Label>
                <Textarea value={basic.description} onChange={(e) => setBasic({ ...basic, description: e.target.value })} placeholder="A short description of your auction" className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
              <div className="flex flex-wrap gap-4">
                <ImageUpload value={basic.logo_url} onChange={(v) => setBasic({ ...basic, logo_url: v })} label="Auction logo" size="h-16 w-16" />
                <ImageUpload value={basic.banner_url} onChange={(v) => setBasic({ ...basic, banner_url: v })} label="Banner" size="h-16 w-28" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70">Currency</Label>
                  <Select value={settings.currency} onValueChange={(v) => setS("currency", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["₹", "$", "£", "€"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">Timer (seconds)</Label>
                  <Select value={String(settings.timer_seconds)} onValueChange={(v) => setS("timer_seconds", Number(v))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{[5,10,15,20,30].map((t) => <SelectItem key={t} value={String(t)}>{t}s</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">Starting Purse</Label>
                  <Input type="number" value={settings.starting_purse} onChange={(e) => setS("starting_purse", Number(e.target.value))} className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-white/70">Base Bid</Label>
                  <Input type="number" value={settings.base_bid} onChange={(e) => setS("base_bid", Number(e.target.value))} className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-white/70">Bid Increment</Label>
                  <Input type="number" value={settings.bid_increment} onChange={(e) => setS("bid_increment", Number(e.target.value))} className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-white/70">Privacy</Label>
                  <Select value={settings.privacy} onValueChange={(v) => setS("privacy", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="PUBLIC">Public</SelectItem><SelectItem value="PRIVATE">Private</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 pt-2">
                {[["auto_timer","Auto timer"],["timer_reset_after_bid","Reset timer after bid"],["sound_enabled","Sound effects"],["allow_unsold","Allow unsold"],["reauction_unsold","Re-auction unsold"],["chat_enabled","Chat"],["spectator_reactions","Spectator reactions"]].map(([k,l]) => (
                  <div key={k} className="flex items-center justify-between glass rounded-lg px-3 py-2">
                    <span className="text-sm text-white/80">{l}</span>
                    <Switch checked={settings[k]} onCheckedChange={(v) => setS(k, v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <TeamForm onAdd={(t) => setTeams([...teams, t])} defaultPurse={settings.starting_purse} />
              <div className="space-y-2">
                {teams.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 glass rounded-xl p-3" style={{ borderLeft: `4px solid ${t.color}` }}>
                    {t.logo_url ? <img src={t.logo_url} className="h-9 w-9 rounded-lg object-cover" alt="" /> :
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: t.color }}>{t.short_code}</div>}
                    <div className="flex-1">
                      <div className="font-semibold">{t.name} <span className="text-white/40 text-xs">· {t.short_code}</span></div>
                      <div className="text-xs text-white/50">{formatMoney(t.starting_purse, settings.currency)} · max {t.max_players}</div>
                    </div>
                    <button onClick={() => setTeams(teams.filter((_, x) => x !== i))} className="text-white/30 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                {teams.length === 0 && <p className="text-white/30 text-sm text-center py-4">Add at least one team</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <PlayerImport onImport={(rows) => setPlayers([...players, ...rows])} />
              <PlayerForm onAdd={(p) => setPlayers([...players, p])} defaultBase={settings.base_bid} />
              <div className="text-sm text-white/50 px-1">{players.length} player{players.length !== 1 ? "s" : ""} ready</div>
              {players.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    value={playerQuery}
                    onChange={(e) => setPlayerQuery(e.target.value)}
                    placeholder="Search players…"
                    className="bg-white/5 border-white/10 text-white pl-9"
                  />
                </div>
              )}
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {players.length === 0 && <p className="text-white/30 text-sm text-center py-4">Add at least one player</p>}
                {players.length > 0 && filteredPlayers.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-4">No players match "{playerQuery}"</p>
                )}
                {filteredPlayers.map((p) => {
                  const i = players.indexOf(p);
                  return (
                  <div key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-sm">
                    {p.photo_url ? <img src={p.photo_url} className="h-7 w-7 rounded-full object-cover" alt="" /> :
                      <div className="h-7 w-7 rounded-full bg-white/10" />}
                    <span className="font-medium flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-white/40">{p.role}</span>
                    <span className="text-xs text-amber-400">{formatMoney(p.base_price, settings.currency)}</span>
                    {p.set_name && <span className="text-xs text-white/30 hidden sm:inline">{p.set_name}</span>}
                    <button onClick={() => setPlayers(players.filter((_, x) => x !== i))} className="text-white/30 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-amber-400 font-semibold"><ListChecks className="h-4 w-4" /> Review</div>
              <Row icon={Trophy} label="Auction" value={`${basic.name} · Host: ${basic.host_name}`} />
              <Row icon={Settings} label="Settings" value={`${settings.currency}${(settings.starting_purse/100000).toFixed(0)}L purse · ${settings.timer_seconds}s timer · ${settings.privacy}`} />
              <Row icon={Users} label="Teams" value={`${teams.length} team${teams.length !== 1 ? "s" : ""}`} />
              <Row icon={Trophy} label="Players" value={`${players.length} player${players.length !== 1 ? "s" : ""}`} />
              <div className="glass rounded-xl p-3 text-white/60 text-xs">
                A unique room code will be generated. Share <code>/room/CODE</code> with bidders and spectators.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-5">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="text-white/70">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="bg-amber-500 hover:bg-amber-400 text-black">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={create} disabled={busy} className="bg-emerald-500 hover:bg-emerald-400 text-black">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4 mr-1" />} Create Room
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 glass rounded-lg px-3 py-2">
      <Icon className="h-4 w-4 text-amber-400" />
      <span className="text-white/50 w-20">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}