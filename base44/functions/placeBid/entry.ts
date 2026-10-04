import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { formatMoney } from "../../shared/auction.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { room_id, team_id, amount, bidder_id } = body || {};
    if (!room_id || !team_id || !amount || !bidder_id)
      return Response.json({ error: "Missing fields" }, { status: 400 });

    // The bidder is identified by their approved join request. This covers
    // both signed-in users and guests (guests carry a stable local id).
    const requests = await base44.entities.JoinRequest.filter({
      room_id,
      user_id: bidder_id,
      status: "APPROVED",
      role: "BIDDER",
    });
    if (!requests.length)
      return Response.json({ error: "You are not approved to bid" }, { status: 403 });
    const jr = requests[0];
    if (jr.team_id !== team_id)
      return Response.json({ error: "This team is not assigned to you" }, { status: 403 });

    const room = await base44.entities.Room.get(room_id);
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    if (room.status !== "LIVE")
      return Response.json({ error: "Auction is not live" }, { status: 400 });
    if (room.timer_paused)
      return Response.json({ error: "Auction is paused" }, { status: 400 });

    const team = await base44.entities.Team.get(team_id);
    if (!team || team.room_id !== room_id)
      return Response.json({ error: "Invalid team" }, { status: 400 });

    // A bidder cannot bid twice in a row: if they are already the current high
    // bidder, they must wait for someone else to bid before bidding again.
    if (room.current_bidder_user_id && room.current_bidder_user_id === bidder_id)
      return Response.json(
        { error: "You placed the current bid — wait for another team to bid" },
        { status: 400 }
      );

    if (!room.current_player_id)
      return Response.json({ error: "No active player" }, { status: 400 });
    const player = await base44.entities.Player.get(room.current_player_id);
    if (!player || player.status !== "CURRENT")
      return Response.json({ error: "Player not active" }, { status: 400 });

    const hasBidder = !!room.current_bidder_team_id;
    const increment = room.bid_increment || 0;
    const minNext = hasBidder
      ? (room.current_bid || 0) + increment
      : room.current_bid || 0;
    if (amount < minNext)
      return Response.json(
        { error: "Bid too low. Minimum is " + formatMoney(minNext, room.currency) },
        { status: 400 }
      );
    // Enforce the increment rule: every bid must step exactly by the configured
    // increment above the current bid, so amounts like base+100 are rejected.
    if (increment > 0 && (amount - minNext) % increment !== 0)
      return Response.json(
        {
          error:
            "Bid must follow the increment of " +
            formatMoney(increment, room.currency) +
            ". Minimum is " +
            formatMoney(minNext, room.currency),
        },
        { status: 400 }
      );

    if ((team.remaining_purse || 0) < amount)
      return Response.json({ error: "Insufficient purse" }, { status: 400 });

    if ((team.players_count || 0) >= team.max_players)
      return Response.json({ error: "Maximum squad size reached" }, { status: 400 });

    // Reset the full timer only because a bid was placed.
    const deadline = new Date(
      Date.now() + (room.timer_seconds || 10) * 1000
    ).toISOString();
    await base44.entities.Room.update(room_id, {
      current_bid: amount,
      current_bidder_team_id: team_id,
      current_bidder_user_id: bidder_id,
      timer_deadline: deadline,
    });
    await base44.entities.Bid.create({
      room_id,
      player_id: player.id,
      team_id,
      user_id: bidder_id,
      amount,
    });
    await base44.entities.AuctionEvent.create({
      room_id,
      type: "BID_PLACED",
      description: `${jr.display_name} bid ${formatMoney(amount, room.currency)} for ${player.name}`,
      data: { amount, team_id, player_id: player.id },
    });

    return Response.json({ ok: true, current_bid: amount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}