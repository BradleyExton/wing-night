// How a device in the room finds the game. The laptop's browser is on
// `localhost`, which is the one address a tablet or phone cannot use, and a
// browser has no way to learn its machine's Wi-Fi address. The server can, so
// it lists them and a page on the laptop swaps one in for `localhost`. Shared
// so the express mounts and the pages' fetches agree on the strings.
//
// This route is the token-free listing, open to any origin. The host QR no
// longer reads it (it reads `/host-join`); it stays for a page that needs the
// addresses but must never hold the host seat's key — the TV's player QR for
// the guests' phones, which pairs it with the join token the laptop's display
// is handed over the socket.
export const LAN_ADDRESSES_ROUTE_PATH = "/lan-addresses";

// The same listing plus the host control token, answered to the laptop alone
// (a loopback requester, naming a loopback Host, from a loopback origin or
// none) and 403 to everything else. The token is what lets a LAN device take
// the host seat, so it only ever reaches the screen of the machine running the
// server — and from there the tablet, through the QR code.
export const HOST_JOIN_ROUTE_PATH = "/host-join";

// The query key the host QR carries the token under. The host route reads it
// on load, keeps it, and takes it back out of the address bar.
export const HOST_CONTROL_TOKEN_QUERY_KEY = "hostToken";

export const HOST_ROUTE_PATH = "/host";

// IPv4 only, best guess first: the private home-network ranges ahead of
// anything else (a VPN's tunnel address, say), because that is where the
// tablet is.
export type LanAddressesListing = {
  addresses: string[];
};

export type HostJoinListing = LanAddressesListing & {
  hostControlToken: string;
};

type PageLocation = {
  protocol: string;
  port: string;
};

type LanJoinTarget = {
  path: string;
  query?: Readonly<Record<string, string>>;
};

const IPV4_LOOPBACK_PATTERN = /^127(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

const LOOPBACK_HOSTNAMES = new Set(["localhost", "::1", "[::1]"]);

// A whole dotted quad in 127/8, never a prefix match: `127.example.com` is a
// name anyone can register, and the server reflects CORS for loopback origins.
export const isLoopbackHostname = (hostname: string): boolean =>
  LOOPBACK_HOSTNAMES.has(hostname) || IPV4_LOOPBACK_PATTERN.test(hostname);

// A page on the same client this page is served by, at the server's first LAN
// address instead of `localhost`, keeping the page's own port because the
// client and server are separate origins. Null when the server knows no LAN
// address.
export const resolveLanJoinUrl = (
  location: PageLocation,
  lanAddresses: readonly string[],
  target: LanJoinTarget
): string | null => {
  const hostname = lanAddresses[0];

  if (hostname === undefined) {
    return null;
  }

  const port = location.port.length > 0 ? `:${location.port}` : "";
  const search = new URLSearchParams(target.query ?? {}).toString();

  return `${location.protocol}//${hostname}${port}${target.path}${search.length > 0 ? `?${search}` : ""}`;
};

const resolveServerRouteUrl = (serverOrigin: string | null, routePath: string): string | null => {
  if (serverOrigin === null || serverOrigin.trim().length === 0) {
    return null;
  }

  return `${serverOrigin.trim()}${routePath}`;
};

export const resolveLanAddressesUrl = (serverOrigin: string | null): string | null =>
  resolveServerRouteUrl(serverOrigin, LAN_ADDRESSES_ROUTE_PATH);

export const resolveHostJoinRouteUrl = (serverOrigin: string | null): string | null =>
  resolveServerRouteUrl(serverOrigin, HOST_JOIN_ROUTE_PATH);
