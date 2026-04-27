import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, Heart, ArrowRight } from 'lucide-react';
import { searchService } from '../services';
import AnimalCard from '../components/ui/AnimalCard';
import { Button, Spinner, Empty } from '../components/ui';
import styles from './Home.module.css';

export default function Home() {
  const [feed, setFeed]       = useState({ recentReports: [], recentLost: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchService.feed()
      .then(({ data }) => setFeed(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.heroPill}>🐾 Conectando corações</span>
            <h1 className={styles.heroTitle}>
              Ajude a reunir<br />
              <em>famílias e seus pets</em>
            </h1>
            <p className={styles.heroDesc}>
              Relate um animal encontrado ou anuncie seu pet perdido.
              Juntos somos mais fortes.
            </p>
            <div className={styles.heroActions}>
              <Link to="/busca">
                <Button variant="primary" size="lg">
                  <Search size={18} /> Buscar animais
                </Button>
              </Link>
              <Link to="/relatar">
                <Button variant="outline" size="lg">
                  Vi um animal perdido
                </Button>
              </Link>
            </div>
          </div>
          <div className={styles.heroIllustration}>
            <div className={styles.heroBubble}>🐕</div>
            <div className={`${styles.heroBubble} ${styles.bubbleCat}`}>🐈</div>
            <div className={`${styles.heroBubble} ${styles.bubbleSmall}`}>🐾</div>
          </div>
        </div>
        <div className={styles.heroWave} />
      </section>

      {/* ── CTA cards ────────────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaGrid}>
            <div className={styles.ctaCard}>
              <span className={styles.ctaIcon}>📍</span>
              <h3>Vi um animal</h3>
              <p>Encontrou um animal vagando? Faça um relato rápido sem precisar criar conta.</p>
              <Link to="/relatar">
                <Button variant="secondary" size="sm">
                  Relatar agora <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
            <div className={`${styles.ctaCard} ${styles.ctaCardTerra}`}>
              <span className={styles.ctaIcon}>😢</span>
              <h3>Perdi meu pet</h3>
              <p>Crie um anúncio detalhado do seu animal perdido e alcance mais pessoas.</p>
              <Link to="/meu-pet">
                <Button variant="primary" size="sm">
                  Criar anúncio <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
            <div className={styles.ctaCard}>
              <span className={styles.ctaIcon}>🔍</span>
              <h3>Buscar animais</h3>
              <p>Filtre por tipo, raça, cor e região para encontrar o animal que procura.</p>
              <Link to="/busca">
                <Button variant="secondary" size="sm">
                  Ver animais <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Últimos relatos ───────────────────────────────────────────────── */}
      <section className={styles.feedSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className="section-title">Animais encontrados recentemente</h2>
              <p className="section-subtitle">Alguém viu esses animais — pode ser o seu?</p>
            </div>
            <Link to="/busca?tab=found">
              <Button variant="ghost" size="sm">Ver todos <ArrowRight size={14} /></Button>
            </Link>
          </div>

          {loading ? (
            <div className={styles.loadingWrap}><Spinner size="lg" /></div>
          ) : feed.recentReports.length === 0 ? (
            <Empty icon="🔍" title="Nenhum relato ainda" description="Seja o primeiro a relatar um animal encontrado!" />
          ) : (
            <div className={styles.grid}>
              {feed.recentReports.map((r, i) => (
                <div key={r.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-up">
                  <AnimalCard animal={r} type="found" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Últimos perdidos ──────────────────────────────────────────────── */}
      <section className={`${styles.feedSection} ${styles.feedDark}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className="section-title">Pets perdidos</h2>
              <p className="section-subtitle">Esses animais estão esperando voltar para casa.</p>
            </div>
            <Link to="/busca">
              <Button variant="ghost" size="sm">Ver todos <ArrowRight size={14} /></Button>
            </Link>
          </div>

          {loading ? (
            <div className={styles.loadingWrap}><Spinner size="lg" /></div>
          ) : feed.recentLost.length === 0 ? (
            <Empty icon="🏠" title="Nenhum anúncio ainda" />
          ) : (
            <div className={styles.grid}>
              {feed.recentLost.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-up">
                  <AnimalCard animal={p} type="lost" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer strip ─────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <Heart size={14} strokeWidth={2.5} />
        <span>Feito com amor para os animais · SOS Pet © {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
