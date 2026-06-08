import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './ResultsMap.module.css';

const lostIcon = L.divIcon({
  className: styles.markerWrap,
  html: '<div class="map-pin map-pin-lost"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const avistadoIcon = L.divIcon({
  className: styles.markerWrap,
  html: '<div class="map-pin map-pin-avistado"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const userIcon = L.divIcon({
  className: styles.markerWrap,
  html: '<div class="user-dot-pulse"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function getItemCoords(item) {
  const lat = parseFloat(item.isPet ? item.last_seen_latitude : item.latitude);
  const lng = parseFloat(item.isPet ? item.last_seen_longitude : item.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const fix = () => map.invalidateSize({ animate: false });
    fix();
    const t = setTimeout(fix, 200);
    const observer = new ResizeObserver(fix);
    observer.observe(map.getContainer());
    return () => {
      clearTimeout(t);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

function FitBounds({ points, userPosition, radiusKm }) {
  const map = useMap();
  const prevKey = useRef('');

  useEffect(() => {
    const latlngs = points.map((p) => [p.lat, p.lng]);

    if (userPosition) {
      latlngs.push([userPosition.latitude, userPosition.longitude]);
    }

    if (!latlngs.length) return;

    const key = `${latlngs.length}-${radiusKm}-${userPosition?.latitude}`;
    if (prevKey.current === key) return;
    prevKey.current = key;

    if (latlngs.length === 1 && userPosition && radiusKm) {
      map.setView(latlngs[0], 13, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true });
  }, [points, userPosition, radiusKm, map]);

  return null;
}

function MapRecenter({ center, zoom, force }) {
  const map = useMap();
  const prev = useRef(null);

  useEffect(() => {
    if (!center || !force) return;
    const key = `${center[0]},${center[1]},${zoom}`;
    if (prev.current === key) return;
    prev.current = key;
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center, zoom, force, map]);

  return null;
}

export default function ResultsMap({
  center,
  zoom = 13,
  results = [],
  userPosition = null,
  radiusKm = null,
  selectedKey = null,
  onSelectItem,
  recenterOnUser = false,
}) {
  const navigate = useNavigate();

  const mappedItems = useMemo(
    () => results
      .map((item) => {
        const coords = getItemCoords(item);
        if (!coords) return null;
        return { item, ...coords, key: `${item.isPet ? 'p' : 'r'}-${item.id}` };
      })
      .filter(Boolean),
    [results]
  );

  const withoutCoords = results.length - mappedItems.length;

  return (
    <div className={styles.shell}>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendLost}`} /> Perdido
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendAvistado}`} /> Avistado
        </span>
        {userPosition && (
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendYou}`} /> Você
          </span>
        )}
      </div>

      {mappedItems.length > 0 && (
        <div className={styles.badge}>
          {mappedItems.length} no mapa
          {withoutCoords > 0 && ` · ${withoutCoords} sem localização`}
        </div>
      )}

      <div className={styles.wrap}>
        <MapContainer center={center} zoom={zoom} className={styles.map} scrollWheelZoom>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          <MapResizeHandler />
          <FitBounds points={mappedItems} userPosition={userPosition} radiusKm={radiusKm} />
          <MapRecenter
            center={center}
            zoom={zoom}
            force={recenterOnUser && mappedItems.length === 0}
          />

          {userPosition && radiusKm && (
            <Circle
              center={[userPosition.latitude, userPosition.longitude]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#2563eb',
                fillOpacity: 0.08,
                weight: 2,
                dashArray: '6 4',
              }}
            />
          )}

          {userPosition && (
            <Marker position={[userPosition.latitude, userPosition.longitude]} icon={userIcon}>
              <Popup>Você está aqui</Popup>
            </Marker>
          )}

          {mappedItems.map(({ item, lat, lng, key }) => {
            const isSelected = selectedKey === key;
            const icon = item.isPet ? lostIcon : avistadoIcon;
            const title = item.isPet ? item.name : 'Animal avistado';
            const subtitle = item.isPet
              ? [item.breed, item.color].filter(Boolean).join(' · ')
              : [item.animal_color, item.animal_type].filter(Boolean).join(' · ');
            const detailPath = item.isPet ? `/pets/${item.id}` : `/relatos/${item.id}`;

            return (
              <Marker
                key={key}
                position={[lat, lng]}
                icon={icon}
                zIndexOffset={isSelected ? 1000 : 0}
                eventHandlers={{
                  click: () => onSelectItem?.(item, key),
                }}
              >
                <Popup>
                  <div className={styles.popup}>
                    <strong>{title}</strong>
                    {subtitle && <p className={styles.popupMeta}>{subtitle}</p>}
                    <p className={styles.popupType}>
                      {item.isPet ? '🐾 Perdido' : '📍 Avistado'}
                    </p>
                    <button
                      type="button"
                      className={styles.popupBtn}
                      onClick={() => navigate(detailPath)}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {results.length > 0 && mappedItems.length === 0 && (
        <p className={styles.emptyMap}>
          Nenhum resultado com coordenadas para exibir no mapa. Use &quot;Minha localização&quot; ou ajuste os filtros.
        </p>
      )}
    </div>
  );
}
