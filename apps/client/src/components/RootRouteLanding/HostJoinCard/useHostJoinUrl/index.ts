import { useEffect, useState } from "react";
import {
  HOST_CONTROL_TOKEN_QUERY_KEY,
  HOST_ROUTE_PATH,
  isLoopbackHostname,
  resolveHostJoinRouteUrl,
  resolveLanJoinUrl
} from "@wingnight/shared";

import { resolveServerOrigin } from "../../../../utils/resolveServerOrigin";

type HostJoinPageLocation = {
  protocol: string;
  port: string;
};

// The host page's address as the tablet should open it: the laptop's LAN
// address, and the host control token in the query so the tablet takes the
// host seat on arrival. Null for anything that is not a `/host-join` answer.
export const resolveHostJoinUrlFromListing = (
  location: HostJoinPageLocation,
  listing: unknown
): string | null => {
  if (typeof listing !== "object" || listing === null) {
    return null;
  }

  const { addresses, hostControlToken } = listing as Record<string, unknown>;

  if (!Array.isArray(addresses) || typeof hostControlToken !== "string") {
    return null;
  }

  return resolveLanJoinUrl(
    location,
    addresses.filter((address): address is string => typeof address === "string"),
    { path: HOST_ROUTE_PATH, query: { [HOST_CONTROL_TOKEN_QUERY_KEY]: hostControlToken } }
  );
};

// Often enough that a card gone stale (the token was rotated,
// or the laptop joined the Wi-Fi late) is right again before anyone scans it.
export const HOST_JOIN_REFRESH_MS = 5_000;

type HostJoinWatch = {
  // Resolves the URL the server's answer makes (null: it knows no LAN address);
  // rejects when there was no usable answer at all.
  load: () => Promise<string | null>;
  onChange: (hostJoinUrl: string | null) => void;
  intervalMs?: number;
  timers?: {
    setInterval: (run: () => void, ms: number) => unknown;
    clearInterval: (handle: unknown) => void;
  };
  focusTarget: Pick<EventTarget, "addEventListener" | "removeEventListener">;
};

const browserTimers: NonNullable<HostJoinWatch["timers"]> = {
  setInterval: (run, ms) => window.setInterval(run, ms),
  clearInterval: (handle) => {
    window.clearInterval(handle as number);
  }
};

// Keeps the host card current: asks now, every `intervalMs`, and whenever the
// laptop's window regains focus (the host coming back to it to show the code).
// A failed ask keeps the card it had — a server mid-restart is not a reason to
// pull a code that will work again in a second — and only the newest answer
// counts, so a slow reply cannot overwrite a fresher one.
export const watchHostJoinUrl = ({
  load,
  onChange,
  intervalMs = HOST_JOIN_REFRESH_MS,
  timers = browserTimers,
  focusTarget
}: HostJoinWatch): (() => void) => {
  let latestRequest = 0;
  let currentUrl: string | null = null;
  let stopped = false;

  const refresh = (): void => {
    latestRequest += 1;
    const request = latestRequest;

    load()
      .then((hostJoinUrl) => {
        if (stopped || request !== latestRequest || hostJoinUrl === currentUrl) {
          return;
        }

        currentUrl = hostJoinUrl;
        onChange(hostJoinUrl);
      })
      .catch(() => {
        // Keep whatever card is up; the next tick tries again.
      });
  };

  const interval = timers.setInterval(refresh, intervalMs);
  focusTarget.addEventListener("focus", refresh);
  refresh();

  return (): void => {
    stopped = true;
    timers.clearInterval(interval);
    focusTarget.removeEventListener("focus", refresh);
  };
};

// The host page's address as another device on the Wi-Fi would type it — but
// only for a page open on the laptop itself. A guest who opens the root page on
// their phone reached it over the LAN, so their hostname is not loopback and
// they get no code; and the server's `/host-join` refuses them the token
// anyway, so the check here is about not asking, not about keeping a secret.
// Null on the first paint too — resolving it reads `window`, which
// react-dom/server cannot — and for good when the server knows no LAN address.
export const useHostJoinUrl = (): string | null => {
  const [hostJoinUrl, setHostJoinUrl] = useState<string | null>(null);

  useEffect(() => {
    const { location } = window;

    if (!isLoopbackHostname(location.hostname)) {
      return;
    }

    const hostJoinRouteUrl = resolveHostJoinRouteUrl(resolveServerOrigin());

    if (hostJoinRouteUrl === null) {
      return;
    }

    return watchHostJoinUrl({
      load: async () => {
        const response = await fetch(hostJoinRouteUrl, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`host-join answered ${response.status}`);
        }

        return resolveHostJoinUrlFromListing(location, await response.json());
      },
      onChange: setHostJoinUrl,
      focusTarget: window
    });
  }, []);

  return hostJoinUrl;
};
