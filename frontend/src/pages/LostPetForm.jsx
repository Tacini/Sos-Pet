import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle, PawPrint } from 'lucide-react';
import toast from 'react-hot-toast';

import { petService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Textarea } from '../components/ui';
import LocationPicker from '../components/map/LocationPicker';
import styles from './LostPetForm.module.css';
import {
  getCurrentLocationAndAddress,
  reverseGeocode,
  getGeolocationErrorMessage,
  STANDARDIZED_COLORS,
  EMPTY_ADDRESS,
} from '../utils/geolocationUtils';

const IDADES = ['Até 1 ano', '1 a 3 anos', '3 a 6 anos', '7 a 10 anos', '11 a 14 anos', '15 anos ou mais'];

const BREEDS_BY_TYPE = {
  dog:   ['SRD', 'Poodle', 'Pinscher', 'Labrador', 'Golden Retriever', 'Pastor Alemão', 'Bulldog', 'Beagle', 'Shih Tzu', 'Yorkshire', 'Outro'],
  cat:   ['SRD', 'Siamês', 'Persa', 'Maine Coon', 'Angorá', 'Bengal', 'Ragdoll', 'Sphynx', 'Munchkin', 'Outro'],
  other: ['Outro'],
};

export default function LostPetForm() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const fileInputRef = useRef();

  const [photos, setPhotos]       = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [locating, setLocating]   = useState(false);

  const [animalType, setAnimalType] = useState('dog');
  const [coresSel, setCoresSel]     = useState([]);
  const [racasSel, setRacasSel]     = useState([]);
  const [idadeSel, setIdadeSel]     = useState('');

  const [mapCoords, setMapCoords] = useState({ lat: -23.55052, lng: -46.633308 });
  const [address, setAddress]     = useState({ ...EMPTY_ADDRESS });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { contact_email: user?.email || '', name: '', description: '', contact_phone: '', reward_info: '' },
  });

  useEffect(() => { setRacasSel([]); }, [animalType]);

  useEffect(() => () => { previews.forEach((url) => URL.revokeObjectURL(url)); }, [previews]);

  // ── Localização ───────────────────────────────────────────────────────────
  const applyLocation = (data) => {
    setMapCoords({ lat: data.latitude, lng: data.longitude });
    setAddress({
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      bairro: data.bairro || '',
      city: data.city || '',
      estado: data.estado || '',
      cep: data.cep || '',
    });
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const data = await getCurrentLocationAndAddress();
      applyLocation(data);
      toast.success(data.displayName ? `Localização: ${data.displayName}` : 'Coordenadas obtidas!');
    } catch (err) {
      toast.error(getGeolocationErrorMessage(err));
    } finally {
      setLocating(false);
    }
  };

  const handlePositionChange = async ({ lat, lng }) => {
    setLocating(true);
    try {
      const data = await reverseGeocode(lat, lng);
      applyLocation(data);
    } catch {
      setMapCoords({ lat, lng });
    } finally {
      setLocating(false);
    }
  };

  // ── Toggles ───────────────────────────────────────────────────────────────
  const toggleCor = (label) =>
    setCoresSel((prev) => prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]);

  const toggleRaca = (raca) => {
    if (!racasSel.includes(raca) && racasSel.length >= 3) { toast('Máximo 3 raças.', { icon: '⚠️' }); return; }
    setRacasSel((prev) => prev.includes(raca) ? prev.filter((r) => r !== raca) : [...prev, raca]);
  };

  // ── Fotos ─────────────────────────────────────────────────────────────────
  const handlePhotos = (e) => {
    const files   = Array.from(e.target.files || []);
    const valid   = files.filter((f) => f.size <= 5 * 1024 * 1024);
    const combined = [...photos, ...valid].slice(0, 5);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotos(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (i) => {
    URL.revokeObjectURL(previews[i]);
    const next = photos.filter((_, idx) => idx !== i);
    const nextPreviews = previews.filter((_, idx) => idx !== i);
    setPhotos(next);
    setPreviews(nextPreviews);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (photos.length === 0)    { toast.error('Adicione ao menos uma foto.'); return; }
    if (!animalType)             { toast.error('Selecione o tipo do animal.'); return; }
    if (coresSel.length === 0)  { toast.error('Selecione ao menos uma cor.'); return; }

    const fullLoc = [
      address.logradouro,
      address.numero ? `nº ${address.numero}` : '',
      address.bairro,
      address.city,
      address.estado,
    ].filter(Boolean).join(', ') || `${mapCoords.lat.toFixed(5)}, ${mapCoords.lng.toFixed(5)}`;

    const formData = new FormData();
    photos.forEach((f) => formData.append('photos', f));

    formData.append('name',                 data.name);
    formData.append('type',                 animalType);
    formData.append('color',                coresSel.join(', '));
    formData.append('breed',                racasSel.join(', '));
    formData.append('approximate_age',      idadeSel);
    formData.append('last_seen_location',   fullLoc);
    formData.append('last_seen_latitude',   String(mapCoords.lat));
    formData.append('last_seen_longitude',  String(mapCoords.lng));
    formData.append('city',                 address.city);
    formData.append('neighborhood',         address.bairro);
    formData.append('description',          data.description);
    formData.append('contact_phone',        data.contact_phone);
    formData.append('contact_email',        data.contact_email);
    formData.append('reward_info',          data.reward_info);

    try {
      await petService.create(formData);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao criar anúncio.');
    }
  };

  if (submitted) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h2 className={styles.successTitle}>Anúncio criado!</h2>
          <p className={styles.successDesc}>Seu anúncio está no ar. Torçemos para que seu pet volte logo! 🏠</p>
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
            <p className={styles.sectionDesc}>Adicione até 5 fotos.</p>
            <div className={styles.photoGrid}>
              {previews.map((src, i) => (
                <div key={i} className={styles.photoThumb}>
                  <img src={src} alt={`Foto ${i + 1}`} />
                  <button type="button" onClick={() => removePhoto(i)} className={styles.removeBtn}><X size={14} /></button>
                </div>
              ))}
              {photos.length < 5 && (
                <div className={styles.addPhoto} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={24} /><span>Adicionar</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
          </section>

          {/* ── Dados do animal ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🐾 Dados do animal</h2>

            <Input label="Nome do animal *" placeholder="ex: Bolinha" error={errors.name?.message}
              {...register('name', { required: 'Nome é obrigatório' })} />

            {/* Tipo */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tipo *</label>
              <div className={styles.radioRow}>
                {[{ v: 'dog', l: '🐕 Cachorro' }, { v: 'cat', l: '🐈 Gato' }, { v: 'other', l: '🐾 Outro' }].map(({ v, l }) => (
                  <button type="button" key={v}
                    className={`${styles.radioChip} ${animalType === v ? styles.radioChipActive : ''}`}
                    onClick={() => setAnimalType(v)}>{l}</button>
                ))}
              </div>
            </div>

            {/* Raça */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Raça <span className={styles.fieldHint}>· até 3</span></label>
              {racasSel.length >= 3 && <p className={styles.limitWarning}>⚠️ Máximo de 3 raças atingido</p>}
              <div className={styles.checkGrid}>
                {BREEDS_BY_TYPE[animalType].map((b) => (
                  <button type="button" key={b}
                    className={`${styles.checkChip} ${racasSel.includes(b) ? styles.checkChipActive : ''}`}
                    onClick={() => toggleRaca(b)}>{b}</button>
                ))}
              </div>
            </div>

            {/* Cor */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Cor(es) *</label>
              <div className={styles.checkGrid}>
                {STANDARDIZED_COLORS.map((c) => (
                  <button type="button" key={c.id}
                    className={`${styles.checkChip} ${coresSel.includes(c.label) ? styles.checkChipActive : ''}`}
                    onClick={() => toggleCor(c.label)}>{c.label}</button>
                ))}
              </div>
            </div>

            {/* Idade */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Idade aproximada</label>
              <div className={styles.checkGrid}>
                {IDADES.map((idade) => (
                  <button type="button" key={idade}
                    className={`${styles.checkChip} ${idadeSel === idade ? styles.checkChipActive : ''}`}
                    onClick={() => setIdadeSel(idadeSel === idade ? '' : idade)}>{idade}</button>
                ))}
              </div>
            </div>

            <Textarea label="Descrição" placeholder="Manchas, coleira, microchip, comportamento..."
              rows={4} {...register('description')} />
          </section>

          {/* ── Localização ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📍 Último local visto</h2>

            {/* Mapa */}
            <div className={styles.mapWrap}>
              <LocationPicker
                lat={mapCoords.lat}
                lng={mapCoords.lng}
                address={address}
                locating={locating}
                active
                onUseMyLocation={handleUseMyLocation}
                onPositionChange={handlePositionChange}
              />
            </div>

            {/* Endereço estruturado */}
            <div className={styles.fieldGroup}>
              <div className={styles.grid}>
                <Input label="Logradouro" placeholder="Rua das Flores" value={address.logradouro}
                  onChange={(e) => setAddress({ ...address, logradouro: e.target.value })} />
                <Input label="Número" placeholder="123" value={address.numero}
                  onChange={(e) => setAddress({ ...address, numero: e.target.value })} />
              </div>
              <div className={styles.grid}>
                <Input label="Bairro" placeholder="Jardim Europa" value={address.bairro}
                  onChange={(e) => setAddress({ ...address, bairro: e.target.value })} />
                <Input label="Cidade" placeholder="São Paulo" value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              </div>
              <Input label="Estado" placeholder="SP" value={address.estado}
                onChange={(e) => setAddress({ ...address, estado: e.target.value })} />
            </div>
          </section>

          {/* ── Contato ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📞 Contato</h2>
            <div className={styles.grid}>
              <Input label="Telefone / WhatsApp" placeholder="(11) 99999-9999" {...register('contact_phone')} />
              <Input label="E-mail de contato" type="email" {...register('contact_email')} />
            </div>
            <Input label="Recompensa (opcional)" placeholder="ex: Recompensa para quem encontrar!" {...register('reward_info')} />
          </section>

          {/* ── Submit ── */}
          <div className={styles.submitWrap}>
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              Publicar anúncio 🐾
            </Button>
            <p className={styles.submitNote}>Seu anúncio ficará visível para todos na plataforma.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
