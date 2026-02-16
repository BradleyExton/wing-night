import { randomUUID } from "node:crypto";

import type { HostSecretPayload } from "@wingnight/shared";

// NOTE: This module-scoped secret intentionally uses a last-claim-wins model for MVP.
// Issuing a new host secret invalidates all previously issued secrets.
let currentHostSecret: string | null = null;

export const issueHostSecret = (): HostSecretPayload => {
  const nextSecret = randomUUID();
  currentHostSecret = nextSecret;

  return { hostSecret: nextSecret };
};

export const isValidHostSecret = (hostSecret: string): boolean => {
  if (typeof hostSecret !== "string" || hostSecret.trim().length === 0) {
    return false;
  }

  return currentHostSecret !== null && currentHostSecret === hostSecret;
};
