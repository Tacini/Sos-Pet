import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, ArrowLeft, Gift } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { petService } from '../services';
import { Button, Badge, Spinner } from '../components/ui';
import styles from './DetailPage.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TYPE_LABELS = { dog: 'Cachorro', cat: 'Gato', bird: 'Pássaro', rabbit: 'Coelho', other: 'Outro' };
const STATUS_CONFIG = {
  lost:   { label: 'Perdido',    variant: 'terra'   },
  found:  { label: 'encontrado', variant: 'forest'  },
  closed: { label: 'Encerrado',  variant: 'default' },
};

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    petService.getById(id)
      .then(({ data }) => setPet(data.data.pet))
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pet) return null;

  const photos = pet.photos || [];
  const currentPhoto = photos[photoIdx];
  const photoSrc = currentPhoto?.startsWith('http') ? currentPhoto : `${API_URL}${currentPhoto}`;
  const status = STATUS_CONFIG[pet.status] || STATUS_CONFIG.lost;
  const timeAgo = formatDistanceToNow(new Date(pet.created_at), { addSuffix: true, locale: ptBR });

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Voltar */}
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className={styles.grid}>

          {/* ── Fotos ── */}
          <div className={styles.photoSection}>
            <div className={styles.mainPhoto}>
              {currentPhoto ? (
                <img src={photoSrc} alt={pet.name} />
              ) : (
                <div className={styles.noPhoto}>🐾</div>
              )}
              <div className={styles.photoBadges}>
                <Badge variant={TYPE_LABELS[pet.type] === 'Cachorro' ? 'dog' : TYPE_LABELS[pet.type] === 'Gato' ? 'cat' : 'default'}>
                  {TYPE_LABELS[pet.type] || pet.type}
                </Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>

            {/* Miniaturas */}
            {photos.length > 1 && (
              <div className={styles.thumbs}>
                {photos.map((p, i) => {
                  const src = p?.startsWith('http') ? p : `${API_URL}${p}`;
                  return (
                    <div
                      key={i}
                      className={`${styles.thumb} ${i === photoIdx ? styles.thumbActive : ''}`}
                      onClick={() => setPhotoIdx(i)}
                    >
                      <img src={src} alt={`Foto ${i + 1}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Informações ── */}
          <div className={styles.info}>
            <h1 className={styles.name}>{pet.name}</h1>

            <div className={styles.tags}>
              {pet.breed && <span className={styles.tag}>{pet.breed}</span>}
              {pet.color && <span className={styles.tag}>{pet.color}</span>}
              {pet.approximate_age && <span className={styles.tag}>{pet.approximate_age}</span>}
            </div>

            {pet.description && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Sobre o animal</h3>
                <p className={styles.cardText}>{pet.description}</p>
              </div>
            )}

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Último local encontrado</h3>
              <div className={styles.infoRow}>
                <MapPin size={16} className={styles.infoIcon} />
                <span>{pet.last_seen_location}</span>
              </div>
              {pet.city && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Cidade:</span>
                  <span>{pet.city}{pet.neighborhood ? ` · ${pet.neighborhood}` : ''}</span>
                </div>
              )}
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Contato</h3>
              {pet.contact_phone && (
                <div className={styles.infoRow}>
                  <Phone size={16} className={styles.infoIcon} />
                  <a href={`tel:${pet.contact_phone}`} className={styles.contactLink}>
                    {pet.contact_phone}
                  </a>
                </div>
              )}
              {pet.contact_email && (
                <div className={styles.infoRow}>
                  <Mail size={16} className={styles.infoIcon} />
                  <a href={`mailto:${pet.contact_email}`} className={styles.contactLink}>
                    {pet.contact_email}
                  </a>
                </div>
              )}
              {pet.owner_name && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Responsável:</span>
                  <span>{pet.owner_name}</span>
                </div>
              )}
            </div>

            {pet.reward_info && (
              <div className={`${styles.card} ${styles.rewardCard}`}>
                <Gift size={18} className={styles.rewardIcon} />
                <p>{pet.reward_info}</p>
              </div>
            )}

            <div className={styles.metaRow}>
              <Clock size={14} />
              <span>Publicado {timeAgo}</span>
            </div>

            {pet.contact_phone && (
              <a href={`https://wa.me/55${pet.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="lg" style={{ width: '100%' }}>
                  💬 Chamar no WhatsApp
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
