import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const GuessIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ActualIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
  disabled?: boolean;
}

function MapClickHandler({ onMapClick, disabled }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface FitBoundsProps {
  bounds: [[number, number], [number, number]] | null;
}

function FitBounds({ bounds }: FitBoundsProps) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (bounds && !fitted.current) {
      map.fitBounds(bounds, { padding: [50, 50] });
      fitted.current = true;
    }
  }, [bounds, map]);

  return null;
}

interface InteractiveMapProps {
  guessPosition: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  disabled?: boolean;
  className?: string;
}

export function InteractiveMap({
  guessPosition,
  onMapClick,
  disabled = false,
  className = '',
}: InteractiveMapProps) {
  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} disabled={disabled} />
        {guessPosition && (
          <Marker position={[guessPosition.lat, guessPosition.lng]} icon={GuessIcon}>
            <Popup>Your guess</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

interface ResultMapProps {
  guessPosition: { lat: number; lng: number } | null;
  actualPosition: { lat: number; lng: number };
  teamName?: string;
  className?: string;
}

export function ResultMap({
  guessPosition,
  actualPosition,
  teamName,
  className = '',
}: ResultMapProps) {
  // Calculate bounds to show both markers
  const bounds: [[number, number], [number, number]] | null = guessPosition
    ? [
        [
          Math.min(guessPosition.lat, actualPosition.lat),
          Math.min(guessPosition.lng, actualPosition.lng),
        ],
        [
          Math.max(guessPosition.lat, actualPosition.lat),
          Math.max(guessPosition.lng, actualPosition.lng),
        ],
      ]
    : null;

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        center={[actualPosition.lat, actualPosition.lng]}
        zoom={4}
        style={{ height: '100%', width: '100%', minHeight: '200px' }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <FitBounds bounds={bounds} />}
        {guessPosition && (
          <Marker position={[guessPosition.lat, guessPosition.lng]} icon={GuessIcon}>
            <Popup>{teamName ? `${teamName}'s guess` : 'Guess'}</Popup>
          </Marker>
        )}
        <Marker position={[actualPosition.lat, actualPosition.lng]} icon={ActualIcon}>
          <Popup>Actual location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
