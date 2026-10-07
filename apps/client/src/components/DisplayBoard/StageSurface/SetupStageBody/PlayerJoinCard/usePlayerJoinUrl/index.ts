import { useEffect, useState } from "react";
import {
  PLAYER_JOIN_TOKEN_QUERY_KEY,
  PLAY_ROUTE_PATH,
  isStringArray,
  isRecord,
  resolveLanAddressesUrl,
  resolveLanJoinUrl
} from "@wingnight/shared";

import { usePlayerJoinToken } from "../../../../../../context/PlayerJoinTokenContext";
import { resolveServerOrigin } from "../../../../../../utils/resolveServerOrigin";

type PageLocation = {
  protocol: string;
  port: string;
};

// The phone's address for tonight: the laptop's Wi-Fi address (a phone cannot
// reach `localhost`), the page's own port (client and server are separate
// origins), `/play`, and the join token. Null without a token — this display
// is not the laptop's, so it never draws a code — or without a LAN address.
export const resolvePlayerJoinUrl = (
  location: PageLocation,
  listing: unknown,
  joinToken: string | null
): string | null => {
  if (joinToken === null || !isRecord(listing) || !isStringArray(listing.addresses)) {
    return null;
  }

  return resolveLanJoinUrl(location, listing.addresses, {
    path: PLAY_ROUTE_PATH,
    query: { [PLAYER_JOIN_TOKEN_QUERY_KEY]: joinToken }
  });
};

// Often enough that a laptop joining the Wi-Fi late is right on the TV before
// anyone gets their phone out; the listing is tiny and token-free.
export const LAN_ADDRESSES_REFRESH_MS = 15_000;

// The join URL the TV's QR encodes. The token arrives over the socket (and
// again when Reset Game rotates it); the addresses come from the token-free
// `/lan-addresses`. Both reads happen in effects, so the first paint — and a
// server render — draws no code.
export const usePlayerJoinUrl = (): string | null => {
  const joinToken = usePlayerJoinToken();
  const [listing, setListing] = useState<unknown>(null);
  const [location, setLocation] = useState<PageLocation | null>(null);
  const hasJoinToken = joinToken !== null;

  useEffect(() => {
    if (!hasJoinToken) {
      return;
    }

    const lanAddressesUrl = resolveLanAddressesUrl(resolveServerOrigin());

    if (lanAddressesUrl === null) {
      return;
    }

    let stopped = false;
    const refresh = (): void => {
      fetch(lanAddressesUrl, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((nextListing: unknown) => {
          if (!stopped && nextListing !== null) {
            setListing(nextListing);
          }
        })
        .catch(() => {
          // Keep whatever code is up; the next tick tries again.
        });
    };

    setLocation({ protocol: window.location.protocol, port: window.location.port });
    refresh();
    const interval = window.setInterval(refresh, LAN_ADDRESSES_REFRESH_MS);

    return (): void => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [hasJoinToken]);

  return location === null ? null : resolvePlayerJoinUrl(location, listing, joinToken);
};
