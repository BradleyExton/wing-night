import { Pane, Polyline } from "react-leaflet";

import { GRATICULE_COLOR, GRATICULE_LINES, GRATICULE_OPACITY } from "../leafletConstants/index.js";
import * as styles from "./styles.js";

// The faint lat/lng grid under every GEO chart (`GRATICULE_LINES`), in a pane of its own that
// takes no pointer, so a tap on a line still lands on the map beneath it — which is the point when
// the tiles never arrive.
export const GeoGraticule = (): JSX.Element => {
  return (
    <Pane name="geo-graticule" className={styles.pane}>
      {GRATICULE_LINES.map((positions) => (
        <Polyline
          key={`${positions[0]?.join(",")}:${positions[1]?.join(",")}`}
          positions={positions}
          interactive={false}
          pathOptions={{ color: GRATICULE_COLOR, opacity: GRATICULE_OPACITY, weight: 1 }}
        />
      ))}
    </Pane>
  );
};
