import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { getGuestId } from "@/lib/guest";

export function useRoom(roomCode) {
  const [room, setRoom] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [bids, setBids] = useState([]);
  const [chat, setChat] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadToken = useRef(0);

  // Small delay before retrying a rate-limited request.
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Runs one query; retries briefly on transient rate-limit errors.
  const runQuery = async (fn) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await fn();
      } catch (e) {
        const limited =
          /rate.?limit/i.test(String(e?.message || e)) ||
          /429/i.test(String(e?.status || e?.code || ""));
        if (!limited || attempt >= 2) throw e;
        await sleep(300 * (attempt + 1));
      }
    }
  };

  // Chained queue: if a reload is already running, wait for it and skip — the
  // newest data lands on the next tick anyway, so concurrent reloads just
  // collapse into one, avoiding API bursts.
  let reloadChain = Promise.resolve();

  const loadAll = async (rid, token) => {
    const run = () =>
      Promise.all([
        runQuery(() => base44.entities.Team.filter({ room_id: rid })),
        runQuery(() => base44.entities.Player.filter({ room_id: rid }, "order_index", 500)),
        runQuery(() => base44.entities.JoinRequest.filter({ room_id: rid })),
        runQuery(() => base44.entities.AuctionEvent.filter({ room_id: rid }, "-created_date", 200)),
        runQuery(() => base44.entities.Bid.filter({ room_id: rid }, "-created_date", 200)),
        runQuery(() => base44.entities.ChatMessage.filter({ room_id: rid }, "-created_date", 100)),
      ]).then(([t, p, jr, ev, bd, ch]) => {
        if (token !== loadToken.current) return;
        setTeams(t);
        setPlayers(p);
        setJoinRequests(jr);
        setEvents(ev);
        setBids(bd);
        setChat(ch);
      });
    // Collapse overlapping reloads onto the in-flight one.
    const next = reloadChain.then(run);
    reloadChain = next.catch(() => {});
    return next;
  };

  useEffect(() => {
    let active = true;
    loadToken.current++;
    const myToken = loadToken.current;
    (async () => {
      try {
        const u = await base44.auth.me().catch(() => null);
        if (!active) return;
        setUser(u);
        const rooms = await base44.entities.Room.filter({ room_code: roomCode });
        if (!active) return;
        if (!rooms.length) {
          setError("Room not found");
          setLoading(false);
          return;
        }
        const r = rooms[0];
        setRoom(r);
        await loadAll(r.id, myToken);
        setLoading(false);
      } catch (e) {
        setError(e.message || "Failed to load room");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  useEffect(() => {
    if (!room?.id) return;
    const rid = room.id;
    // Apply subscription events directly to state instead of refetching
    // everything on every change — a single bid writes several records, and a
    // full reload per event snowballs into a rate-limit storm after a few
    // bids. Teams/players/joinRequests/chat/events only change on discrete
    // actions, so a targeted update (or a light refetch for lists that can
    // add rows) keeps the app responsive.
    const upsert = (setter) => (e) => {
      const d = e.data;
      if (!d) return;
      if (d.room_id && d.room_id !== rid) return;
      if (d.id && d.id === rid) { /* room handled separately */ }
      if (e.type === "delete") {
        setter((arr) => arr.filter((x) => x.id !== d.id));
      } else {
        setter((arr) => {
          const i = arr.findIndex((x) => x.id === d.id);
          if (i === -1) return [...arr, d];
          const next = arr.slice();
          next[i] = { ...arr[i], ...d };
          return next;
        });
      }
    };
    const roomSub = base44.entities.Room.subscribe((e) => {
      if (e.data?.id === rid) setRoom((prev) => (prev ? { ...prev, ...e.data } : e.data));
    });
    // Bids & events are high-frequency during bidding; they don't drive the
    // main UI lists, so skip them. The room subscription above already carries
    // current_bid / current_bidder / timer_deadline updates.
    const subs = [
      roomSub,
      base44.entities.Team.subscribe(upsert(setTeams)),
      base44.entities.Player.subscribe(upsert(setPlayers)),
      base44.entities.JoinRequest.subscribe(upsert(setJoinRequests)),
      base44.entities.ChatMessage.subscribe(upsert(setChat)),
      base44.entities.AuctionEvent.subscribe(upsert(setEvents)),
      base44.entities.Bid.subscribe(upsert(setBids)),
    ];
    return () => {
      subs.forEach((u) => u && u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id]);

  return {
    room, teams, players, joinRequests, events, bids, chat, user,
    identityId: user?.id || getGuestId(),
    loading, error,
    refresh: () => loadAll(room?.id, loadToken.current),
  };
}