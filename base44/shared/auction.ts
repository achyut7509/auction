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
  
  export async function advanceToNextPlayer(base44, room) {
    const players = await base44.entities.Player.filter(
      { room_id: room.id, status: "AVAILABLE" },
      "order_index",
      500
    );
    const next = players[0];
    if (next) {
      await base44.entities.Player.update(next.id, { status: "CURRENT" });
      const deadline = new Date(Date.now() + (room.timer_seconds || 10) * 1000).toISOString();
      const updated = await base44.entities.Room.update(room.id, {
        current_player_id: next.id,
        current_bid: next.base_price || 0,
        current_bidder_team_id: "",
        current_bidder_user_id: "",
        current_set: next.set_name || "",
        timer_deadline: deadline,
        timer_paused: false
      });
      return { room: updated, player: next, completed: false };
    }
    const updated = await base44.entities.Room.update(room.id, {
      current_player_id: "",
      current_bid: 0,
      current_bidder_team_id: "",
      current_bidder_user_id: "",
      status: "COMPLETED",
      timer_deadline: ""
    });
    return { room: updated, player: null, completed: true };
  }