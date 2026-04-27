import { MapPin, Clock, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, Badge } from '../ui';
import styles from './AnimalCard.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TYPE_LABELS = { dog: 'Cachorro', cat: 'Gato', bird: 'Pássaro', rabbit: 'Coelho', other: 'Outro' };
const TYPE_BADGE  = { dog: 'dog', cat: 'cat', bird: 'default', rabbit: 'default', other: 'default' };

export default function AnimalCard({ animal, type = 'lost' }) {
  const navigate = useNavigate();

  const photo = type === 'lost'
    ? animal.photos?.[0]
    : animal.photo_url;

  const photoSrc = photo?.startsWith('http') ? photo : `${API_URL}${photo}`;

  const location = type === 'lost'
    ? animal.last_seen_location
    : animal.location_text;

  const animalType = animal.type || animal.animal_type;
  const timeAgo = formatDistanceToNow(new Date(animal.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const handleClick = () => {
    if (type === 'lost') navigate(`/pets/${animal.id}`);
    else navigate(`/relatos/${animal.id}`);
  };

  return (
    <Card onClick={handleClick} className={styles.card}>
      {/* Photo */}
      <div className={styles.photoWrap}>
        {photo ? (
          <img src={photoSrc} alt="Animal" className={styles.photo} loading="lazy" />
        ) : (
          <div className={styles.noPhoto}>🐾</div>
        )}
        <div className={styles.typeBadge}>
          <Badge variant={TYPE_BADGE[animalType] || 'default'}>
            {TYPE_LABELS[animalType] || animalType || 'Animal'}
          </Badge>
        </div>
        {type === 'lost' && (
          <div className={styles.statusBadge}>
            <Badge variant="terra">Perdido</Badge>
          </div>
        )}
        {type === 'found' && (
          <div className={styles.statusBadge}>
            <Badge variant="forest">Encontrado</Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.body}>
        {type === 'lost' && animal.name && (
          <h3 className={styles.name}>{animal.name}</h3>
        )}
        {type === 'found' && animal.reporter_name && (
          <p className={styles.reporter}>Relatado por: {animal.reporter_name}</p>
        )}

        {animal.breed && (
          <p className={styles.breed}>{animal.breed} · {animal.color}</p>
        )}
        {!animal.breed && animal.animal_color && (
          <p className={styles.breed}>{animal.animal_color}</p>
        )}

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <MapPin size={13} />
            {location?.length > 40 ? `${location.slice(0, 40)}…` : location}
          </span>
          <span className={styles.metaItem}>
            <Clock size={13} />
            {timeAgo}
          </span>
        </div>

        {type === 'lost' && animal.contact_phone && (
          <div className={styles.contact}>
            <Phone size={13} />
            {animal.contact_phone}
          </div>
        )}
      </div>
    </Card>
  );
}
