import { useEffect, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMapEvents
} from "react-leaflet";
import type { GeoMinigameDisplayPin } from "@wingnight/shared";

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
import { GeoGraticule } from "../../GeoGraticule/index.js";
import { GeoPinMarkers } from "../../GeoPinMarkers/index.js";
import { darkMapClassName } from "../../mapTheme/index.js";
import { useTileOffline } from "../../useTileOffline/index.js";
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
  // Every pin the lock measured, drawn named on the reveal (the tablet's and the phones'). Empty
  // while the photo is open: a phone's pin never reaches the tablet before the lock.
  revealPins?: readonly GeoMinigameDisplayPin[];
  // What the chart says when the tile server cannot be reached — the tablet and a phone point at
  // different fallbacks, so the surface that mounts the map words it.
  offlineNote: string;
  // Where the quick views and zoom ride: up the right edge on the tablet (a thumb rests there and
  // both right-hand corners are spoken for), along the foot on a phone, whose chart is too narrow
  // to give an edge away to them.
  layout?: "tablet" | "phone";
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

const NO_PINS: readonly GeoMinigameDisplayPin[] = [];

export const GeoGuessMap = ({
  guess,
  answer,
  onSelectLocation,
  revealPins = NO_PINS,
  offlineNote,
  layout = "tablet"
}: GeoGuessMapProps): JSX.Element => {
  const [map, setMap] = useState<LeafletMap | null>(null);
  // No route to OSM right now: the chart keeps working on its dark ground and graticule, and the
  // note says why it is bare — until a tile lands again.
  const { isOffline, tileEventHandlers } = useTileOffline();
  const isRevealed = answer !== null;
  const answerLat = answer?.lat ?? null;
  const answerLng = answer?.lng ?? null;
  const guessLat = guess?.lat ?? null;
  const guessLng = guess?.lng ?? null;
  // Every pin the reveal draws, as one string, so the fit below re-runs only when they move.
  const revealPinsKey = revealPins.map((pin) => `${pin.lat},${pin.lng}`).join(";");

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

    const pinPoints = revealPinsKey
      .split(";")
      .filter((entry) => entry.length > 0)
      .map((entry): [number, number] => {
        const [lat, lng] = entry.split(",").map(Number);

        return [lat ?? 0, lng ?? 0];
      });

    map.fitBounds(
      [[guessLat, guessLng], [answerLat, answerLng], ...pinPoints],
      { padding: REVEAL_FIT_PADDING, maxZoom: REVEAL_MAX_ZOOM }
    );
  }, [map, guessLat, guessLng, answerLat, answerLng, revealPinsKey]);

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
        <TileLayer
          url={OSM_TILE_URL}
          attribution={OSM_ATTRIBUTION}
          eventHandlers={tileEventHandlers}
        />
        <GeoGraticule />
        {!isRevealed && <MapClickHandler onSelectLocation={onSelectLocation} />}
        {revealPins.length > 0 && <GeoPinMarkers pins={revealPins} />}
        {guess !== null && answer !== null && revealPins.length === 0 && (
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
        {guess !== null && revealPins.length === 0 && (
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

      {isOffline && (
        <p className={layout === "phone" ? styles.offlineNotePhone : styles.offlineNote} data-geo-map-offline>
          {offlineNote}
        </p>
      )}

      {/* A sibling of the map, not a child of it: Leaflet's click handler lives
          on the map container, so a tap here never lands a guess pin. It rides
          the right edge because the tablet's top-right belongs to the shell's
          timer chip and its bottom-right to the corner dock (§2.0A). */}
      <div className={layout === "phone" ? styles.controlRow : styles.controlStrip}>
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
