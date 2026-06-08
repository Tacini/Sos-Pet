import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Navigation, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { searchService } from '../services';
import { Button, Input, Spinner } from '../components/ui';
import AnimalCard from '../components/ui/AnimalCard';
import ResultsMap from '../components/map/ResultsMap';
import styles from './SearchPage.module.css';
import {
  getCurrentLocation,
  getGeolocationErrorMessage,
  STANDARDIZED_COLORS,
} from '../utils/geolocationUtils';

const DEFAULT_CENTER = [-23.55, -46.63];
const RADIUS_OPTIONS = [5, 10, 20, 50];

function itemKey(item) {
  return `${item.isPet ? 'p' : 'r'}-${item.id}`;
}

export default function SearchPage() {
  const [urlParams] = useSearchParams();
  const initialTab = urlParams.get('tab') === 'found' ? 'found' : 'all';
  const cardRefs = useRef({});

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [animalType, setAnimalType] = useState('all');
  const [searchParams, setSearchParams] = useState({ city: '', breed: '', color: '' });
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [selectedKey, setSelectedKey] = useState(null);
  const [recenterOnUser, setRecenterOnUser] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const typeFilter = animalType !== 'all' ? animalType : undefined;
      const params = {
        type: typeFilter,
        city: searchParams.city || undefined,
        breed: searchParams.breed || undefined,
        color: searchParams.color || undefined,
      };

      if (userLocation) {
        params.lat = userLocation.latitude;
        params.lng = userLocation.longitude;
        params.radius = searchRadius;
      }

      const { data } = await searchService.search(params);
      const petsData = data.data?.pets || [];
      const reportsData = data.data?.reports || [];

      let combined = [
        ...petsData.map((p) => ({ ...p, isPet: true })),
        ...reportsData.map((r) => ({ ...r, isPet: false })),
      ];

      if (activeTab === 'lost') {
        combined = combined.filter((item) => item.isPet);
      } else if (activeTab === 'found') {
        combined = combined.filter((item) => !item.isPet);
      }

      setResults(combined);
      setSelectedKey(null);
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao carregar resultados.');
    } finally {
      setLoading(false);
    }
  }, [animalType, searchParams, userLocation, searchRadius, activeTab]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      setMapCenter([loc.latitude, loc.longitude]);
      setRecenterOnUser(true);
      toast.success(`Buscando num raio de ${searchRadius} km da sua localização.`);
    } catch (err) {
      toast.error(getGeolocationErrorMessage(err));
    } finally {
      setLocating(false);
    }
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setMapCenter(DEFAULT_CENTER);
    setRecenterOnUser(false);
    setSelectedKey(null);
  };

  const handleMapSelect = (item, key) => {
    setSelectedKey(key);
    setRecenterOnUser(false);
    cardRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const mappedCount = results.filter((item) => {
    const lat = parseFloat(item.isPet ? item.last_seen_latitude : item.latitude);
    const lng = parseFloat(item.isPet ? item.last_seen_longitude : item.longitude);
    return !Number.isNaN(lat) && !Number.isNaN(lng);
  }).length;

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.pageHeader}>
          <h1 className={styles.title}>Encontrar Animais</h1>
          <p className={styles.subtitle}>
            {userLocation
              ? `Mostrando resultados num raio de ${searchRadius} km da sua localização.`
              : 'Use o mapa, filtros ou sua localização para encontrar animais perdidos e avistados.'}
          </p>
        </header>

        <div className={styles.filterBar}>
          <div className={styles.filterBarInner}>
            <div className={styles.tabButtons}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'lost', label: 'Perdidos' },
                { id: 'found', label: 'Avistados' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.typeBtn} ${activeTab === id ? styles.typeBtnActive : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.typeButtons}>
              {['all', 'dog', 'cat', 'other'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.typeBtn} ${animalType === t ? styles.typeBtnActive : ''}`}
                  onClick={() => setAnimalType(t)}
                >
                  {t === 'all' ? 'Todos tipos' : t === 'dog' ? 'Cães' : t === 'cat' ? 'Gatos' : 'Outros'}
                </button>
              ))}
            </div>

            <div className={styles.filterActions}>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={16} /> Filtros
              </Button>
              <Button variant="outline" size="sm" onClick={handleUseMyLocation} loading={locating}>
                <Navigation size={16} /> Minha localização
              </Button>
              {userLocation && (
                <Button variant="ghost" size="sm" onClick={handleClearLocation}>
                  Limpar GPS
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className={styles.filtersPanel}>
              <div className={styles.filtersGrid}>
                <Input
                  label="Cidade"
                  value={searchParams.city}
                  onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
                />
                <Input
                  label="Raça"
                  value={searchParams.breed}
                  onChange={(e) => setSearchParams({ ...searchParams, breed: e.target.value })}
                />
                <div>
                  <label className={styles.selectLabel}>Cor</label>
                  <select
                    className={styles.select}
                    value={searchParams.color}
                    onChange={(e) => setSearchParams({ ...searchParams, color: e.target.value })}
                  >
                    <option value="">Todas</option>
                    {STANDARDIZED_COLORS.map((c) => (
                      <option key={c.id} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {userLocation && (
                <div className={styles.geoSection}>
                  <p className={styles.geoTitle}>
                    <MapPin size={15} /> Raio de busca
                  </p>
                  <div className={styles.radiusRow}>
                    {RADIUS_OPTIONS.map((km) => (
                      <button
                        key={km}
                        type="button"
                        className={`${styles.typeBtn} ${searchRadius === km ? styles.typeBtnActive : ''}`}
                        onClick={() => setSearchRadius(km)}
                      >
                        {km} km
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <section className={styles.mapSection}>
          <ResultsMap
            center={mapCenter}
            zoom={userLocation ? 14 : 12}
            results={results}
            userPosition={userLocation}
            radiusKm={userLocation ? searchRadius : null}
            selectedKey={selectedKey}
            onSelectItem={handleMapSelect}
            recenterOnUser={recenterOnUser}
          />
        </section>

        <section className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>
              {loading ? 'Carregando...' : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
            </h2>
            {!loading && mappedCount > 0 && (
              <span className={styles.resultsMeta}>{mappedCount} com localização no mapa</span>
            )}
          </div>

          {loading ? (
            <div className={styles.loadingWrap}>
              <Spinner size="lg" />
              <span>Buscando animais...</span>
            </div>
          ) : results.length > 0 ? (
            <div className={styles.grid}>
              {results.map((item) => {
                const key = itemKey(item);
                return (
                  <div
                    key={key}
                    ref={(el) => { cardRefs.current[key] = el; }}
                    className={selectedKey === key ? styles.cardHighlight : undefined}
                  >
                    <AnimalCard animal={item} type={item.isPet ? 'lost' : 'found'} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyResults}>
              Nenhum animal encontrado com esses filtros.
              {userLocation ? ' Tente aumentar o raio de busca.' : ' Ative sua localização ou refine os filtros.'}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
