import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './LocationMap.module.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = L.divIcon({
  className: styles.userDot,
  html: '<div class="user-dot-pulse"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapResizeHandler({ active }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return undefined;

    const fix = () => {
      map.invalidateSize({ animate: false });
    };

    fix();
    const t1 = setTimeout(fix, 150);
    const t2 = setTimeout(fix, 500);

    const observer = new ResizeObserver(fix);
    const container = map.getContainer();
    if (container) observer.observe(container);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, [active, map]);

  return null;
}

function MapRecenter({ center, zoom }) {
  const map = useMap();
  const prev = useRef(null);

  useEffect(() => {
    if (!center) return;
    const key = `${center[0]},${center[1]},${zoom}`;
    if (prev.current === key) return;
    prev.current = key;
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center, zoom, map]);

  return null;
}

function DraggableMarker({ position, onDragEnd }) {
  if (!position) return null;

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onDragEnd({ lat, lng });
        },
      }}
    />
  );
}

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationMap({
  lat,
  lng,
  zoom = 15,
  height = '280px',
  active = true,
  onPositionChange,
  userPosition = null,
  className = '',
}) {
  const center = [lat, lng];
  const position = lat != null && lng != null ? [lat, lng] : null;

  return (
    <div className={`${styles.wrap} ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className={styles.map}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        <MapResizeHandler active={active} />
        <MapRecenter center={center} zoom={zoom} />
        <MapClickHandler onClick={onPositionChange} />
        <DraggableMarker position={position} onDragEnd={onPositionChange} />
        {userPosition && (
          <Marker
            position={[userPosition.latitude, userPosition.longitude]}
            icon={userIcon}
          />
        )}
      </MapContainer>
    </div>
  );
}
