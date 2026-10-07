import { encode } from "uqr";

import * as styles from "./styles.js";

export type QrCodeProps = {
  value: string;
  // Light modules drawn round the symbol, for a code whose plate gives it no
  // margin of its own. Four is the spec's quiet zone; the TV draws it so the
  // code reads from across the room against the flame.
  quietZone?: number;
};

// A QR code for a URL a device in the room should open: the laptop's host code
// for the tablet, and the TV's player code for the guests' phones.
// Drawn in `currentColor`, so the caller's plate decides dark-on-light.
//
// One path, one subpath per dark module, drawn on a unit grid so the viewBox is
// the symbol's own size and the SVG scales without a single blurred edge. No
// quiet zone unless asked: the host card's plate is the margin a scanner needs.
const resolveModulePath = (modules: boolean[][]): string =>
  modules
    .flatMap((row, y) => row.map((isDark, x) => (isDark ? `M${x} ${y}h1v1h-1z` : "")))
    .join("");

export const QrCode = ({ value, quietZone = 0 }: QrCodeProps): JSX.Element => {
  const { size, data } = encode(value, { ecc: "M", border: quietZone });

  return (
    <svg
      className={styles.code}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={value}
    >
      <path d={resolveModulePath(data)} fill="currentColor" />
    </svg>
  );
};
