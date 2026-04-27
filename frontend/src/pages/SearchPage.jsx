import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { searchService } from '../services';
import AnimalCard from '../components/ui/AnimalCard';
import { Button, Input, Select, Spinner, Empty } from '../components/ui';
import styles from './SearchPage.module.css';

const ANIMAL_TYPES = [
  { value: '', label: 'Todos os animais' },
  { value: 'dog',    label: '🐕 Cachorros' },
  { value: 'cat',    label: '🐈 Gatos' },
  { value: 'bird',   label: '🐦 Pássaros' },
  { value: 'rabbit', label: '🐇 Coelhos' },
  { value: 'other',  label: 'Outros' },
];

const RADII = [
  { value: '2',  label: '2 km' },
  { value: '5',  label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [pets, setPets]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [locating, setLocating]   = useState(false);

  const [filters, setFilters] = useState({
    type:   searchParams.get('type')   || '',
    color:  searchParams.get('color')  || '',
    breed:  searchParams.get('breed')  || '',
    city:   searchParams.get('city')   || '',
    lat:    searchParams.get('lat')    || '',
    lng:    searchParams.get('lng')    || '',
    radius: searchParams.get('radius') || '5',
  });

  const fetchResults = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
      const { data } = await searchService.search(params);
      setPets(data.data.pets || []);
    } catch (err) {
      console.error(err);
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(filters);
  }, []);

  const handleFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const applyFilters = () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    setSearchParams(params);
    fetchResults(filters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const reset = { type: '', color: '', breed: '', city: '', lat: '', lng: '', radius: '5' };
    setFilters(reset);
    setSearchParams({});
    fetchResults(reset);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada neste navegador.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const updated = { ...filters, lat: String(coords.latitude.toFixed(6)), lng: String(coords.longitude.toFixed(6)) };
        setFilters(updated);
        setLocating(false);
      },
      () => {
        alert('Não foi possível obter sua localização.');
        setLocating(false);
      }
    );
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => v !== '' && k !== 'radius'
  );

  return (
    <div className={styles.page}>
      <div className="container">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Buscar animais perdidos</h1>
          <p className={styles.subtitle}>
            {pets.length > 0
              ? `${pets.length} resultado${pets.length !== 1 ? 's' : ''} encontrado${pets.length !== 1 ? 's' : ''}`
              : 'Use os filtros para refinar sua busca'}
          </p>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────── */}
        <div className={styles.filterBar}>
          <div className={styles.filterBarInner}>
            {/* Quick type select */}
            <div className={styles.typeButtons}>
              {ANIMAL_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  className={`${styles.typeBtn} ${filters.type === value ? styles.typeBtnActive : ''}`}
                  onClick={() => handleFilter('type', value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.filterActions}>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X size={14} /> Limpar
                </Button>
              )}
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={15} /> Filtros
              </Button>
              <Button variant="primary" size="sm" onClick={applyFilters}>
                <Search size={15} /> Buscar
              </Button>
            </div>
          </div>

          {/* Extended filters panel */}
          {showFilters && (
            <div className={styles.filtersPanel}>
              <div className={styles.filtersGrid}>
                <Input
                  label="Cor"
                  placeholder="ex: preto, caramelo"
                  value={filters.color}
                  onChange={(e) => handleFilter('color', e.target.value)}
                />
                <Input
                  label="Raça"
                  placeholder="ex: Labrador"
                  value={filters.breed}
                  onChange={(e) => handleFilter('breed', e.target.value)}
                />
                <Input
                  label="Cidade"
                  placeholder="ex: São Paulo"
                  value={filters.city}
                  onChange={(e) => handleFilter('city', e.target.value)}
                />
              </div>

              <div className={styles.geoSection}>
                <p className={styles.geoTitle}>📍 Buscar por raio de distância</p>
                <div className={styles.geoRow}>
                  <Input
                    label="Latitude"
                    placeholder="-23.550520"
                    value={filters.lat}
                    onChange={(e) => handleFilter('lat', e.target.value)}
                  />
                  <Input
                    label="Longitude"
                    placeholder="-46.633308"
                    value={filters.lng}
                    onChange={(e) => handleFilter('lng', e.target.value)}
                  />
                  <Select
                    label="Raio"
                    value={filters.radius}
                    onChange={(e) => handleFilter('radius', e.target.value)}
                  >
                    {RADII.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={useMyLocation}
                  loading={locating}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <MapPin size={15} />
                  {locating ? 'Localizando…' : 'Usar minha localização'}
                </Button>
                {filters.lat && filters.lng && (
                  <p className={styles.coordsInfo}>
                    ✅ Coordenadas definidas · buscando em raio de {filters.radius}km
                  </p>
                )}
              </div>

              <Button variant="primary" onClick={applyFilters} style={{ alignSelf: 'flex-end' }}>
                Aplicar filtros
              </Button>
            </div>
          )}
        </div>

        {/* ── Results ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className={styles.loadingWrap}>
            <Spinner size="lg" />
            <p>Buscando animais...</p>
          </div>
        ) : pets.length === 0 ? (
          <Empty
            icon="🔍"
            title="Nenhum resultado encontrado"
            description="Tente ajustar os filtros ou ampliar o raio de busca."
          />
        ) : (
          <div className={styles.grid}>
            {pets.map((pet, i) => (
              <div
                key={pet.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <AnimalCard animal={pet} type="lost" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
