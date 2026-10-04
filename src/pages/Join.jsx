import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye } from "lucide-react";

export default function Join() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const go = () => code.trim() && navigate(`/room/${code.trim().toUpperCase()}`);
  return (
    <div className="min-h-screen auction-bg flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md glass-strong rounded-3xl p-8 text-center">
        <Eye className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Join an Auction</h1>
        <p className="text-white/50 text-sm mt-1">Enter the room code shared by your host.</p>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="APLA26"
          className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest font-bold mt-6 h-14"
          maxLength={8}
        />
        <Button onClick={go} disabled={!code.trim()} className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-black h-12 text-base">
          Enter Room
        </Button>
      </div>
    </div>
  );
}