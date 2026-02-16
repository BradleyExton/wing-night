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
