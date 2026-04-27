import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle, PawPrint } from 'lucide-react';
import toast from 'react-hot-toast';
import { petService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Textarea, Select } from '../components/ui';
import styles from './LostPetForm.module.css';

export default function LostPetForm() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const fileInputRef = useRef();

  const [photos, setPhotos]       = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { contact_email: user?.email || '' } });

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
    const formData = new FormData();
    photos.forEach((f) => formData.append('photos', f));
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') formData.append(k, v);
    });

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
          <p className={styles.successDesc}>
            Seu anúncio está no ar. Torçemos para que seu pet volte logo para casa. 🏠
          </p>
          <div className={styles.successActions}>
            <Button variant="primary" onClick={() => navigate('/busca')}>
              Ver anúncios
            </Button>
            <Button variant="outline" onClick={() => navigate('/meu-pet')}>
              Meus anúncios
            </Button>
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

          {/* ── Fotos ─────────────────────────────────────────────────── */}
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

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
              style={{ display: 'none' }}
            />
          </section>

          {/* ── Dados do animal ───────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🐾 Dados do animal</h2>

            <div className={styles.grid}>
              <Input
                label="Nome do animal *"
                placeholder="ex: Bolinha"
                error={errors.name?.message}
                {...register('name', { required: 'Nome é obrigatório' })}
              />

              <Select
                label="Tipo *"
                error={errors.type?.message}
                {...register('type', { required: 'Tipo é obrigatório' })}
              >
                <option value="">Selecione</option>
                <option value="dog">Cachorro</option>
                <option value="cat">Gato</option>
                <option value="bird">Pássaro</option>
                <option value="rabbit">Coelho</option>
                <option value="other">Outro</option>
              </Select>

              <Input
                label="Raça"
                placeholder="ex: Labrador, Vira-lata"
                {...register('breed')}
              />

              <Input
                label="Cor *"
                placeholder="ex: Caramelo com branco"
                error={errors.color?.message}
                {...register('color', { required: 'Cor é obrigatória' })}
              />

              <Input
                label="Idade aproximada"
                placeholder="ex: 3 anos, filhote"
                {...register('approximate_age')}
              />
            </div>

            <Textarea
              label="Descrição"
              placeholder="Detalhes que ajudem a identificar o animal: manchas, coleira, comportamento, microchip..."
              rows={4}
              {...register('description')}
            />
          </section>

          {/* ── Localização ───────────────────────────────────────────── */}
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
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="-23.550520"
                {...register('last_seen_latitude')}
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="-46.633308"
                {...register('last_seen_longitude')}
              />
            </div>
          </section>

          {/* ── Contato ───────────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📞 Contato</h2>

            <div className={styles.grid}>
              <Input
                label="Telefone / WhatsApp"
                placeholder="(11) 99999-9999"
                {...register('contact_phone')}
              />
              <Input
                label="E-mail de contato"
                type="email"
                {...register('contact_email')}
              />
            </div>

            <Input
              label="Informação sobre recompensa (opcional)"
              placeholder="ex: Recompensa para quem encontrar!"
              {...register('reward_info')}
            />
          </section>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <div className={styles.submitWrap}>
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              Publicar anúncio 🐾
            </Button>
            <p className={styles.submitNote}>
              Seu anúncio ficará visível para todos que buscam na plataforma.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
