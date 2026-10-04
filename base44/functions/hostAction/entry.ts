import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { advanceToNextPlayer, formatMoney } from "../../shared/auction.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { room_id, action, payload } = body || {};
    if (!room_id || !action)
      return Response.json({ error: "Missing fields" }, { status: 400 });

    const room = await base44.entities.Room.get(room_id);
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    if (room.created_by_id !== user.id)
      return Response.json({ error: "Only the host can perform this action" }, { status: 403 });

    switch (action) {
      case "start": {
        const avail = await base44.entities.Player.filter(
          { room_id, status: "AVAILABLE" },
          "order_index",
          500
        );
        if (!avail.length)
          return Response.json({ error: "No players to auction" }, { status: 400 });
        // Shuffle the bidding order so players are randomly picked.
        const shuffled = [...avail];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        await base44.entities.Player.bulkUpdate(
          shuffled.map((p, i) => ({ id: p.id, order_index: i }))
        );
        await base44.entities.AuctionEvent.create({
          room_id,
          type: "PLAYERS_SHUFFLED",
          description: `Bidding order shuffled (${shuffled.length} players)`,
        });
        await base44.entities.Room.update(room_id, { status: "LIVE" });
        const fresh = await base44.entities.Room.get(room_id);
        const result = await advanceToNextPlayer(base44, fresh);
        await base44.entities.AuctionEvent.create({
          room_id,
          type: "AUCTION_STARTED",
          description: "Auction started",
        });
        return Response.json({ ok: true, ...result });
      }
      case "pause": {
        await base44.entities.Room.update(room_id, { timer_paused: true, status: "PAUSED" });
        await base44.entities.AuctionEvent.create({
          room_id,
          type: "AUCTION_PAUSED",
          description: "Auction paused",
        });
        return Response.json({ ok: true });
      }
      case "resume": {
        const r = await base44.entities.Room.get(room_id);
        const deadline = new Date(
          Date.now() + (r.timer_seconds || 10) * 1000
        ).toISOString();
        await base44.entities.Room.update(room_id, {
          timer_paused: false,
          status: "LIVE",
          timer_deadline: r.timer_deadline || deadline,
        });
        await base44.entities.AuctionEvent.create({
          room_id,
          type: "AUCTION_RESUMED",
          description: "Auction resumed",
        });
        return Response.json({ ok: true });
      }
      case "sold": {
        if (!room.current_player_id)
          return Response.json({ error: "No active player" }, { status: 400 });
        if (!room.current_bidder_team_id)
          return Response.json({ error: "No current bidder" }, { status: 400 });
        const player = await base44.entities.Player.get(room.current_player_id);
        // A timer-expiry call may arrive from several clients at once. Only
        // let the first one through — if this player is no longer CURRENT,
        // someone already sold/advanced it, so this call is a no-op.
        if (!player || player.status !== "CURRENT")
          return Response.json({ ok: true, alreadyAdvanced: true });
        const team = await base44.entities.Team.get(room.current_bidder_team_id);
        const price = room.current_bid || 0;
        await base44.entities.Player.update(player.id, {
          status: "SOLD",
          sold_to_team_id: team.id,
          sold_price: price,
        });
        await base44.entities.Team.update(team.id, {
          remaining_purse: (team.remaining_purse || 0) - price,
          total_spent: (team.total_spent || 0) + price,
          players_count: (team.players_count || 0) + 1,
        });
        await base44.entities.AuctionEvent.create({
          room_id,
          type: "PLAYER_SOLD",
          description: `SOLD! ${player.name} → ${team.name} for ${formatMoney(price, room.currency)}`,
          data: { player_id: player.id, team_id: team.id, price },
        });
        const fresh = await base44.entities.Room.get(room_id);
        const result = await advanceToNextPlayer(base44, fresh);
        return Response.json({ ok: true, ...result });
      }
      case "unsold": {
        if (!room.current_player_id)
          return Response.json({ error: "No active player" }, { status: 400 });
        const player = await base44.entities.Player.get(room.current_player_id);
        // Timer-expiry dedup — see "sold".
        if (!player || player.status !== "CURRENT")
          return Response.json({ ok: true, alreadyAdvanced: true });
        await base44.entities.Player.update(player.id, { status: "UNSOLD" });
        await base44.entities.AuctionEvent.create({
          room_id,
          type: "PLAYER_UNSOLD",
          description: `${player.name} went UNSOLD`,
        });
        const fresh = await base44.entities.Room.get(room_id);
        const result = await advanceToNextPlayer(base44, fresh);
        return Response.json({ ok: true, ...result });
      }
      case "skip": {
        if (!room.current_player_id)
          return Response.json({ error: "No active player" }, { status: 400 });
        const player = await base44.entities.Player.get(room.current_player_id);
        // Timer-expiry dedup — see "sold".
        if (!player || player.status !== "CURRENT")
          return Response.json({ ok: true, alreadyAdvanced: true });
        await base44.entities.Player.update(player.id, { status: "SKIPPED" });
        await base44.entities.AuctionEvent.create({
          room_id,
          type: "PLAYER_SKIPPED",
          description: `${player.name} skipped`,
        });
        const fresh = await base44.entities.Room.get(room_id);
        const result = await advanceToNextPlayer(base44, fresh);
        return Response.json({ ok: true, ...result });
      }
      case "end": {
        await base44.entities.Room.update(room_id, { status: "COMPLETED" });
        await base44.entities.AuctionEvent.create({
          room_id,
          type: "AUCTION_COMPLETED",
          description: "Auction completed",
        });
        return Response.json({ ok: true });
      }
      case "reauction": {
        const { player_id } = payload || {};
        if (!player_id)
          return Response.json({ error: "Missing player_id" }, { status: 400 });
        const p = await base44.entities.Player.get(player_id);
        if (p.status === "SOLD") {
          const t = await base44.entities.Team.get(p.sold_to_team_id);
          if (t) {
            await base44.entities.Team.update(t.id, {
              remaining_purse: (t.remaining_purse || 0) + (p.sold_price || 0),
              total_spent: (t.total_spent || 0) - (p.sold_price || 0),
              players_count: Math.max(0, (t.players_count || 0) - 1),
            });
          }
        }
        await base44.entities.Player.update(player_id, {
          status: "AVAILABLE",
          sold_to_team_id: "",
          sold_price: 0,
        });
        await base44.entities.AuctionEvent.create({
          room_id,
          type: "PLAYER_REAUCTIONED",
          description: `${p.name} re-auctioned`,
        });
        return Response.json({ ok: true });
      }
      case "resetTimer": {
        const deadline = new Date(
          Date.now() + (room.timer_seconds || 10) * 1000
        ).toISOString();
        await base44.entities.Room.update(room_id, { timer_deadline: deadline });
        return Response.json({ ok: true });
      }
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}