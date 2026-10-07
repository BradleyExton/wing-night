// GET adminExport: everything `pnpm pack:pull` copies from wingnight.tv into the night pack, and
// deliberately nothing more — no address, no sign-in history, no vote and no teammate wish ever
// leaves for the party. A head's bytes come separately, from resolveAdminGuestAvatarRoute.
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
    (value.head === null || isExportHead(value.head))
  );
};

export const isAdminGuestExportList = (value: unknown): value is AdminGuestExport[] => {
  return Array.isArray(value) && value.every(isAdminGuestExport);
};
