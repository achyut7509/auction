import { Hammer, Flame, Pause, Play, SkipForward, RotateCcw, Trophy, Gavel } from "lucide-react";

const ICONS = {
  BID_PLACED: Flame,
  PLAYER_SOLD: Hammer,
  PLAYER_UNSOLD: Gavel,
  PLAYER_SKIPPED: SkipForward,
  PLAYER_REAUCTIONED: RotateCcw,
  AUCTION_PAUSED: Pause,
  AUCTION_RESUMED: Play,
  AUCTION_STARTED: Play,
  AUCTION_COMPLETED: Trophy,
};

export default function ActivityFeed({ events }) {
  return (
    <div className="glass rounded-2xl p-4 text-white h-full flex flex-col">
      <h3 className="font-bold text-sm uppercase tracking-wide text-white/70 mb-3">Activity Feed</h3>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {events.length === 0 && (
          <p className="text-white/30 text-sm text-center py-6">No activity yet</p>
        )}
        {events.map((e) => {
          const Icon = ICONS[e.type] || Flame;
          const sold = e.type === "PLAYER_SOLD";
          return (
            <div
              key={e.id}
              className={`flex items-start gap-2 text-sm rounded-lg px-2.5 py-2 ${sold ? "bg-amber-500/15 border border-amber-500/30" : "bg-white/5"}`}
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${sold ? "text-amber-400" : "text-white/50"}`} />
              <span className={sold ? "text-amber-200 font-medium" : "text-white/80"}>{e.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}