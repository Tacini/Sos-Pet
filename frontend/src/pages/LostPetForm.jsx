import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle, PawPrint, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { petService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Textarea } from '../components/ui';
import styles from './LostPetForm.module.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CORES  = ['Preto', 'Branco', 'Caramelo', 'Cinza', 'Marrom', 'Amarelo', 'Mesclado', 'Rajado'];
const IDADES = ['Até 1 ano', '1 a 3 anos', '3 a 6 anos', '7 a 10 anos', '11 a 14 anos', '15 anos ou mais'];
const RACAS  = {
  dog: ['Vira-lata', 'Labrador', 'Golden Retriever', 'Poodle', 'Bulldog', 'Pastor Alemão', 'Shih Tzu', 'Outro'],
  cat: ['Vira-lata', 'Siamês', 'Persa', 'Maine Coon', 'Angorá', 'Bengal', 'Ragdoll', 'Outro'],
};

// Captura cliques e centraliza no marcador
function MapController({ coords, onMapClick }) {
  const map = useMap();
  useMapEvents({
    click(e) { onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  if (coords) map.setView([coords.lat, coords.lng]);
  return null;
}

// Componente do mapa isolado para evitar problemas de re-render
function LeafletMap({ coords, onMapClick, onMapReady }) {
  return (
    <MapContainer
      center={[-23.55, -46.63]}
      zoom={13}
      className={styles.map}
      whenReady={onMapReady}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      <MapController coords={coords} onMapClick={onMapClick} />
      {coords && <Marker position={[coords.lat, coords.lng]} />}
    </MapContainer>
  );
}

export default function LostPetForm() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const fileInputRef = useRef();
  const leafletMap   = useRef(null);

  const [photos, setPhotos]         = useState([]);
  const [previews, setPreviews]     = useState([]);
  const [submitted, setSubmitted]   = useState(false);
  const [animalType, setAnimalType] = useState('');
  const [outroTipo, setOutroTipo]   = useState('');
  const [coresSel, setCoresSel]     = useState([]);
  const [racasSel, setRacasSel]     = useState([]);
  const [outraRaca, setOutraRaca]   = useState('');
  const [idadeSel, setIdadeSel]     = useState('');
  const [mapCoords, setMapCoords]   = useState(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { contact_email: user?.email || '' },
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocalização não suportada.'); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const pos = { lat: coords.latitude, lng: coords.longitude };
      setMapCoords(pos);
      if (leafletMap.current) leafletMap.current.setView([pos.lat, pos.lng], 15);
      toast.success('Localização obtida!');
    }, () => toast.error('Não foi possível obter sua localização.'));
  };

  const toggleCor = (cor) =>
    setCoresSel((prev) => prev.includes(cor) ? prev.filter((c) => c !== cor) : [...prev, cor]);

  const toggleRaca = (raca) => {
    if (racasSel.includes(raca)) {
      setRacasSel((prev) => prev.filter((r) => r !== raca));
      if (raca === 'Outro') setOutraRaca('');
    } else {
      if (racasSel.length >= 3) { toast('Máximo de 3 raças.', { icon: '⚠️' }); return; }
      setRacasSel((prev) => [...prev, raca]);
    }
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
    if (valid.length < files.length) toast.error('Algumas fotos foram ignoradas (máx. 5MB cada).');
    const combined = [...photos, ...valid].slice(0, 5);
    setPhotos(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (i) => {
    const next = photos.filter((_, idx) => idx !== i);
    setPhotos(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const onSubmit = async (data) => {
    if (!animalType) { toast.error('Selecione o tipo do animal.'); return; }
    if (animalType === 'other' && !outroTipo.trim()) { toast.error('Descreva o tipo do animal.'); return; }
    if (coresSel.length === 0) { toast.error('Selecione ao menos uma cor.'); return; }

    const racasFinais = racasSel.map((r) => r === 'Outro' ? outraRaca.trim() : r).filter(Boolean);

    const formData = new FormData();
    photos.forEach((f) => formData.append('photos', f));
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') formData.append(k, v);
    });
    formData.append('type',  animalType === 'other' ? outroTipo.trim() : animalType);
    formData.append('color', coresSel.join(', '));
    if (racasFinais.length) formData.append('breed', racasFinais.join(', '));
    if (idadeSel) formData.append('approximate_age', idadeSel);
    if (mapCoords) {
      formData.append('last_seen_latitude',  String(mapCoords.lat));
      formData.append('last_seen_longitude', String(mapCoords.lng));
    }

    try {
      await petService.create(formData);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao criar anúncio. Tente novamente.');
    }
  };

  if (submitted) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h2 className={styles.successTitle}>Anúncio criado!</h2>
          <p className={styles.successDesc}>Seu anúncio está no ar. Torçemos para que seu pet volte logo para casa. 🏠</p>
          <div className={styles.successActions}>
            <Button variant="primary" onClick={() => navigate('/busca')}>Ver anúncios</Button>
            <Button variant="outline" onClick={() => navigate('/meu-pet')}>Meus anúncios</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <PawPrint size={28} className={styles.headerIcon} />
          <h1 className={styles.title}>Anunciar pet perdido</h1>
          <p className={styles.subtitle}>Preencha o máximo de informações possível</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>

          {/* ── Fotos ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📷 Fotos do animal</h2>
            <p className={styles.sectionDesc}>Adicione até 5 fotos. Quanto mais, melhor!</p>
            <div className={styles.photoGrid}>
              {previews.map((src, i) => (
                <div key={i} className={styles.photoThumb}>
                  <img src={src} alt={`Foto ${i + 1}`} />
                  <button type="button" onClick={() => removePhoto(i)} className={styles.removeBtn}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <div className={styles.addPhoto} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={24} />
                  <span>Adicionar foto</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
          </section>

          {/* ── Dados do animal ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🐾 Dados do animal</h2>

            <Input
              label="Nome do animal *"
              placeholder="ex: Bolinha"
              error={errors.name?.message}
              {...register('name', { required: 'Nome é obrigatório' })}
            />

            {/* Tipo */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tipo *</label>
              <div className={styles.radioRow}>
                {[
                  { value: 'dog',   label: '🐕 Cachorro' },
                  { value: 'cat',   label: '🐈 Gato'     },
                  { value: 'other', label: '🐾 Outro'    },
                ].map(({ value, label }) => (
                  <label key={value} className={`${styles.radioChip} ${animalType === value ? styles.radioChipActive : ''}`}>
                    <input type="radio" name="type_radio" value={value} checked={animalType === value}
                      onChange={() => { setAnimalType(value); setRacasSel([]); setOutroTipo(''); setOutraRaca(''); }} />
                    {label}
                  </label>
                ))}
              </div>
              {animalType === 'other' && (
                <input className={styles.outroInput} type="text" autoFocus
                  placeholder="Qual animal? ex: Coelho, Hamster, Pássaro..."
                  value={outroTipo} onChange={(e) => setOutroTipo(e.target.value)} />
              )}
            </div>

            {/* Raça */}
            {RACAS[animalType] && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Raça <span className={styles.fieldHint}>· selecione até 3</span>
                </label>
                {racasSel.length >= 3 && <p className={styles.limitWarning}>⚠️ Máximo de 3 raças atingido</p>}
                <div className={styles.checkGrid}>
                  {RACAS[animalType].map((raca) => (
                    <label key={raca} className={`${styles.checkChip} ${racasSel.includes(raca) ? styles.checkChipActive : ''}`}>
                      <input type="checkbox" checked={racasSel.includes(raca)} onChange={() => toggleRaca(raca)} />
                      {raca}
                    </label>
                  ))}
                </div>
                {racasSel.includes('Outro') && (
                  <input className={styles.outroInput} type="text" autoFocus
                    placeholder="Qual a raça? ex: Akita, Sphynx..."
                    value={outraRaca} onChange={(e) => setOutraRaca(e.target.value)} />
                )}
              </div>
            )}

            {/* Cor */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Cor(es) *</label>
              <div className={styles.checkGrid}>
                {CORES.map((cor) => (
                  <label key={cor} className={`${styles.checkChip} ${coresSel.includes(cor) ? styles.checkChipActive : ''}`}>
                    <input type="checkbox" checked={coresSel.includes(cor)} onChange={() => toggleCor(cor)} />
                    {cor}
                  </label>
                ))}
              </div>
            </div>

            {/* Idade */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Idade aproximada</label>
              <div className={styles.checkGrid}>
                {IDADES.map((idade) => (
                  <label key={idade} className={`${styles.checkChip} ${idadeSel === idade ? styles.checkChipActive : ''}`}>
                    <input type="checkbox" checked={idadeSel === idade}
                      onChange={() => setIdadeSel(idadeSel === idade ? '' : idade)} />
                    {idade}
                  </label>
                ))}
              </div>
            </div>

            <Textarea
              label="Descrição"
              placeholder="Detalhes que ajudem a identificar o animal: manchas, coleira, comportamento, microchip..."
              rows={4}
              {...register('description')}
            />
          </section>

          {/* ── Localização ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📍 Último local visto</h2>

            <Textarea
              label="Endereço / Descrição do local *"
              placeholder="ex: Rua das Flores, 123, próximo ao parque, Jardim Europa, São Paulo"
              rows={3}
              error={errors.last_seen_location?.message}
              {...register('last_seen_location', { required: 'Local é obrigatório' })}
            />

            <div className={styles.grid}>
              <Input label="Cidade" placeholder="São Paulo" {...register('city')} />
              <Input label="Bairro" placeholder="Jardim Europa" {...register('neighborhood')} />
            </div>

            {/* Mapa */}
            <div className={styles.mapWrap}>
              <div className={styles.mapHeader}>
                <p className={styles.mapLabel}>📌 Clique no mapa para marcar o local</p>
                <button type="button" className={styles.locationBtn} onClick={useMyLocation}>
                  <MapPin size={14} /> Usar minha localização
                </button>
              </div>
              <LeafletMap
                coords={mapCoords}
                onMapClick={setMapCoords}
                onMapReady={(map) => { leafletMap.current = map.target; }}
              />
              {mapCoords && (
                <p className={styles.coordsInfo}>
                  ✅ Local marcado · {mapCoords.lat.toFixed(5)}, {mapCoords.lng.toFixed(5)}
                </p>
              )}
            </div>
          </section>

          {/* ── Contato ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📞 Contato</h2>
            <div className={styles.grid}>
              <Input label="Telefone / WhatsApp" placeholder="(11) 99999-9999" {...register('contact_phone')} />
              <Input label="E-mail de contato" type="email" {...register('contact_email')} />
            </div>
            <Input
              label="Informação sobre recompensa (opcional)"
              placeholder="ex: Recompensa para quem encontrar!"
              {...register('reward_info')}
            />
          </section>

          {/* ── Submit ── */}
          <div className={styles.submitWrap}>
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              Publicar anúncio 🐾
            </Button>
            <p className={styles.submitNote}>Seu anúncio ficará visível para todos que buscam na plataforma.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
