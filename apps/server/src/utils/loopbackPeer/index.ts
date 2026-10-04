import { isLoopbackHostname } from "@wingnight/shared";

// Node reports an IPv4 peer on a dual-stack listener as an IPv4-mapped IPv6
// address, so the laptop's own browser arrives as `::ffff:127.0.0.1` far more
// often than as `127.0.0.1`.
const IPV4_MAPPED_PREFIX = "::ffff:";

// Whether a peer address — `socket.handshake.address`, `request.socket
// .remoteAddress` — is the machine the server runs on: 127.0.0.0/8, `::1`, or
// either IPv4 form mapped into IPv6. An address, never a name: `localhost` is
// not something a socket peer can be, so it is refused here.
export const isLoopbackAddress = (address: string | undefined): boolean => {
  if (address === undefined || address.length === 0) {
    return false;
  }

  const normalizedAddress = address.toLowerCase();
  const unmappedAddress = normalizedAddress.startsWith(IPV4_MAPPED_PREFIX)
    ? normalizedAddress.slice(IPV4_MAPPED_PREFIX.length)
    : normalizedAddress;

  return unmappedAddress !== "localhost" && isLoopbackHostname(unmappedAddress);
};

// Whether an Origin header names a page served from the laptop itself.
export const isLoopbackOrigin = (origin: string): boolean => {
  try {
    return isLoopbackHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
};

// Whether a Host header names the laptop: `localhost:3000`, `127.0.0.1:3000`,
// `[::1]:3000`. Absent is refused — every HTTP/1.1 request carries one.
export const isLoopbackHost = (host: string | undefined): boolean => {
  if (host === undefined || host.length === 0) {
    return false;
  }

  try {
    return isLoopbackHostname(new URL(`http://${host}`).hostname);
  } catch {
    return false;
  }
};

export type Peer = {
  address: string | undefined;
  // The request's Host header: the name the requester used to reach us.
  host: string | undefined;
  // The request's Origin header; absent for a non-browser client, and for a
  // browser page's same-origin GET.
  origin: string | undefined;
};

// The laptop, asking from a page on the laptop. Three checks, each closing a
// different door:
// - the address keeps every LAN device out;
// - the Origin keeps out a web page the laptop's own browser happens to have
//   open: its cross-origin request arrives from loopback too, but stamped with
//   that page's origin;
// - the Host keeps out DNS rebinding: a page at `attacker.example` whose name
//   is re-pointed at 127.0.0.1 makes SAME-origin requests, which carry no
//   Origin at all — but they still say `Host: attacker.example`.
export const isLoopbackPeer = ({ address, host, origin }: Peer): boolean =>
  isLoopbackAddress(address) &&
  isLoopbackHost(host) &&
  (origin === undefined || isLoopbackOrigin(origin));
