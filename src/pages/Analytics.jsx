import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/lib/useRoom";
import { formatMoney } from "@/lib/auction";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { ChevronLeft, Loader2, BarChart3, TrendingUp, Wallet, Gavel } from "lucide-react";

export default function Analytics() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { room, teams, players, bids, loading, error } = useRoom(roomCode);

  const teamSpend = useMemo(() =>
    teams.map((t) => ({
      name: t.short_code || t.name,
      Spent: t.total_spent || 0,
      Remaining: t.remaining_purse || 0,
      color: t.color || "#1e3a8a",
    })), [teams]);

  const bidsPerTeam = useMemo(() =>
    teams
      .map((t) => ({
        name: t.short_code || t.name,
        bids: bids.filter((b) => b.team_id === t.id).length,
        color: t.color || "#1e3a8a",
      }))
      .filter((x) => x.bids > 0), [teams, bids]);

  const bidBuckets = useMemo(() => {
    if (!bids.length) return [];
    const amounts = bids.map((b) => b.amount || 0);
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    const range = max - min || 1;
    const n = Math.min(6, new Set(amounts).size);
    const step = Math.ceil(range / n);
    const buckets = {};
    for (const a of amounts) {
      const lo = min + Math.floor((a - min) / step) * step;
      const key = `${formatMoney(lo, room?.currency)}+`;
      buckets[key] = (buckets[key] || 0) + 1;
    }
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [bids, room?.currency]);

  const stats = useMemo(() => ({
    totalBids: bids.length,
    totalSpent: teams.reduce((s, t) => s + (t.total_spent || 0), 0),
    sold: players.filter((p) => p.status === "SOLD").length,
    highest: players.filter((p) => p.status === "SOLD").reduce((m, p) => Math.max(m, p.sold_price || 0), 0),
  }), [bids, teams, players]);

  if (loading)
    return (
      <div className="min-h-screen auction-bg flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  if (error || !room)
    return (
      <div className="min-h-screen auction-bg flex flex-col items-center justify-center text-white gap-3">
        <p className="text-white/60">{error || "Room not found"}</p>
        <Button variant="ghost" className="text-white/70" onClick={() => navigate("/")}>Home</Button>
      </div>
    );

  const tooltipStyle = { backgroundColor: "rgba(10,15,31,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff" };

  return (
    <div className="min-h-screen auction-bg text-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        <header className="glass-strong rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <BarChart3 className="h-4 w-4" /> ANALYTICS · {room.room_code}
            </div>
            <h1 className="text-2xl font-bold mt-1">{room.name}</h1>
            <p className="text-white/50 text-sm">Live auction analytics</p>
          </div>
          <Button onClick={() => navigate(`/room/${room.room_code}`)} className="bg-amber-500 hover:bg-amber-400 text-black">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Auction
          </Button>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat icon={Gavel} label="Total Bids" value={stats.totalBids} />
          <Stat icon={TrendingUp} label="Total Spent" value={formatMoney(stats.totalSpent, room.currency)} />
          <Stat icon={Wallet} label="Players Sold" value={stats.sold} />
          <Stat icon={BarChart3} label="Top Sale" value={formatMoney(stats.highest, room.currency)} />
        </div>

        {/* Team spending vs remaining */}
        <section className="glass-strong rounded-2xl p-4">
          <h2 className="font-bold mb-3">Spent vs Remaining Purse (per team)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamSpend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis tickFormatter={(v) => formatMoney(v, room.currency)} stroke="rgba(255,255,255,0.5)" fontSize={10} width={70} />
                <Tooltip formatter={(v) => formatMoney(v, room.currency)} contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Remaining" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Bid distribution (by team) */}
          <section className="glass-strong rounded-2xl p-4">
            <h2 className="font-bold mb-3">Bids by Team</h2>
            {bidsPerTeam.length === 0 ? (
              <p className="text-white/30 text-sm py-10 text-center">No bids yet</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bidsPerTeam} dataKey="bids" nameKey="name" outerRadius={80} label={(e) => `${e.name} (${e.bids})`} fontSize={11}>
                      {bidsPerTeam.map((t, i) => <Cell key={i} fill={t.color} stroke="rgba(0,0,0,0.3)" />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Bid amount distribution */}
          <section className="glass-strong rounded-2xl p-4">
            <h2 className="font-bold mb-3">Bid Amount Distribution</h2>
            {bidBuckets.length === 0 ? (
              <p className="text-white/30 text-sm py-10 text-center">No bids yet</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bidBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="range" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                    <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.5)" fontSize={10} width={30} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1 text-white/50 text-xs mb-1"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="text-lg font-bold text-amber-400">{value}</div>
    </div>
  );
}