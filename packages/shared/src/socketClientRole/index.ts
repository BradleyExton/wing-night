export const CLIENT_ROLES = {
  HOST: "HOST",
  DISPLAY: "DISPLAY"
} as const;

export type SocketClientRole =
  (typeof CLIENT_ROLES)[keyof typeof CLIENT_ROLES];

export const isSocketClientRole = (
  value: unknown
): value is SocketClientRole => {
  return value === CLIENT_ROLES.HOST || value === CLIENT_ROLES.DISPLAY;
};

// The connect error a socket gets when it asks for HOST from off the laptop
// without the host control token. It is the error's `message`, so the client
// can match it on `connect_error` without reaching into `data`. A refused host
// is refused outright — never quietly seated as a display — so the tablet can
// say why instead of showing a board it cannot drive.
export const HOST_AUTH_REQUIRED_ERROR_CODE = "host_auth_required";
