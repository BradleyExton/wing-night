import type { Server } from "socket.io";

// PROTOTYPE — throwaway, deleted with the client's RunGunLab when the run-and-gun game
// (docs/minigames/base-borden-spec.md §0.7 step 7) ships or is dropped. A namespace of its own, so none of
// the room's seats, tokens or typed events are in reach of it: a phone pad says what its thumbs
// are doing, the yard on the TV hears it, and the TV's acknowledgement goes back to that one pad
// so it can time the round trip. The server relays and nothing else — the yard page runs the sim.
export const PROTO_RUNGUN_PAD_NAMESPACE = "/proto-rungun-pad";

const TV_ROOM = "tv";

const resolvePadRoom = (padId: string): string => `pad:${padId}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const attachProtoRunGunPadRelay = (socketServer: Server): void => {
  const namespace = socketServer.of(PROTO_RUNGUN_PAD_NAMESPACE);

  namespace.on("connection", (socket) => {
    const auth: unknown = socket.handshake.auth;
    const isTv = isRecord(auth) && auth.role === "tv";

    if (isTv) {
      void socket.join(TV_ROOM);

      socket.on("tv:ack", (payload: unknown) => {
        if (isRecord(payload) && typeof payload.padId === "string") {
          namespace.to(resolvePadRoom(payload.padId)).emit("tv:ack", payload);
        }
      });

      return;
    }

    const padId = isRecord(auth) && typeof auth.padId === "string" ? auth.padId : socket.id;

    void socket.join(resolvePadRoom(padId));

    socket.on("pad:state", (payload: unknown) => {
      if (isRecord(payload)) {
        namespace.to(TV_ROOM).emit("pad:state", { ...payload, padId });
      }
    });

    socket.on("disconnect", () => {
      namespace.to(TV_ROOM).emit("pad:gone", { padId });
    });
  });
};
