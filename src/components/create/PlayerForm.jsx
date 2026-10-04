import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import { PLAYER_ROLES, CATEGORIES } from "@/lib/auction";
import { Plus } from "lucide-react";

export default function PlayerForm({ onAdd, defaultBase }) {
  const [p, setP] = useState({
    name: "", display_name: "", photo_url: "", country: "", role: "BATTER",
    batting_style: "", bowling_style: "", base_price: defaultBase || 500000,
    category: "A", set_name: "", age: "", jersey_number: "", description: "",
    matches: "", runs: "", average: "", strike_rate: "", wickets: "", economy: "",
  });
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));

  const submit = () => {
    if (!p.name.trim()) return;
    const stats = {};
    ["matches", "runs", "average", "strike_rate", "wickets", "economy"].forEach((k) => {
      if (p[k] !== "") stats[k] = Number(p[k]);
    });
    onAdd({
      name: p.name.trim(),
      display_name: p.display_name.trim() || p.name.trim(),
      photo_url: p.photo_url,
      country: p.country, role: p.role,
      batting_style: p.batting_style, bowling_style: p.bowling_style,
      base_price: Number(p.base_price) || 0,
      category: p.category, set_name: p.set_name,
      age: p.age ? Number(p.age) : undefined,
      jersey_number: p.jersey_number ? Number(p.jersey_number) : undefined,
      description: p.description, stats,
    });
    setP((s) => ({ ...s, name: "", display_name: "", photo_url: "", description: "" }));
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-white/70">Player Name *</Label>
          <Input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Virat Kumar" className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
        <div>
          <Label className="text-white/70">Display Name</Label>
          <Input value={p.display_name} onChange={(e) => set("display_name", e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-white/70">Country</Label>
          <Input value={p.country} onChange={(e) => set("country", e.target.value)} placeholder="India" className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
        <div>
          <Label className="text-white/70">Role</Label>
          <Select value={p.role} onValueChange={(v) => set("role", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{PLAYER_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white/70">Category</Label>
          <Select value={p.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-white/70">Batting Style</Label>
          <Input value={p.batting_style} onChange={(e) => set("batting_style", e.target.value)} placeholder="Right Hand" className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
        <div>
          <Label className="text-white/70">Bowling Style</Label>
          <Input value={p.bowling_style} onChange={(e) => set("bowling_style", e.target.value)} placeholder="Right Arm Medium" className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
        <div>
          <Label className="text-white/70">Set</Label>
          <Input value={p.set_name} onChange={(e) => set("set_name", e.target.value)} placeholder="SET 1 — MARQUEE" className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-white/70">Base Price</Label>
          <Input type="number" value={p.base_price} onChange={(e) => set("base_price", e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
        <div>
          <Label className="text-white/70">Age</Label>
          <Input type="number" value={p.age} onChange={(e) => set("age", e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
        <div>
          <Label className="text-white/70">Jersey No.</Label>
          <Input type="number" value={p.jersey_number} onChange={(e) => set("jersey_number", e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
      </div>
      <div>
        <Label className="text-white/70">Description</Label>
        <Input value={p.description} onChange={(e) => set("description", e.target.value)} placeholder="Explosive top-order batter" className="bg-white/5 border-white/10 text-white mt-1" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[["matches","M"],["runs","Runs"],["average","Avg"],["strike_rate","SR"],["wickets","Wkts"],["economy","Eco"]].map(([k,l]) => (
          <div key={k}>
            <Label className="text-white/60 text-xs">{l}</Label>
            <Input type="number" value={p[k]} onChange={(e) => set(k, e.target.value)} className="bg-white/5 border-white/10 text-white mt-1 h-9" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <ImageUpload value={p.photo_url} onChange={(v) => set("photo_url", v)} label="Player photo" size="h-16 w-16" shape="circle" />
        <Button onClick={submit} disabled={!p.name.trim()} className="bg-amber-500 hover:bg-amber-400 text-black">
          <Plus className="h-4 w-4 mr-1" /> Add Player
        </Button>
      </div>
    </div>
  );
}