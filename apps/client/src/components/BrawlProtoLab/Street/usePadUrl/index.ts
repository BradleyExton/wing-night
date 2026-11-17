import { useEffect, useState } from "react";
import { isLoopbackHostname, resolveLanAddressesUrl, resolveLanJoinUrl } from "@wingnight/shared";

import { resolveLabServerOrigin } from "../../link";

const PAD_ROUTE_PATH = "/dev/lab/brawl-pad";

// PROTOTYPE — throwaway. Where a phone on the Wi-Fi opens the pad: this page's own port at the
// laptop's LAN address. Null until the server has said what that address is.
export const usePadUrl = (): string | null => {
  const [padUrl, setPadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoopbackHostname(window.location.hostname)) {
      setPadUrl(`${window.location.origin}${PAD_ROUTE_PATH}`);

      return;
    }

    const listingUrl = resolveLanAddressesUrl(resolveLabServerOrigin());

    if (listingUrl === null) {
      return;
    }

    let cancelled = false;

    void fetch(listingUrl)
      .then((response) => response.json() as Promise<{ addresses?: unknown }>)
      .then((listing) => {
        const addresses = Array.isArray(listing.addresses)
          ? listing.addresses.filter((address): address is string => typeof address === "string")
          : [];

        if (!cancelled) {
          setPadUrl(resolveLanJoinUrl(window.location, addresses, { path: PAD_ROUTE_PATH }));
        }
      })
      .catch(() => {
        // No server, no code: the fallback line says where to go.
      });

    return (): void => {
      cancelled = true;
    };
  }, []);

  return padUrl;
};
