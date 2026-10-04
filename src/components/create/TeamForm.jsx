import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import { Plus } from "lucide-react";

export default function TeamForm({ onAdd, defaultPurse }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState("#1e3a8a");
  const [logo, setLogo] = useState("");
  const [purse, setPurse] = useState(defaultPurse || 20000000);
  const [maxPlayers, setMaxPlayers] = useState(18);
  const [overseas, setOverseas] = useState(8);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      short_code: code.trim().toUpperCase() || name.slice(0, 3).toUpperCase(),
      color, logo_url: logo,
      starting_purse: Number(purse), remaining_purse: Number(purse),
      max_players: Number(maxPlayers), overseas_limit: Number(overseas),
      total_spent: 0, players_count: 0,
    });
    setName(""); setCode(""); setLogo("");
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-white/70">Team Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Achyut Warriors" className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
        <div>
          <Label className="text-white/70">Short Code</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="AW" maxLength={4} className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-white/70">Starting Purse</Label>
          <Input type="number" value={purse} onChange={(e) => setPurse(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
        <div>
          <Label className="text-white/70">Max Squad</Label>
          <Input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
        <div>
          <Label className="text-white/70">Overseas Limit</Label>
          <Input type="number" value={overseas} onChange={(e) => setOverseas(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ImageUpload value={logo} onChange={setLogo} label="Team logo" size="h-14 w-14" />
        <div>
          <Label className="text-white/70 block mb-1">Color</Label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded bg-transparent cursor-pointer" />
        </div>
      </div>
      <Button onClick={submit} disabled={!name.trim()} className="bg-amber-500 hover:bg-amber-400 text-black">
        <Plus className="h-4 w-4 mr-1" /> Add Team
      </Button>
    </div>
  );
}