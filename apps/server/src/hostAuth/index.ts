import { randomUUID } from "node:crypto";

import type { HostSecretPayload } from "@wingnight/shared";

let currentHostSecret: string | null = null;

export const issueHostSecret = (): HostSecretPayload => {
  const nextSecret = randomUUID();
  currentHostSecret = nextSecret;

  return { hostSecret: nextSecret };
};

export const isValidHostSecret = (hostSecret: string): boolean => {
  return currentHostSecret !== null && currentHostSecret === hostSecret;
};
