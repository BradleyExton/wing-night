// GET adminExport: everything `pnpm pack:pull` copies from wingnight.tv into the night pack, and
// deliberately nothing more — no address, no sign-in history: a name, a head, a team and the bird's
// outfits are all that ever leave for the party. A head's bytes come separately, from resolveAdminGuestAvatarRoute.
//
// Imports its guards with the `.ts` suffix, like ../routes, because the pull runs under plain
// `node`, which resolves no `.js` alias (see ../routes).
import { isNonNegativeInteger, isRecord } from "../../guards/index.ts";
import type { OutfitsByGenre } from "../../outfit/index.ts";

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
  // Every genre's outfit the guest has built (docs/research/bird-wardrobe.md §2.4: all of them, so
  // a reseat on the night keeps the guest dressed), which the pull writes onto the player's
  // `outfits`. `{}` is a guest who never dressed; a genre whose outfit is `{}` is one they dressed
  // and then stripped bare, which the pull carries down so the pack's bird is undressed too.
  // Optional because a Worker deployed before the wardrobe sends none. Only "an object" is checked
  // here: one guest's malformed outfit must not refuse the
  // whole export, so the pull checks each guest's shape itself and leaves a bad one undressed.
  outfits?: OutfitsByGenre;
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
    (value.team === null || (typeof value.team === "string" && value.team.length > 0)) &&
    (value.outfits === undefined || isRecord(value.outfits))
  );
};

export const isAdminGuestExportList = (value: unknown): value is AdminGuestExport[] => {
  return Array.isArray(value) && value.every(isAdminGuestExport);
};
