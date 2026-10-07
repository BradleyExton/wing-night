export const CLIENT_ROLES = {
  HOST: "HOST",
  DISPLAY: "DISPLAY",
  // A guest's phone, seated by the join token the TV's QR carries. It may
  // claim a face and nothing else: it never advances a phase, moves a turn or
  // touches a score.
  PLAYER: "PLAYER"
} as const;

export type SocketClientRole =
  (typeof CLIENT_ROLES)[keyof typeof CLIENT_ROLES];

export const isSocketClientRole = (
  value: unknown
): value is SocketClientRole => {
  return (
    value === CLIENT_ROLES.HOST ||
    value === CLIENT_ROLES.DISPLAY ||
    value === CLIENT_ROLES.PLAYER
  );
};

// The connect error a socket gets when it asks for HOST from off the laptop
// without the host control token. It is the error's `message`, so the client
// can match it on `connect_error` without reaching into `data`. A refused host
// is refused outright — never quietly seated as a display — so the tablet can
// say why instead of showing a board it cannot drive.
export const HOST_AUTH_REQUIRED_ERROR_CODE = "host_auth_required";

// The same refusal for a phone: it asked for PLAYER with no join token, or
// one that was rotated by Reset Game. Never downgraded to DISPLAY, for the
// same reason — the phone says "scan the TV again" instead of showing a board.
export const PLAYER_AUTH_REQUIRED_ERROR_CODE = "player_auth_required";
