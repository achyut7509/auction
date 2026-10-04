function trimNum(n) {
    const r = Math.round(n * 100) / 100;
    return (r % 1 === 0 ? r.toString() : r.toFixed(2)).replace(/\.00$/, "");
  }
  
  export function formatMoney(amount, currency) {
    currency = currency || "₹";
    if (amount == null || isNaN(amount)) return currency + "0";
    if (currency === "₹") {
      if (amount >= 10000000) return "₹" + trimNum(amount / 10000000) + " Cr";
      if (amount >= 100000) return "₹" + trimNum(amount / 100000) + " L";
      return "₹" + Number(amount).toLocaleString("en-IN");
    }
    return currency + Number(amount).toLocaleString();
  }
  
  export function genRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  
  export const PLAYER_ROLES = ["BATTER", "BOWLER", "ALL-ROUNDER", "WICKETKEEPER", "CUSTOM"];
  export const CATEGORIES = ["A", "B", "C", "D"];
  
  export const PLAYER_TEMPLATE_HEADERS = [
    "player_name", "display_name", "photo_url", "country", "role",
    "batting_style", "bowling_style", "base_price", "category", "set",
    "age", "description", "matches", "runs", "average", "strike_rate",
    "wickets", "economy",
  ];
  
  export function downloadTemplate() {
    const csv = PLAYER_TEMPLATE_HEADERS.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "players_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  
  // Build a CSV string from headers + rows and trigger a download.
  function downloadCsv(filename, headers, rows) {
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  // Export each team's squad and remaining purse as a spreadsheet (CSV) file.
  export function exportAuctionResults(room, teams, players) {
    const headers = [
      "Team", "Short Code", "Owner", "Starting Purse", "Total Spent",
      "Remaining Purse", "Players Count", "Player Name", "Player Role",
      "Base Price", "Sold Price", "Player Status",
    ];
    const rows = [];
    for (const t of teams) {
      const squad = players.filter((p) => p.sold_to_team_id === t.id);
      if (!squad.length) {
        rows.push([t.name, t.short_code, t.owner_name || "", t.starting_purse || 0,
          t.total_spent || 0, t.remaining_purse || 0, t.players_count || 0,
          "", "", "", "", ""]);
        continue;
      }
      for (const p of squad) {
        rows.push([t.name, t.short_code, t.owner_name || "", t.starting_purse || 0,
          t.total_spent || 0, t.remaining_purse || 0, t.players_count || 0,
          p.name, p.role || "", p.base_price || 0, p.sold_price || 0, p.status]);
      }
    }
    const safe = (room?.name || "auction").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    downloadCsv(`${safe}_results.csv`, headers, rows);
  }
  
  export function parseCsv(text) {
    const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
    if (!lines.length) return { headers: [], rows: [] };
    const splitLine = (line) => {
      const out = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (c === "," && !inQ) {
          out.push(cur); cur = "";
        } else cur += c;
      }
      out.push(cur);
      return out.map((s) => s.trim());
    };
    const headers = splitLine(lines[0]);
    const rows = lines.slice(1).map(splitLine);
    return { headers, rows };
  }