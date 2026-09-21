import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap
} from "react-leaflet";

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
import { darkMapClassName, livePinMapClassName } from "../../mapTheme/index.js";
import * as styles from "./styles.js";

type GeoCoordinates = {
  lat: number;
  lng: number;
};

type GeoTheatreMapProps = {
  guess: GeoCoordinates | null;
  answer: GeoCoordinates | null;
};

// The map runs for the whole turn, so it has two jobs rather than one.
//
// While the team is still pinning it holds the whole world: the room is reading
// "are they anywhere near it", and a chart that zoomed to chase the pin would
// throw that reading away every time somebody moved it. Once the answer lands,
// the two pins are the only thing that matters and the map closes on them.
const FitToTurn = ({ guess, answer }: GeoTheatreMapProps): null => {
  const map = useMap();
  const guessLat = guess?.lat ?? null;
  const guessLng = guess?.lng ?? null;
  const answerLat = answer?.lat ?? null;
  const answerLng = answer?.lng ?? null;

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

      map.fitBounds(
        [
          [guessLat, guessLng],
          [answerLat, answerLng]
        ],
        { padding: REVEAL_FIT_PADDING, maxZoom: REVEAL_MAX_ZOOM }
      );
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
  }, [map, guessLat, guessLng, answerLat, answerLng]);

  return null;
};

export const GeoTheatreMap = ({
  guess,
  answer
}: GeoTheatreMapProps): JSX.Element => {
  const isRevealed = answer !== null;

  return (
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
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <FitToTurn guess={guess} answer={answer} />
      {guess !== null && answer !== null && (
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
      {guess !== null && (
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
  );
};

export default GeoTheatreMap;
