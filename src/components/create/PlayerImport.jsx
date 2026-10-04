import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { parseCsv, downloadTemplate, PLAYER_TEMPLATE_HEADERS } from "@/lib/auction";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export default function PlayerImport({ onImport }) {
  const inputRef = useRef(null);
  const [report, setReport] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    const idx = (h) => headers.findIndex((x) => x.toLowerCase() === h.toLowerCase());
    const nameI = idx("player_name");
    if (nameI < 0) {
      setReport({ error: "Missing player_name column" });
      return;
    }
    const seen = new Set();
    let ok = 0, missingPrice = 0, dup = 0;
    const players = [];
    rows.forEach((r) => {
      const name = (r[nameI] || "").trim();
      if (!name) return;
      if (seen.has(name.toLowerCase())) { dup++; return; }
      seen.add(name.toLowerCase());
      const get = (h) => idx(h) >= 0 ? (r[idx(h)] || "").trim() : "";
      const base = Number(get("base_price")) || 0;
      if (!base) missingPrice++;
      const stats = {};
      ["matches","runs","average","strike_rate","wickets","economy"].forEach((k) => {
        const v = get(k); if (v) stats[k] = Number(v);
      });
      players.push({
        name, display_name: get("display_name") || name,
        photo_url: get("photo_url"), country: get("country"),
        role: get("role") || "BATTER",
        batting_style: get("batting_style"), bowling_style: get("bowling_style"),
        base_price: base, category: get("category") || "A",
        set_name: get("set"), age: get("age") ? Number(get("age")) : undefined,
        description: get("description"), stats,
      });
      ok++;
    });
    setReport({ ok, missingPrice, dup, total: players.length });
    if (players.length) onImport(players);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={downloadTemplate} className="bg-white/10 text-white hover:bg-white/20">
          <Download className="h-4 w-4 mr-2" /> Template
        </Button>
        <Button onClick={() => inputRef.current?.click()} className="bg-amber-500 hover:bg-amber-400 text-black">
          <Upload className="h-4 w-4 mr-2" /> Import CSV
        </Button>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        <span className="text-xs text-white/40 flex items-center gap-1"><FileSpreadsheet className="h-3.5 w-3.5" /> Columns: {PLAYER_TEMPLATE_HEADERS.join(", ")}</span>
      </div>
      {report?.error && (
        <div className="flex items-center gap-2 text-red-300 text-sm"><XCircle className="h-4 w-4" /> {report.error}</div>
      )}
      {report && !report.error && (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {report.ok} players imported</div>
          {report.missingPrice > 0 && <div className="flex items-center gap-2 text-amber-300"><AlertTriangle className="h-4 w-4" /> {report.missingPrice} with missing base price (set to 0)</div>}
          {report.dup > 0 && <div className="flex items-center gap-2 text-red-300"><XCircle className="h-4 w-4" /> {report.dup} duplicate names skipped</div>}
        </div>
      )}
    </div>
  );
}