import { useEffect, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMapEvents
} from "react-leaflet";

import {
  ANSWER_PIN_COLOR,
  CONNECTION_LINE_COLOR,
  GEO_MAP_VIEW_FLY_SECONDS,
  GEO_MAP_VIEWS,
  GUESS_PIN_COLOR,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  REVEAL_FIT_PADDING,
  REVEAL_MAX_ZOOM,
  WORLD_BOUNDS,
  WORLD_CENTER,
  WORLD_ZOOM
} from "../../leafletConstants/index.js";
import { darkMapClassName } from "../../mapTheme/index.js";
import { hostGeoSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

type GeoCoordinates = {
  lat: number;
  lng: number;
};

type GeoGuessMapProps = {
  guess: GeoCoordinates | null;
  answer: GeoCoordinates | null;
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
  answer,
  onSelectLocation
}: GeoGuessMapProps): JSX.Element => {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const isRevealed = answer !== null;
  const answerLat = answer?.lat ?? null;
  const answerLng = answer?.lng ?? null;
  const guessLat = guess?.lat ?? null;
  const guessLng = guess?.lng ?? null;

  // Only on the reveal. While the guess is still open the team owns the view —
  // a map that re-centred itself every time somebody moved the pin would take
  // the chart out from under the hand placing it.
  useEffect(() => {
    if (
      map === null ||
      answerLat === null ||
      answerLng === null ||
      guessLat === null ||
      guessLng === null
    ) {
      return;
    }

    map.fitBounds(
      [
        [guessLat, guessLng],
        [answerLat, answerLng]
      ],
      { padding: REVEAL_FIT_PADDING, maxZoom: REVEAL_MAX_ZOOM }
    );
  }, [map, guessLat, guessLng, answerLat, answerLng]);

  return (
    <div className={styles.root}>
      {/* Pinned to one world: without bounds the chart could be dragged past
          the poles and show a bare grey band under the map, which read as
          broken. Leaflet's own zoom control is off — its white browser chrome
          is exactly the foreign furniture this surface is getting rid of, and
          the strip below replaces it in the show's own clothes. */}
      <MapContainer
        ref={setMap}
        center={WORLD_CENTER}
        zoom={WORLD_ZOOM}
        minZoom={WORLD_ZOOM}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={1}
        zoomControl={false}
        className={`${styles.map} ${darkMapClassName}`}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        {!isRevealed && <MapClickHandler onSelectLocation={onSelectLocation} />}
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
            radius={10}
            pathOptions={{
              color: GUESS_PIN_COLOR,
              fillColor: GUESS_PIN_COLOR,
              fillOpacity: 0.6,
              weight: 3
            }}
          />
        )}
        {answer !== null && (
          <CircleMarker
            center={[answer.lat, answer.lng]}
            radius={10}
            pathOptions={{
              color: ANSWER_PIN_COLOR,
              fillColor: ANSWER_PIN_COLOR,
              fillOpacity: 0.6,
              weight: 3
            }}
          />
        )}
      </MapContainer>

      {/* A sibling of the map, not a child of it: Leaflet's click handler lives
          on the map container, so a tap here never lands a guess pin. It rides
          the right edge because the tablet's top-right belongs to the shell's
          timer chip and its bottom-right to the corner dock (§2.0A). */}
      <div className={styles.controlStrip}>
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
        <button
          className={styles.zoomButton}
          type="button"
          aria-label={hostGeoSurfaceCopy.zoomInLabel}
          onClick={(): void => {
            map?.zoomIn();
          }}
        >
          {hostGeoSurfaceCopy.zoomInGlyph}
        </button>
        <button
          className={styles.zoomButton}
          type="button"
          aria-label={hostGeoSurfaceCopy.zoomOutLabel}
          onClick={(): void => {
            map?.zoomOut();
          }}
        >
          {hostGeoSurfaceCopy.zoomOutGlyph}
        </button>
      </div>
    </div>
  );
};

export default GeoGuessMap;
