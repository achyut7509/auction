import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/auction";
import PlayerCard from "./PlayerCard";
import TeamCard from "./TeamCard";
import Leaderboard from "./Leaderboard";
import ActivityFeed from "./ActivityFeed";
import ChatPanel from "./ChatPanel";
import HostPanel from "./HostPanel";
import { Eye, Crown, Loader2, Gavel, AlertCircle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LiveAuction({
  room, teams, players, events, chat, user, role, myTeam, displayName, identityId, spectatorCount, onGoResults, refresh,
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [bidBusy, setBidBusy] = useState(false);
  const [customBid, setCustomBid] = useState("");
  const expiredRef = useRef(false);

  const isHost = role === "host";
  const isBidder = role === "bidder" && !!myTeam;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const deadline = room.timer_deadline ? new Date(room.timer_deadline).getTime() : 0;
  const remaining = room.timer_paused || !deadline ? room.timer_seconds || 10 : (deadline - now) / 1000;

  // Auto-expiry: any connected client (host, bidder, or spectator) can fire
  // the sell/unsold when the timer reaches 0, so the auction never stalls if
  // the host's tab is closed or throttled. The backend dedups concurrent
  // expiry calls — if the player already advanced it returns harmlessly.
  useEffect(() => {
    if (room.status !== "LIVE" || room.timer_paused) { expiredRef.current = false; return; }
    if (remaining > 0) { expiredRef.current = false; return; }
    if (expiredRef.current) return;
    expiredRef.current = true;
    const action = room.current_bidder_team_id ? "sold" : "unsold";
    base44.functions.invoke("hostAction", { room_id: room.id, action }).catch(() => {});
  }, [remaining, room.status, room.timer_paused, room.current_bidder_team_id, room.id]);

  const currentPlayer = players.find((p) => p.id === room.current_player_id);
  const bidderTeam = teams.find((t) => t.id === room.current_bidder_team_id);

  const hasBidder = !!room.current_bidder_team_id;
  const minNext = hasBidder
    ? (room.current_bid || 0) + (room.bid_increment || 0)
    : room.current_bid || 0;
  const step2 = minNext + (room.bid_increment || 0);

  const increment = room.bid_increment || 0;
  // A custom bid is valid only if it meets the minimum AND steps exactly by the
  // configured increment above the current bid (base + k * increment).
  const customNum = Number(customBid);
  const customValid = !!customBid && !isNaN(customNum) &&
    customNum >= minNext &&
    (increment <= 0 || (customNum - (room.current_bid || 0)) % increment === 0)
    && (customNum <= (myTeam?.remaining_purse || 0));

  const myId = identityId || user?.id || "";
  const iAmHighBidder = !!room.current_bidder_user_id && room.current_bidder_user_id === myId;
  const canBid = isBidder && room.status === "LIVE" && !room.timer_paused && currentPlayer &&
    !iAmHighBidder &&
    (myTeam.remaining_purse || 0) >= minNext &&
    (myTeam.players_count || 0) < myTeam.max_players;

  const placeBid = async (amount, isRetry) => {
    if (!myTeam) return;
    setBidBusy(true);
    try {
      const res = await base44.functions.invoke("placeBid", {
        room_id: room.id, team_id: myTeam.id, amount, bidder_id: identityId || user?.id || "",
      });
      if (res.data?.error) {
        // A stale snapshot can make the amount too low (or the player already
        // advanced). Refresh once and retry with the true minimum so the bid
        // still lands. Genuine errors (insufficient purse, squad full, paused)
        // are shown to the user.
        const msg = res.data.error;
        if (/too low|minimum|not active|no active player/i.test(msg)) {
          await refresh();
          const fixed = await fetchCorrectedMin();
          if (fixed != null && fixed !== amount) {
            const retry = await base44.functions.invoke("placeBid", {
              room_id: room.id, team_id: myTeam.id, amount: fixed, bidder_id: identityId || user?.id || "",
            });
            if (!retry.data?.error) { toast({ title: "Bid placed", variant: "default" }); setCustomBid(""); }
            else toast({ title: retry.data.error, variant: "destructive" });
            return;
          }
        }
        toast({ title: msg, variant: "destructive" });
      } else {
        setCustomBid("");
      }
    } catch (e) {
      toast({ title: e?.message || "Bid failed", variant: "destructive" });
    } finally {
      setBidBusy(false);
    }
  };

  // Fetch a fresh room snapshot and compute the true current minimum bid.
  const fetchCorrectedMin = async () => {
    try {
      const r = await base44.entities.Room.get(room.id);
      const hasB = !!r.current_bidder_team_id;
      return hasB ? (r.current_bid || 0) + (r.bid_increment || 0) : r.current_bid || 0;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen auction-bg text-white">
      <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
        {/* Top bar */}
        <header className="glass-strong rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${room.status === "LIVE" ? "bg-red-500 animate-pulse" : "bg-amber-500 text-black"}`}>
              {room.status === "LIVE" ? "● LIVE" : room.status}
            </span>
            <h1 className="font-bold text-lg">{room.name}</h1>
            {room.current_set && <span className="text-xs text-white/50 hidden sm:inline">· {room.current_set}</span>}
          </div>
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {spectatorCount}</span>
            <span className="hidden sm:inline">Code: {room.room_code}</span>
            <button
              onClick={() => navigate(`/room/${room.room_code}/analytics`)}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300"
              title="Analytics"
            >
              <BarChart3 className="h-4 w-4" /> <span className="hidden sm:inline">Analytics</span>
            </button>
            {isHost && <span className="flex items-center gap-1 text-amber-400"><Crown className="h-4 w-4" /> Host</span>}
            {isBidder && <span className="text-emerald-400">Bidder</span>}
            {!isHost && !isBidder && <span className="text-sky-400">Spectator</span>}
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          {/* Main */}
          <div className="space-y-4">
            <PlayerCard player={currentPlayer} room={room} currentBid={room.current_bid} bidderTeam={bidderTeam} remaining={remaining} />

            {/* Bid controls */}
            {isBidder && (
              <div className="glass-strong rounded-2xl p-4">
                {canBid ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => placeBid(minNext)} disabled={bidBusy} className="bg-amber-500 hover:bg-amber-400 text-black h-12 px-6 text-base flex-1 min-w-[140px]">
                      {bidBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Gavel className="h-5 w-5 mr-2" /> Bid {formatMoney(minNext, room.currency)}</>}
                    </Button>
                    <Button onClick={() => placeBid(step2)} disabled={bidBusy || (myTeam.remaining_purse || 0) < step2} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 h-12 px-5">
                      {formatMoney(step2, room.currency)}
                    </Button>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={customBid}
                          onChange={(e) => setCustomBid(e.target.value)}
                          placeholder="Custom"
                          className="bg-white/5 border-white/10 text-white w-32 h-12"
                        />
                        <Button
                          onClick={() => placeBid(customNum)}
                          disabled={bidBusy || !customValid}
                          variant="secondary"
                          className="bg-white/10 text-white hover:bg-white/20 h-12"
                        >
                          Bid
                        </Button>
                      </div>
                      {customBid && !customValid && (
                        <p className="text-xs text-red-300">
                          {isNaN(customNum) || customNum < minNext
                            ? `Minimum is ${formatMoney(minNext, room.currency)}`
                            : customNum > (myTeam.remaining_purse || 0)
                              ? "Exceeds your purse"
                              : `Must step by ${formatMoney(increment, room.currency)}`}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-300 text-sm">
                    <AlertCircle className="h-5 w-5" />
                    {room.status !== "LIVE" ? "Auction is not live" :
                     room.timer_paused ? "Auction is paused" :
                     iAmHighBidder ? "You hold the current bid — waiting for another team" :
                     (myTeam.remaining_purse || 0) < minNext ? "Insufficient purse" :
                     "Maximum squad size reached"}
                  </div>
                )}
              </div>
            )}

            {!isBidder && !isHost && (
              <div className="glass rounded-2xl p-4 text-center text-sky-300/80 text-sm flex items-center justify-center gap-2">
                <Eye className="h-4 w-4" /> Spectator mode — watching the live auction
              </div>
            )}

            {/* Leaderboard */}
            <Leaderboard room={room} teams={teams} />

            {/* Team grid */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide text-white/60 mb-2 px-1">Teams</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {teams.map((t) => (
                  <TeamCard key={t.id} team={t} active={t.id === room.current_bidder_team_id} players={players} />
                ))}
              </div>
            </div>
          </div>

          {/* Side */}
          <div className="space-y-4 lg:max-h-[calc(100vh-120px)] flex flex-col">
            {isHost && <HostPanel room={room} players={players} joinRequests={[]} teams={teams} onAction={(a) => a === "goResults" ? onGoResults() : refresh()} />}
            <div className="flex-1 min-h-[260px]">
              <ActivityFeed events={events} />
            </div>
            {room.chat_enabled && (
              <div className="h-56">
                <ChatPanel room={room} chat={chat} user={user} displayName={displayName || myTeam?.owner_name} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}