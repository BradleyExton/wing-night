// How the host tablet finds the game: the root page, opened on the laptop,
// shows a QR code for the host page at an address the tablet can reach.
//
// The laptop's browser is on `localhost`, which is the one address a tablet
// cannot use, and a browser has no way to learn its machine's Wi-Fi address.
// The server can, so it lists them on this route and the page swaps one in for
// `localhost`. Shared so the express mount and the page's fetch agree on the
// string.
export const LAN_ADDRESSES_ROUTE_PATH = "/lan-addresses";

// IPv4 only, best guess first: the private home-network ranges ahead of
// anything else (a VPN's tunnel address, say), because that is where the
// tablet is.
export type LanAddressesListing = {
  addresses: string[];
};

const HOST_ROUTE_PATH = "/host";

type PageLocation = {
  protocol: string;
  port: string;
};

const LOOPBACK_HOSTNAMES = new Set(["localhost", "::1", "[::1]"]);

export const isLoopbackHostname = (hostname: string): boolean =>
  LOOPBACK_HOSTNAMES.has(hostname) || hostname.startsWith("127.");

// The host page on the same client this page is served by, at the server's
// first LAN address instead of `localhost`, keeping the page's own port because
// the client and server are separate origins. Null when the server knows no LAN
// address.
export const resolveHostJoinUrl = (
  location: PageLocation,
  lanAddresses: readonly string[]
): string | null => {
  const hostname = lanAddresses[0];

  if (hostname === undefined) {
    return null;
  }

  const port = location.port.length > 0 ? `:${location.port}` : "";

  return `${location.protocol}//${hostname}${port}${HOST_ROUTE_PATH}`;
};

export const resolveLanAddressesUrl = (serverOrigin: string | null): string | null => {
  if (serverOrigin === null || serverOrigin.trim().length === 0) {
    return null;
  }

  return `${serverOrigin.trim()}${LAN_ADDRESSES_ROUTE_PATH}`;
};
