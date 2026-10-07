import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap
} from "react-leaflet";
import type { GeoMinigameDisplayPin } from "@wingnight/shared";

import {
  ANSWER_PIN_COLOR,
  CONNECTION_LINE_COLOR,
  GUESS_PIN_COLOR,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  REVEAL_FIT_PADDING,
  REVEAL_MAX_ZOOM,
  WORLD_CENTER,
  WORLD_ZOOM
} from "../../leafletConstants/index.js";
import { GeoGraticule } from "../../GeoGraticule/index.js";
import { GeoPinMarkers } from "../../GeoPinMarkers/index.js";
import { darkMapClassName, livePinMapClassName } from "../../mapTheme/index.js";
import { useTileOffline } from "../../useTileOffline/index.js";
import * as styles from "./styles.js";

type GeoCoordinates = {
  lat: number;
  lng: number;
};

type GeoTheatreMapProps = {
  guess: GeoCoordinates | null;
  answer: GeoCoordinates | null;
  // Said on the chart while the tile server is out of reach (`useTileOffline`).
  offlineNote?: string;
  // Every pin the lock measured — the tablet's and each phone's, named — once there is more than
  // the one. The map closes on all of them and the answer.
  pins?: readonly GeoMinigameDisplayPin[];
};

const NO_PINS: readonly GeoMinigameDisplayPin[] = [];

// The map runs for the whole turn, so it has two jobs rather than one.
//
// While the team is still pinning it holds the whole world: the room is reading
// "are they anywhere near it", and a chart that zoomed to chase the pin would
// throw that reading away every time somebody moved it. Once the answer lands,
// the two pins are the only thing that matters and the map closes on them.
const FitToTurn = ({ guess, answer, pins = NO_PINS }: GeoTheatreMapProps): null => {
  const map = useMap();
  const guessLat = guess?.lat ?? null;
  const guessLng = guess?.lng ?? null;
  const answerLat = answer?.lat ?? null;
  const answerLng = answer?.lng ?? null;
  // One string for every pin, so the fit re-runs only when one moves.
  const pinsKey = pins.map((pin) => `${pin.lat},${pin.lng}`).join(";");

  useEffect(() => {
    const fitToTurn = (): void => {
      if (
        guessLat === null ||
        guessLng === null ||
        answerLat === null ||
        answerLng === null
      ) {
        map.setView(WORLD_CENTER, WORLD_ZOOM);
        return;
      }

      const pinPoints = pinsKey
        .split(";")
        .filter((entry) => entry.length > 0)
        .map((entry): [number, number] => {
          const [lat, lng] = entry.split(",").map(Number);

          return [lat ?? 0, lng ?? 0];
        });

      // A spread of named pins keeps clear of the corner cards: the photo plate holds the arena's
      // left third and the result plaque its bottom-right, and a pin under either is a pin the
      // room never sees. One pin and the answer keep the classic even fit.
      const size = map.getSize();
      const fitOptions =
        pinPoints.length > 0
          ? {
              paddingTopLeft: [Math.round(size.x * 0.34), 90] as [number, number],
              paddingBottomRight: [60, Math.round(size.y * 0.3)] as [number, number],
              maxZoom: REVEAL_MAX_ZOOM
            }
          : { padding: REVEAL_FIT_PADDING, maxZoom: REVEAL_MAX_ZOOM };

      map.fitBounds([[guessLat, guessLng], [answerLat, answerLng], ...pinPoints], fitOptions);
    };

    fitToTurn();

    // The reveal mounts during the display's phase fade, so Leaflet can
    // capture a stale container size (unfilled gray tiles on large screens).
    // Re-measure and re-fit once the stage settles on its final size.
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
      fitToTurn();
    });
    resizeObserver.observe(map.getContainer());

    return () => {
      resizeObserver.disconnect();
    };
  }, [map, guessLat, guessLng, answerLat, answerLng, pinsKey]);

  return null;
};

export const GeoTheatreMap = ({
  guess,
  answer,
  pins = NO_PINS,
  offlineNote
}: GeoTheatreMapProps): JSX.Element => {
  const { isOffline, tileEventHandlers } = useTileOffline();
  const isRevealed = answer !== null;
  // One pin is the classic reveal (pin, dashed line, answer); more is the spread, every pin named.
  const isSpread = isRevealed && pins.length > 1;

  return (
    <>
      <MapContainer
        center={WORLD_CENTER}
        zoom={WORLD_ZOOM}
        className={`${styles.map} ${darkMapClassName}${isRevealed ? "" : ` ${livePinMapClassName}`}`}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} eventHandlers={tileEventHandlers} />
        <GeoGraticule />
        <FitToTurn guess={guess} answer={answer} pins={isSpread ? pins : NO_PINS} />
        {isSpread && <GeoPinMarkers pins={pins} />}
        {guess !== null && answer !== null && !isSpread && (
          <Polyline
            positions={[
              [guess.lat, guess.lng],
              [answer.lat, answer.lng]
            ]}
            pathOptions={{
              color: CONNECTION_LINE_COLOR,
              weight: 3,
              dashArray: "8 8"
            }}
          />
        )}
        {guess !== null && !isSpread && (
          <CircleMarker
            center={[guess.lat, guess.lng]}
            radius={12}
            pathOptions={{
              color: GUESS_PIN_COLOR,
              fillColor: GUESS_PIN_COLOR,
              fillOpacity: 0.6,
              weight: 4
            }}
          />
        )}
        {answer !== null && (
          <CircleMarker
            center={[answer.lat, answer.lng]}
            radius={12}
            pathOptions={{
              color: ANSWER_PIN_COLOR,
              fillColor: ANSWER_PIN_COLOR,
              fillOpacity: 0.6,
              weight: 4
            }}
          />
        )}
      </MapContainer>
      {isOffline && offlineNote !== undefined && (
        <p className={styles.offlineNote} data-geo-map-offline>
          {offlineNote}
        </p>
      )}
    </>
  );
};

export default GeoTheatreMap;
