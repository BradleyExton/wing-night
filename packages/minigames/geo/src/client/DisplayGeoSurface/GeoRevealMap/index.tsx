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
import * as styles from "./styles.js";

type GeoRevealMapProps = {
  guess: { lat: number; lng: number };
  answer: { lat: number; lng: number };
};

const FitRevealBounds = ({ guess, answer }: GeoRevealMapProps): null => {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(
      [
        [guess.lat, guess.lng],
        [answer.lat, answer.lng]
      ],
      { padding: REVEAL_FIT_PADDING, maxZoom: REVEAL_MAX_ZOOM }
    );
  }, [map, guess.lat, guess.lng, answer.lat, answer.lng]);

  return null;
};

export const GeoRevealMap = ({ guess, answer }: GeoRevealMapProps): JSX.Element => {
  return (
    <MapContainer
      center={WORLD_CENTER}
      zoom={WORLD_ZOOM}
      className={styles.map}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <FitRevealBounds guess={guess} answer={answer} />
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
    </MapContainer>
  );
};

export default GeoRevealMap;
