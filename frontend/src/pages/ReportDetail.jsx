import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, ArrowLeft, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { reportService } from '../services';
import { Badge, Spinner } from '../components/ui';
import styles from './DetailPage.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TYPE_LABELS = { dog: 'Cachorro', cat: 'Gato', bird: 'Pássaro', other: 'Outro' };

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getById(id)
      .then(({ data }) => setReport(data.data.report))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!report) return null;

  const photoSrc = report.photo_url?.startsWith('http')
    ? report.photo_url
    : `${API_URL}${report.photo_url}`;

  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR });
  const contactMethods = typeof report.contact_methods === 'string'
    ? JSON.parse(report.contact_methods || '[]')
    : report.contact_methods || [];

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Voltar */}
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className={styles.grid}>

          {/* ── Foto ── */}
          <div className={styles.photoSection}>
            <div className={styles.mainPhoto}>
              {report.photo_url ? (
                <img src={photoSrc} alt="Animal visto" />
              ) : (
                <div className={styles.noPhoto}>🐾</div>
              )}
              <div className={styles.photoBadges}>
                {(report.animal_type) && (
                  <Badge variant={report.animal_type === 'dog' ? 'dog' : report.animal_type === 'cat' ? 'cat' : 'default'}>
                    {TYPE_LABELS[report.animal_type] || report.animal_type}
                  </Badge>
                )}
                <Badge variant="forest">Visto</Badge>
              </div>
            </div>
          </div>

          {/* ── Informações ── */}
          <div className={styles.info}>
            <h1 className={styles.name}>Animal Visto</h1>

            <div className={styles.tags}>
              {report.animal_color && <span className={styles.tag}>{report.animal_color}</span>}
              {report.breed && <span className={styles.tag}>{report.breed}</span>}
            </div>

            {report.description && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Descrição</h3>
                <p className={styles.cardText}>{report.description}</p>
              </div>
            )}

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Onde foi visto</h3>
              <div className={styles.infoRow}>
                <MapPin size={16} className={styles.infoIcon} />
                <span>{report.location_text}</span>
              </div>
              {report.city && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Cidade:</span>
                  <span>{report.city}{report.neighborhood ? ` · ${report.neighborhood}` : ''}</span>
                </div>
              )}
            </div>

            {report.accepts_contact && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Contato</h3>

                {report.reporter_name && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nome:</span>
                    <span>{report.reporter_name}</span>
                  </div>
                )}

                {report.reporter_phone && (
                  <div className={styles.infoRow}>
                    <Phone size={16} className={styles.infoIcon} />
                    <a href={`tel:${report.reporter_phone}`} className={styles.contactLink}>
                      {report.reporter_phone}
                    </a>
                  </div>
                )}

                {report.reporter_email && (
                  <div className={styles.infoRow}>
                    <Mail size={16} className={styles.infoIcon} />
                    <a href={`mailto:${report.reporter_email}`} className={styles.contactLink}>
                      {report.reporter_email}
                    </a>
                  </div>
                )}

                {contactMethods.length > 0 && (
                  <div className={styles.infoRow}>
                    <MessageCircle size={16} className={styles.infoIcon} />
                    <span>Aceita contato via: {contactMethods.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {!report.accepts_contact && (
              <div className={`${styles.card} ${styles.noContactCard}`}>
                <p>⚠️ Quem relatou preferiu não ser contactado.</p>
              </div>
            )}

            <div className={styles.metaRow}>
              <Clock size={14} />
              <span>Relatado {timeAgo}</span>
            </div>

            {report.accepts_contact && report.reporter_phone && (
              <a
                href={`https://wa.me/55${report.reporter_phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className={styles.whatsappBtn}>
                  💬 Chamar no WhatsApp
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
