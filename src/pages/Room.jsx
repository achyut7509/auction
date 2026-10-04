import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useRoom } from "@/lib/useRoom";
import { Button } from "@/components/ui/button";
import JoinScreen from "@/components/room/JoinScreen";
import Lobby from "@/components/room/Lobby";
import LiveAuction from "@/components/room/LiveAuction";
import Results from "./Results";
import { Loader2, Trophy, Ban, Clock } from "lucide-react";

export default function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { room, teams, players, joinRequests, events, chat, user, identityId, loading, error, refresh } = useRoom(roomCode);

  if (loading)
    return (
      <div className="min-h-screen auction-bg flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );

  if (error || !room)
    return (
      <div className="min-h-screen auction-bg flex flex-col items-center justify-center text-white gap-3 p-4">
        <Trophy className="h-10 w-10 text-white/30" />
        <p className="text-white/60">{error || "Room not found"}</p>
        <Button variant="ghost" className="text-white/70" onClick={() => navigate("/join")}>Back to Join</Button>
      </div>
    );

  const isHost = !!user && room.created_by_id === user.id;
  const myRequest = joinRequests.find((j) => j.user_id === identityId);
  const spectatorCount = joinRequests.filter((j) => j.role === "SPECTATOR").length;

  const startAuction = async () => {
    const res = await base44.functions.invoke("hostAction", { room_id: room.id, action: "start" });
    if (res.data?.error) alert(res.data.error);
    refresh();
  };
  const goResults = () => navigate(`/room/${room.room_code}/results`);

  if (room.status === "COMPLETED")
    return <Results room={room} teams={teams} players={players} events={events} onBack={() => navigate("/")} />;

  if (isHost) {
    if (room.status === "LOBBY")
      return <Lobby room={room} teams={teams} joinRequests={joinRequests} players={players} user={user} isHost onStart={startAuction} onGoResults={goResults} onManageTeams={() => navigate(`/room/${room.room_code}/teams`)} />;
    return (
      <LiveAuction
        room={room} teams={teams} players={players} events={events} chat={chat}
        user={user} role="host" myTeam={null}
        spectatorCount={spectatorCount} onGoResults={goResults} refresh={refresh}
      />
    );
  }

  if (!myRequest)
    return <JoinScreen room={room} teams={teams} user={user} />;

  if (myRequest.status === "BANNED")
    return (
      <CenterNotice
        icon={Ban} title="You've been removed"
        msg="The host has removed you from this room. You can request to join again."
        action={
          <Button onClick={() => base44.entities.JoinRequest.delete(myRequest.id).then(refresh)} className="bg-amber-500 hover:bg-amber-400 text-black">
            Request to Join Again
          </Button>
        }
      />
    );

  if (myRequest.status === "PENDING")
    return <CenterNotice icon={Clock} title="Waiting for host approval" msg={`Your request to play${myRequest.requested_team ? " (" + myRequest.requested_team + ")" : ""} was sent. You'll join as soon as the host approves you.`} />;

  const myTeam = teams.find((t) => t.id === myRequest.team_id);
  const role = myRequest.role === "SPECTATOR" ? "spectator" : "bidder";
  const displayName = myTeam?.owner_name || myRequest.display_name;

  if (room.status === "LOBBY")
    return <Lobby room={room} teams={teams} joinRequests={joinRequests} players={players} user={user} isHost={false} onStart={() => {}} onGoResults={goResults} onManageTeams={() => navigate(`/room/${room.room_code}/teams`)} />;

  return (
    <LiveAuction
      room={room} teams={teams} players={players} events={events} chat={chat}
      user={user} role={role} myTeam={myTeam} displayName={displayName} identityId={identityId}
      spectatorCount={spectatorCount} onGoResults={goResults} refresh={refresh}
    />
  );
}

function CenterNotice({ icon: Icon, title, msg, action }) {
  return (
    <div className="min-h-screen auction-bg flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
      <Icon className="h-10 w-10 text-amber-400" />
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-white/55 max-w-sm text-sm">{msg}</p>
      {action}
    </div>
  );
}