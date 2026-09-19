import { useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMapEvents
} from "react-leaflet";

import {
  GEO_MAP_VIEW_FLY_SECONDS,
  GEO_MAP_VIEWS,
  GUESS_PIN_COLOR,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  WORLD_BOUNDS,
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
  const [map, setMap] = useState<LeafletMap | null>(null);

  return (
    <div className={styles.root}>
      {/* Pinned to one world: without bounds the chart could be dragged past
          the poles and show a bare grey band under the map, which read as
          broken. */}
      <MapContainer
        ref={setMap}
        center={WORLD_CENTER}
        zoom={WORLD_ZOOM}
        minZoom={WORLD_ZOOM}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={1}
        className={styles.map}
      >
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
      {/* A sibling of the map, not a child of it: Leaflet's click handler lives
          on the map container, so a tap here never lands a guess pin. */}
      <div className={styles.viewStrip}>
        {GEO_MAP_VIEWS.map((view) => (
          <button
            key={view.id}
            className={styles.viewButton}
            type="button"
            onClick={(): void => {
              map?.flyTo(view.center, view.zoom, {
                duration: GEO_MAP_VIEW_FLY_SECONDS
              });
            }}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GeoGuessMap;
