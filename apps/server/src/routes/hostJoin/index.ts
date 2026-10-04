import { networkInterfaces } from "node:os";

import { Router } from "express";
import type { HostJoinListing } from "@wingnight/shared";

import { isLoopbackPeer, type Peer } from "../../utils/loopbackPeer/index.js";
import { listLanAddresses } from "../lanAddresses/index.js";

// Allowed, with the Origin to reflect (null when the request sent none), or
// refused.
export type HostJoinAccess = { allowed: true; allowOrigin: string | null } | { allowed: false };

// The laptop alone (`isLoopbackPeer`): no LAN device, no web page that the
// laptop's own browser happens to have open, and no rebinded name pointed at
// 127.0.0.1. The client page is a separate
// origin on localhost (there is no dev proxy), so the one origin this ever
// reflects is a loopback one, and it is never `*`.
export const resolveHostJoinAccess = (peer: Peer): HostJoinAccess => {
  if (!isLoopbackPeer(peer)) {
    return { allowed: false };
  }

  return { allowed: true, allowOrigin: peer.origin ?? null };
};

type HostJoinRouterOptions = {
  hostControlToken: string;
};

// Everything the laptop's host QR needs: where the tablet can reach the game,
// and the token that lets it take the host seat once it gets there.
export const createHostJoinRouter = ({ hostControlToken }: HostJoinRouterOptions): Router => {
  const hostJoinRouter = Router();

  hostJoinRouter.get("/", (request, response) => {
    const access = resolveHostJoinAccess({
      address: request.socket.remoteAddress,
      host: request.headers.host,
      origin: request.headers.origin
    });

    response.setHeader("Vary", "Origin");
    response.setHeader("Cache-Control", "no-store");

    if (!access.allowed) {
      response.status(403).json({ error: "host_join_laptop_only" });
      return;
    }

    if (access.allowOrigin !== null) {
      response.setHeader("Access-Control-Allow-Origin", access.allowOrigin);
    }

    const listing: HostJoinListing = {
      ...listLanAddresses(networkInterfaces()),
      hostControlToken
    };

    response.status(200).json(listing);
  });

  return hostJoinRouter;
};
