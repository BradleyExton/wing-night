import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMapEvents
} from "react-leaflet";

import {
  GUESS_PIN_COLOR,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  WORLD_CENTER,
  WORLD_ZOOM
} from "../../leafletConstants/index.js";
import * as styles from "./styles.js";

type GeoGuessMapProps = {
  guess: { lat: number; lng: number } | null;
  onSelectLocation: (lat: number, lng: number) => void;
};

const MapClickHandler = ({
  onSelectLocation
}: Pick<GeoGuessMapProps, "onSelectLocation">): null => {
  useMapEvents({
    click: (event): void => {
      onSelectLocation(event.latlng.lat, event.latlng.lng);
    }
  });

  return null;
};

export const GeoGuessMap = ({
  guess,
  onSelectLocation
}: GeoGuessMapProps): JSX.Element => {
  return (
    <MapContainer center={WORLD_CENTER} zoom={WORLD_ZOOM} className={styles.map}>
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <MapClickHandler onSelectLocation={onSelectLocation} />
      {guess !== null && (
        <CircleMarker
          center={[guess.lat, guess.lng]}
          radius={10}
          pathOptions={{
            color: GUESS_PIN_COLOR,
            fillColor: GUESS_PIN_COLOR,
            fillOpacity: 0.6,
            weight: 3
          }}
        />
      )}
    </MapContainer>
  );
};

export default GeoGuessMap;
