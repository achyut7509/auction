import { formatMoney } from "@/lib/auction";
import { Image } from "@/components/ui/image";
import { MapPin, User } from "lucide-react";

export default function PlayerCard({ player, room, currentBid, bidderTeam, remaining }) {
  if (!player) {
    return (
      <div className="glass rounded-3xl p-10 text-center text-white/40">
        No player active
      </div>
    );
  }
  const urgent = remaining <= 5;
  return (
    <div className="glass-strong rounded-3xl overflow-hidden text-white">
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-slate-800 to-slate-900 stadium-grid">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            fittingType="fill"
            className="h-full w-full object-cover opacity-90"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <User className="h-24 w-24 text-white/15" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {player.category && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-black">
              CAT {player.category}
            </span>
          )}
          {player.set_name && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold glass text-white/80">
              {player.set_name}
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{player.name}</h2>
          <div className="flex items-center gap-3 text-white/70 text-sm mt-1 flex-wrap">
            {player.country && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{player.country}</span>}
            {player.role && <span className="px-2 py-0.5 rounded bg-white/10">{player.role}</span>}
            {player.batting_style && <span>{player.batting_style}</span>}
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Base Price" value={formatMoney(player.base_price, room.currency)} />
        <Stat label="Current Bid" value={formatMoney(currentBid, room.currency)} accent />
        <Stat
          label="Current Bidder"
          value={bidderTeam ? bidderTeam.name : "—"}
          accent={!!bidderTeam}
        />
        <div className="rounded-2xl glass p-3 text-center">
          <div className="text-xs text-white/50 uppercase tracking-wide">Timer</div>
          <div
            className={`text-3xl font-black tabular-nums ${urgent ? "text-red-400 animate-pulse" : "text-amber-400"}`}
          >
            {Math.max(0, Math.ceil(remaining))}
          </div>
        </div>
      </div>
      {player.description && (
        <p className="px-5 pb-4 text-white/50 text-sm italic">"{player.description}"</p>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-2xl glass p-3">
      <div className="text-xs text-white/50 uppercase tracking-wide">{label}</div>
      <div className={`text-lg font-bold ${accent ? "text-amber-400" : "text-white"}`}>{value}</div>
    </div>
  );
}