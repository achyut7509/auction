import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Eye, Trophy, Loader2 } from "lucide-react";

export default function Watch() {
  const [rooms, setRooms] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.Room.filter({}, "-created_date", 50);
        setRooms(all.filter((r) => r.privacy === "PUBLIC"));
      } catch {
        setRooms([]);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen auction-bg text-white p-5">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Eye className="h-7 w-7 text-amber-400" /> Live Auctions</h1>
        <p className="text-white/50 mt-1">Jump into any public auction as a spectator.</p>
        {!rooms && <div className="py-16 text-center text-white/40"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
        {rooms && rooms.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-white/40 mt-6">No public auctions right now.</div>
        )}
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {rooms?.map((r) => (
            <Link key={r.id} to={`/room/${r.room_code}`} className="glass rounded-2xl p-5 hover:ring-glow transition text-left">
              <div className="flex items-center gap-3">
                {r.logo_url ? <img src={r.logo_url} className="h-12 w-12 rounded-xl object-cover" alt="" /> :
                  <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center"><Trophy className="h-6 w-6 text-amber-400" /></div>}
                <div>
                  <div className="font-bold">{r.name}</div>
                  <div className="text-xs text-white/50">Host: {r.host_name} · {r.status}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-white/40">Code: {r.room_code}</div>
            </Link>
          ))}
        </div>
        <Link to="/" className="text-white/50 hover:text-white text-sm inline-block mt-6">← Back home</Link>
      </div>
    </div>
  );
}