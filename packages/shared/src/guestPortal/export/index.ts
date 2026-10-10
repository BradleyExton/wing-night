// GET adminExport: everything `pnpm pack:pull` copies from wingnight.tv into the night pack, and
// deliberately nothing more — no address, no sign-in history, and (until milestone 3 of
// docs/guest-portal-team-pick-plan.md adds the picked team's outfit) nothing else ever leaves for
// the party. A head's bytes come separately, from resolveAdminGuestAvatarRoute.
//
// Imports its guards with the `.ts` suffix, like ../routes, because the pull runs under plain
// `node`, which resolves no `.js` alias (see ../routes).
import { isNonNegativeInteger, isRecord } from "../../guards/index.ts";

export type AdminGuestExportHead = {
  // The SHA-256 hex of the PNG's bytes, which the pull checks the download against and names the
  // pack's file after.
  sha256: string;
  contentType: string;
  bytes: number;
};

export type AdminGuestExport = {
  guestId: string;
  displayName: string;
  // Null until the guest keeps a head.
  head: AdminGuestExportHead | null;
  // The picked team's exact roster name, which the pull writes onto the player's `team` (plan,
  // decision 5); null when the guest has not picked, and null again when their pick names a team
  // the roster no longer has (the Worker checks the roster on the way out, as the admin board
  // does): the night server refuses to boot on a player seated on an undeclared team, so an
  // orphan must never reach the pack.
  team: string | null;
};

// Lower-case hex only: the pull writes part of it into a file name.
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

const isExportHead = (value: unknown): value is AdminGuestExportHead => {
  return (
    isRecord(value) &&
    typeof value.sha256 === "string" &&
    SHA256_HEX_PATTERN.test(value.sha256) &&
    typeof value.contentType === "string" &&
    isNonNegativeInteger(value.bytes)
  );
};

export const isAdminGuestExport = (value: unknown): value is AdminGuestExport => {
  return (
    isRecord(value) &&
    typeof value.guestId === "string" &&
    value.guestId.length > 0 &&
    typeof value.displayName === "string" &&
    (value.head === null || isExportHead(value.head)) &&
    (value.team === null || (typeof value.team === "string" && value.team.length > 0))
  );
};

export const isAdminGuestExportList = (value: unknown): value is AdminGuestExport[] => {
  return Array.isArray(value) && value.every(isAdminGuestExport);
};
