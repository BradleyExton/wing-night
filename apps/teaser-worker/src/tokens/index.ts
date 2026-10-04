// Sign-in tokens, session tokens and ids. A token is 32 random bytes as base64url; only its
// SHA-256 is ever written down, so a leaked table signs nobody in.
//
// No imports, so the seed script (scripts/seedAdmin.ts) can load this file under plain Node.
const TOKEN_BYTE_COUNT = 32;
const ID_BYTE_COUNT = 12;

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const toHex = (bytes: Uint8Array): string => {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const mintToken = (random: (byteCount: number) => Uint8Array): string => {
  return toBase64Url(random(TOKEN_BYTE_COUNT));
};

// A guest's id: random, so it says nothing about the order guests were added, and stable for
// good, because the pack pull keys heads and seats by it.
export const mintGuestId = (random: (byteCount: number) => Uint8Array): string => {
  return `g_${toBase64Url(random(ID_BYTE_COUNT))}`;
};

export const mintAttemptId = (random: (byteCount: number) => Uint8Array): string => {
  return `a_${toBase64Url(random(ID_BYTE_COUNT))}`;
};

const digest = async (value: string): Promise<Uint8Array> => {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
};

export const hashToken = async (token: string): Promise<string> => {
  return toHex(await digest(token));
};

// SHA-256 hex of some bytes (an accepted head). Native code, about a millisecond a megabyte.
export const hashBytes = async (bytes: Uint8Array<ArrayBuffer>): Promise<string> => {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
};

// Compares two secrets in time that depends on neither: both are hashed to 32 bytes first, so
// even a length mismatch costs the same as a near miss.
export const secretsMatch = async (given: string, expected: string): Promise<boolean> => {
  const [givenDigest, expectedDigest] = await Promise.all([digest(given), digest(expected)]);
  let difference = 0;

  for (let index = 0; index < expectedDigest.length; index += 1) {
    difference |= (givenDigest[index] ?? 0) ^ (expectedDigest[index] ?? 0);
  }

  return difference === 0;
};

// A token as it may appear in a `/s/<token>` path: base64url, and not absurdly long.
export const isTokenShaped = (value: string): boolean => /^[A-Za-z0-9_-]{16,128}$/.test(value);
