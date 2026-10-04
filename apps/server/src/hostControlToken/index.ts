import { randomBytes } from "node:crypto";
import { readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type HostControlTokenSource = "env" | "persisted" | "generated";

export type ResolvedHostControlToken = {
  token: string;
  source: HostControlTokenSource;
};

// Where a minted token outlives the process that minted it. `tsx watch`
// restarts the server on every save, and a crash mid-party restarts it too; a
// token that died with the process would lock the tablet out each time.
export const HOST_CONTROL_TOKEN_FILE_NAME = "wing-night-host-control-token";

// 24 bytes is 192 bits, comfortably past guessing over a party's Wi-Fi, and
// base64url keeps it safe to drop into a query string unescaped.
export const generateHostControlToken = (): string => randomBytes(24).toString("base64url");

// Exactly what `generateHostControlToken` makes: anything else in the file is
// not ours to trust.
const WELL_FORMED_TOKEN = /^[A-Za-z0-9_-]{32}$/;

// The file is reused only if this user wrote it and nobody else can read it —
// on a shared /tmp another account could otherwise plant a token it knows.
const readPersistedToken = (path: string): string | null => {
  try {
    const stats = statSync(path);
    const ownUid = process.getuid?.();

    if (!stats.isFile() || (ownUid !== undefined && stats.uid !== ownUid) || (stats.mode & 0o077) !== 0) {
      return null;
    }

    const token = readFileSync(path, "utf8").trim();

    return WELL_FORMED_TOKEN.test(token) ? token : null;
  } catch {
    return null;
  }
};

// Removed first and created exclusively, so a symlink left at the path is
// replaced rather than followed. A failure to persist is not fatal: the token
// still holds for this boot.
const persistToken = (path: string, token: string): void => {
  try {
    rmSync(path, { force: true });
    writeFileSync(path, token, { mode: 0o600, flag: "wx" });
  } catch {
    // Next boot mints again; the tablet rescans.
  }
};

type ResolveHostControlTokenOptions = {
  stateDir?: string;
  generate?: () => string;
};

// The key to the host seat for anything that is not the laptop itself. Read
// once at boot and handed down: the socket guard checks it, and the laptop-only
// `/host-join` route hands it to the host QR. `HOST_CONTROL_TOKEN` pins it and
// leaves the file alone; otherwise the token minted by an earlier boot is
// reused, and a fresh one is minted only when there is none (or it is not one
// this user wrote, or it is not the shape we mint).
export const resolveHostControlToken = (
  configuredHostControlToken: string | undefined,
  { stateDir = tmpdir(), generate = generateHostControlToken }: ResolveHostControlTokenOptions = {}
): ResolvedHostControlToken => {
  const trimmedToken = configuredHostControlToken?.trim() ?? "";

  if (trimmedToken.length > 0) {
    return { token: trimmedToken, source: "env" };
  }

  const path = join(stateDir, HOST_CONTROL_TOKEN_FILE_NAME);
  const persistedToken = readPersistedToken(path);

  if (persistedToken !== null) {
    return { token: persistedToken, source: "persisted" };
  }

  const token = generate();
  persistToken(path, token);

  return { token, source: "generated" };
};
