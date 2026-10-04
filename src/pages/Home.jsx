import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Zap, Users, Trophy, Wallet, Target, Eye, Timer, BarChart3, ArrowRight,
} from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "Real-Time Bidding", desc: "Live bids sync instantly across every device." },
  { icon: Users, title: "Host Control", desc: "Approve bidders, assign teams, run the room." },
  { icon: Trophy, title: "Custom Players", desc: "Upload your own players, photos, stats & sets." },
  { icon: Wallet, title: "Custom Purse", desc: "Set currency, purse, base bids and increments." },
  { icon: Target, title: "Custom Teams", desc: "Create unlimited teams with colors and logos." },
  { icon: Eye, title: "Spectator Mode", desc: "Anyone can watch the live auction unfold." },
  { icon: Timer, title: "Auction Timer", desc: "Auto countdown with reset on every bid." },
  { icon: BarChart3, title: "Live Squad Tracking", desc: "Purse and squads update in real time." },
];

export default function Home() {
  return (
    <div className="min-h-screen auction-bg text-white">
      <div className="stadium-grid">
        <header className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-black" />
            </div>
            AuctionArena
          </div>
          <Link to="/join"><Button variant="ghost" className="text-white/70 hover:text-white">Join Auction</Button></Link>
        </header>

        <section className="max-w-4xl mx-auto px-5 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-amber-300 text-xs font-semibold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> LIVE MULTIPLAYER CRICKET AUCTION
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
            CUSTOM CRICKET <span className="text-amber-400 text-glow">AUCTION</span>
          </h1>
          <p className="text-xl sm:text-2xl font-semibold mt-4 text-white/90">Create. Bid. Build Your Squad.</p>
          <p className="text-white/55 mt-4 max-w-2xl mx-auto">
            Create your own auction, upload your own players, invite your friends, control who can bid, and run your auction in real time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link to="/create"><Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black px-8 text-base h-12">CREATE AUCTION <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
            <Link to="/join"><Button size="lg" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 px-8 text-base h-12">JOIN AUCTION</Button></Link>
            <Link to="/watch"><Button size="lg" variant="ghost" className="text-white/70 hover:text-white px-8 text-base h-12"><Eye className="h-4 w-4 mr-2" />WATCH LIVE</Button></Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 pb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-5 hover:ring-glow transition">
                <f.icon className="h-7 w-7 text-amber-400 mb-3" />
                <div className="font-bold">{f.title}</div>
                <div className="text-sm text-white/50 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="max-w-6xl mx-auto px-5 py-8 text-center text-white/30 text-sm">
          Built for hosts who run their own leagues. Server-validated bids · Real-time sync.
        </footer>
      </div>
    </div>
  );
}