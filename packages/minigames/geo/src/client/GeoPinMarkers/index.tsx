import { CircleMarker, Tooltip } from "react-leaflet";
import type { GeoMinigameDisplayPin } from "@wingnight/shared";

import { GUESS_PIN_COLOR } from "../leafletConstants/index.js";
import { geoPinMarkersCopy } from "./copy.js";
import * as styles from "./styles.js";

type GeoPinMarkersProps = {
  pins: readonly GeoMinigameDisplayPin[];
};

// Every pin a lock measured, each one NAMED on the chart — the tablet's and every phone's — with the
// team's best one larger and starred. Drawn on the reveal only, on the TV's theatre and the
// tablet's chart alike: before the lock no surface but a phone's own card has a phone's pin.
export const GeoPinMarkers = ({ pins }: GeoPinMarkersProps): JSX.Element => {
  return (
    <>
      {pins.map((pin, index) => (
        <CircleMarker
          key={`${pin.name ?? "tablet"}-${index}`}
          center={[pin.lat, pin.lng]}
          radius={pin.isBest ? 13 : 9}
          pathOptions={{
            color: GUESS_PIN_COLOR,
            fillColor: GUESS_PIN_COLOR,
            fillOpacity: pin.isBest ? 0.75 : 0.45,
            weight: pin.isBest ? 4 : 2
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className={styles.label}>
            {geoPinMarkersCopy.label(pin.name, pin.isBest)}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
};
