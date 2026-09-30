import {
  CLIENT_ROLES,
  isRecord,
  isSocketClientRole,
  type SocketClientRole
} from "@wingnight/shared";

const resolveRequestedClientRole = (authPayload: unknown): SocketClientRole => {
  if (!isRecord(authPayload)) {
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
  if (!isRecord(authPayload)) {
    return false;
  }

  return authPayload.hostControlToken === expectedHostControlToken;
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
  _remoteAddress: string | undefined,
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
  return CLIENT_ROLES.HOST;
};
