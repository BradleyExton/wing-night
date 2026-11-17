import { io, type Socket } from "socket.io-client";

import { resolveServerOrigin } from "../../../utils/resolveServerOrigin";
import type { StickDir } from "../yardSim";

// PROTOTYPE — throwaway. The wire between a phone pad and the yard on the TV, over the server's
// `/proto-rungun-pad` namespace (apps/server/src/socketServer/protoRunGunPad).
const NAMESPACE = "/proto-rungun-pad";

/** What a pad's thumbs are doing. Sent whenever it changes, and twice a second regardless. */
export type PadState = {
  seq: number;
  /** The stick as one of eight directions, or 0 at rest: the crew pad's own message. */
  dir: StickDir;
  /** Counts every press of JUMP, so a tap shorter than a frame is still a jump. */
  jumpSeq: number;
  /** The pad's own clock at the send, echoed back in the ack so the pad can time the round trip. */
  sentAt: number;
  /** The pad's median round trip so far, for the TV's readout. */
  rttMs: number | null;
};

export type RelayedPadState = PadState & { padId: string };

/** The yard telling one pad its input reached a frame, and how its hen is doing. */
export type TvAck = {
  /** Which yard page is answering: two open at once both answer, and a pad listens to one. */
  tvId: string;
  padId: string;
  seq: number;
  sentAt: number;
  slot: number;
  hearts: number;
  hits: number;
};

type PadInbound = { "tv:ack": (ack: TvAck) => void };
type PadOutbound = { "pad:state": (state: PadState) => void };
type TvInbound = {
  "pad:state": (state: RelayedPadState) => void;
  "pad:gone": (payload: { padId: string }) => void;
};
type TvOutbound = { "tv:ack": (ack: TvAck) => void };

// The lab is served by the same stack as everything else (`resolveServerOrigin`).
export const resolveLabServerOrigin = resolveServerOrigin;

export type PadSocket = Socket<PadInbound, PadOutbound>;
export type TvSocket = Socket<TvInbound, TvOutbound>;

export const connectPad = (padId: string): PadSocket =>
  io(`${resolveLabServerOrigin()}${NAMESPACE}`, { auth: { role: "pad", padId } });

export const connectTv = (): TvSocket =>
  io(`${resolveLabServerOrigin()}${NAMESPACE}`, { auth: { role: "tv" } });
