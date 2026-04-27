import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { petService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Button, Badge, Spinner, Empty } from '../components/ui';
import styles from './MyPets.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STATUS_CONFIG = {
  lost:   { label: 'Perdido',    variant: 'terra',   icon: Clock },
  found:  { label: 'Encontrado', variant: 'forest',  icon: CheckCircle },
  closed: { label: 'Encerrado',  variant: 'default', icon: XCircle },
};

const TYPE_LABELS = { dog: 'Cachorro', cat: 'Gato', bird: 'Pássaro', rabbit: 'Coelho', other: 'Outro' };

export default function MyPets() {
  const { user, isAuth } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) { navigate('/login', { state: { from: { pathname: '/meu-pet' } } }); return; }
    petService.myPets()
      .then(({ data }) => setPets(data.data.pets))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuth]);

  const handleStatus = async (id, status) => {
    try {
      await petService.updateStatus(id, status);
      setPets((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
      toast.success('Status atualizado!');
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Meus anúncios</h1>
            <p className={styles.subtitle}>Olá, {user?.name?.split(' ')[0]}! Gerencie seus pets perdidos.</p>
          </div>
          <Link to="/meu-pet/novo">
            <Button variant="primary">
              <Plus size={18} /> Novo anúncio
            </Button>
          </Link>
        </div>

        {pets.length === 0 ? (
          <Empty
            icon="🐾"
            title="Você ainda não tem anúncios"
            description="Crie um anúncio para ajudar a encontrar seu pet perdido."
          />
        ) : (
          <div className={styles.list}>
            {pets.map((pet) => {
              const cfg    = STATUS_CONFIG[pet.status] || STATUS_CONFIG.lost;
              const photo  = pet.photos?.[0];
              const photoSrc = photo?.startsWith('http') ? photo : `${API_URL}${photo}`;
              const timeAgo  = formatDistanceToNow(new Date(pet.created_at), { addSuffix: true, locale: ptBR });

              return (
                <div key={pet.id} className={styles.petCard}>
                  <div className={styles.petPhoto}>
                    {photo
                      ? <img src={photoSrc} alt={pet.name} />
                      : <span className={styles.petEmoji}>🐾</span>
                    }
                  </div>

                  <div className={styles.petInfo}>
                    <div className={styles.petTop}>
                      <h3 className={styles.petName}>{pet.name}</h3>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className={styles.petMeta}>
                      {TYPE_LABELS[pet.type] || pet.type}
                      {pet.breed ? ` · ${pet.breed}` : ''}
                      {pet.color ? ` · ${pet.color}` : ''}
                    </p>
                    <p className={styles.petLocation}>📍 {pet.last_seen_location}</p>
                    <p className={styles.petTime}>Publicado {timeAgo}</p>
                  </div>

                  <div className={styles.petActions}>
                    {pet.status === 'lost' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatus(pet.id, 'found')}
                      >
                        <CheckCircle size={15} /> Meu pet voltou!
                      </Button>
                    )}
                    {pet.status !== 'closed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatus(pet.id, 'closed')}
                      >
                        <XCircle size={15} /> Encerrar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
