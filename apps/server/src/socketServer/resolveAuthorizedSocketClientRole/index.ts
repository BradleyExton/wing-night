import {
  CLIENT_ROLES,
  isSocketClientRole,
  type SocketClientRole
} from "@wingnight/shared";

type SocketAuthPayload = {
  clientRole?: unknown;
  hostControlToken?: unknown;
};

const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

const isSocketAuthPayload = (value: unknown): value is SocketAuthPayload => {
  return typeof value === "object" && value !== null;
};

const resolveRequestedClientRole = (authPayload: unknown): SocketClientRole => {
  if (!isSocketAuthPayload(authPayload)) {
    return CLIENT_ROLES.DISPLAY;
  }

  if (!isSocketClientRole(authPayload.clientRole)) {
    return CLIENT_ROLES.DISPLAY;
  }

  return authPayload.clientRole;
};

const hasValidHostControlToken = (
  authPayload: unknown,
  expectedHostControlToken: string
): boolean => {
  if (!isSocketAuthPayload(authPayload)) {
    return false;
  }

  return authPayload.hostControlToken === expectedHostControlToken;
};

const isLoopbackAddress = (remoteAddress: string): boolean => {
  return LOOPBACK_ADDRESSES.has(remoteAddress);
};

export const resolveConfiguredHostControlToken = (
  configuredHostControlToken: string | undefined
): string | null => {
  if (typeof configuredHostControlToken !== "string") {
    return null;
  }

  const trimmedToken = configuredHostControlToken.trim();

  if (trimmedToken.length === 0) {
    return null;
  }

  return trimmedToken;
};

export const resolveAuthorizedSocketClientRole = (
  authPayload: unknown,
  remoteAddress: string | undefined,
  configuredHostControlToken: string | null
): SocketClientRole => {
  const requestedClientRole = resolveRequestedClientRole(authPayload);

  if (requestedClientRole === CLIENT_ROLES.DISPLAY) {
    return CLIENT_ROLES.DISPLAY;
  }

  if (configuredHostControlToken !== null) {
    return hasValidHostControlToken(authPayload, configuredHostControlToken)
      ? CLIENT_ROLES.HOST
      : CLIENT_ROLES.DISPLAY;
  }

  if (typeof remoteAddress !== "string") {
    return CLIENT_ROLES.DISPLAY;
  }

  return isLoopbackAddress(remoteAddress) ? CLIENT_ROLES.HOST : CLIENT_ROLES.DISPLAY;
};
