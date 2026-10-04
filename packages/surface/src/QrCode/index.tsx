import { encode } from "uqr";

import * as styles from "./styles.js";

export type QrCodeProps = {
  value: string;
};

// A QR code for a URL a device in the room should open: the laptop's host code
// for the tablet today, the TV's player code for the guests' phones next.
// Drawn in `currentColor`, so the caller's plate decides dark-on-light.
//
// One path, one subpath per dark module, drawn on a unit grid so the viewBox is
// the symbol's own size and the SVG scales without a single blurred edge. No
// quiet zone: the card around it is the margin a scanner needs.
const resolveModulePath = (modules: boolean[][]): string =>
  modules
    .flatMap((row, y) => row.map((isDark, x) => (isDark ? `M${x} ${y}h1v1h-1z` : "")))
    .join("");

export const QrCode = ({ value }: QrCodeProps): JSX.Element => {
  const { size, data } = encode(value, { ecc: "M", border: 0 });

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
