import { useEffect, useState } from "react";
import {
  isLoopbackHostname,
  resolveHostJoinUrl,
  resolveLanAddressesUrl
} from "@wingnight/shared";

import { resolveServerOrigin } from "../../../../utils/resolveServerOrigin";

const readLanAddresses = (listing: unknown): string[] => {
  if (typeof listing !== "object" || listing === null || !("addresses" in listing)) {
    return [];
  }

  const { addresses } = listing;

  return Array.isArray(addresses)
    ? addresses.filter((address): address is string => typeof address === "string")
    : [];
};

// The host page's address as another device on the Wi-Fi would type it — but
// only for a page open on the laptop itself. A guest who opens the root page on
// their phone reached it over the LAN, so their hostname is not loopback and
// they get no code: the way in to the host seat is only on the laptop's
// screen. Null on the first paint too — resolving it reads `window`, which
// react-dom/server cannot — and for good when the server knows no LAN address.
export const useHostJoinUrl = (): string | null => {
  const [hostJoinUrl, setHostJoinUrl] = useState<string | null>(null);

  useEffect(() => {
    const { location } = window;

    if (!isLoopbackHostname(location.hostname)) {
      return;
    }

    const lanAddressesUrl = resolveLanAddressesUrl(resolveServerOrigin());

    if (lanAddressesUrl === null) {
      return;
    }

    let cancelled = false;

    fetch(lanAddressesUrl)
      .then((response) => (response.ok ? response.json() : null))
      .then((listing: unknown) => {
        if (!cancelled) {
          setHostJoinUrl(resolveHostJoinUrl(location, readLanAddresses(listing)));
        }
      })
      .catch(() => {
        // No card: the address has to be typed the old way.
      });

    return (): void => {
      cancelled = true;
    };
  }, []);

  return hostJoinUrl;
};
