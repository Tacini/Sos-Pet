import { Navigation, Loader2 } from 'lucide-react';
import LocationMap from './LocationMap';
import { formatAddressLine } from '../../utils/geolocationUtils';
import styles from './LocationPicker.module.css';

export default function LocationPicker({
  lat,
  lng,
  address,
  locating = false,
  active = true,
  onUseMyLocation,
  onPositionChange,
  mapHeight = '280px',
  hint = 'Clique no mapa, arraste o marcador ou use o GPS',
}) {
  const addressLine = formatAddressLine(address);
  const coordsLine = lat != null && lng != null
    ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
    : '';

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <p className={styles.hint}>📌 {hint}</p>
        <button
          type="button"
          className={styles.locationBtn}
          onClick={onUseMyLocation}
          disabled={locating}
        >
          {locating ? <Loader2 size={14} className={styles.spin} /> : <Navigation size={14} />}
          {locating ? 'Localizando...' : 'Minha localização'}
        </button>
      </div>

      <LocationMap
        lat={lat}
        lng={lng}
        active={active}
        height={mapHeight}
        onPositionChange={onPositionChange}
      />

      <div className={styles.status}>
        {locating && <p className={styles.statusLoading}>🔍 Buscando localização e endereço...</p>}
        {!locating && (addressLine || coordsLine) && (
          <p className={styles.statusOk}>
            ✅ {addressLine || coordsLine}
          </p>
        )}
        {!locating && !addressLine && !coordsLine && (
          <p className={styles.statusHint}>Marque no mapa onde o animal foi avistado.</p>
        )}
      </div>
    </div>
  );
}
