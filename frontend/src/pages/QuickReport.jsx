import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Phone, Check, Upload, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { reportService } from '../services';
import { Button, Input } from '../components/ui';
import LocationPicker from '../components/map/LocationPicker';
import styles from './QuickReport.module.css';
import {
  getCurrentLocationAndAddress,
  reverseGeocode,
  getGeolocationErrorMessage,
  STANDARDIZED_COLORS,
  EMPTY_ADDRESS,
} from '../utils/geolocationUtils';

const STEPS = ['O que viu?', 'Localização', 'Contato'];

const CONTACT_METHODS = ['WhatsApp', 'SMS', 'Ligação'];

const BREEDS_BY_TYPE = {
  dog:   ['SRD (Vira-lata)', 'Poodle', 'Pinscher', 'Labrador', 'Golden Retriever', 'Pastor Alemão', 'Bulldog', 'Beagle', 'Shih Tzu', 'Yorkshire', 'Outro'],
  cat:   ['SRD (Vira-lata)', 'Siamês', 'Persa', 'Maine Coon', 'Angorá', 'Bengal', 'Ragdoll', 'Sphynx', 'Munchkin', 'Outro'],
  other: ['Outro'],
};

export default function QuickReport() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [photo, setPhoto]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [animalType, setAnimalType] = useState('dog');
  const [coresSel, setCoresSel]     = useState([]);
  const [racasSel, setRacasSel]     = useState([]);
  const [descricao, setDescricao]   = useState('');

  const [mapCoords, setMapCoords]   = useState({ lat: -23.55052, lng: -46.633308 });
  const [address, setAddress]       = useState({ ...EMPTY_ADDRESS });

  const [reporterName,  setReporterName]  = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [acceptsContact, setAcceptsContact] = useState(true);
  const [contactMethods, setContactMethods] = useState(['WhatsApp']);

  useEffect(() => { setRacasSel([]); }, [animalType]);

  const toggleContactMethod = (method) => {
    setContactMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleAcceptsContact = (accepts) => {
    setAcceptsContact(accepts);
    if (!accepts) {
      setContactMethods([]);
    } else if (contactMethods.length === 0) {
      setContactMethods(['WhatsApp']);
    }
  };

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

  const toggleCor = (label) =>
    setCoresSel((prev) => prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]);

  const toggleRaca = (raca) => {
    if (!racasSel.includes(raca) && racasSel.length >= 3) { toast('Máximo 3 raças.', { icon: '⚠️' }); return; }
    setRacasSel((prev) => prev.includes(raca) ? prev.filter((r) => r !== raca) : [...prev, raca]);
  };

  const nextStep = () => {
    if (step === 0 && !photo)              { toast.error('Adicione uma foto.'); return; }
    if (step === 0 && coresSel.length === 0) { toast.error('Selecione ao menos uma cor.'); return; }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (acceptsContact && contactMethods.length === 0) {
      toast.error('Selecione ao menos uma forma de contato.');
      return;
    }

    setLoading(true);
    try {
      const fullAddress = [
        address.logradouro,
        address.numero ? `nº ${address.numero}` : '',
        address.bairro,
        address.city,
        address.estado,
      ].filter(Boolean).join(', ');

      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('location_text',  fullAddress || `${mapCoords.lat}, ${mapCoords.lng}`);
      formData.append('latitude',        String(mapCoords.lat));
      formData.append('longitude',       String(mapCoords.lng));
      formData.append('city',            address.city);
      formData.append('neighborhood',    address.bairro);
      formData.append('animal_type',     animalType);
      formData.append('animal_color',    coresSel.join(', '));
      formData.append('breed',           racasSel.join(', '));
      formData.append('description',     descricao);
      formData.append('reporter_name',   reporterName);
      formData.append('reporter_phone',  reporterPhone);
      formData.append('reporter_email',  reporterEmail);
      formData.append('accepts_contact', acceptsContact ? 'true' : 'false');
      formData.append('wants_updates',   'false');
      formData.append('contact_methods', JSON.stringify(acceptsContact ? contactMethods : []));

      await reportService.create(formData);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao enviar relato.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h2 className={styles.successTitle}>Relato enviado!</h2>
          <p className={styles.successDesc}>Obrigado por ajudar! Seu relato pode fazer a diferença. 🐾</p>
          <div className={styles.successActions}>
            <Button variant="primary" onClick={() => navigate('/')}>Voltar ao início</Button>
            <Button variant="outline" onClick={() => { setSubmitted(false); setStep(0); setPhoto(null); setPreview(null); setCoresSel([]); setRacasSel([]); setContactMethods(['WhatsApp']); setAcceptsContact(true); }}>
              Novo relato
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
          <span className={styles.pill}>📍 Sem login necessário</span>
          <h1 className={styles.title}>Vi um animal perdido</h1>
          <p className={styles.subtitle}>Preencha em 3 passos rápidos</p>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          {STEPS.map((label, i) => (
            <div key={label} className={styles.stepItem}>
              <div className={`${styles.stepDot} ${i < step ? styles.stepDotDone : i === step ? styles.stepDotActive : ''}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`${styles.stepLabel} ${i === step ? styles.stepLabelActive : ''}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />}
            </div>
          ))}
        </div>

        <div className={styles.card}>

          {/* ── Passo 0: Animal ── */}
          {step === 0 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}><Camera size={20} /> O que você viu?</h2>

              {/* Foto */}
              <div className={`${styles.dropzone} ${preview ? styles.dropzoneHasPhoto : ''}`}>
                {!preview ? (
                  <label className={styles.dropzoneLabel}>
                    <Upload size={36} className={styles.uploadIcon} />
                    <p>Clique para adicionar foto</p>
                    <span>JPG, PNG · Máx. 5MB</span>
                    <input type="file" accept="image/*" hidden onChange={(e) => {
                      const f = e.target.files[0];
                      if (f && f.size <= 5 * 1024 * 1024) { setPhoto(f); setPreview(URL.createObjectURL(f)); }
                      else toast.error('Foto muito grande. Máx 5MB.');
                    }} />
                  </label>
                ) : (
                  <>
                    <img src={preview} alt="Preview" className={styles.preview} />
                    <button type="button" className={styles.removePhoto} onClick={() => { setPhoto(null); setPreview(null); }}>
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Tipo */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Tipo do animal</label>
                <div className={styles.radioRow}>
                  {[{ v: 'dog', l: '🐕 Cão' }, { v: 'cat', l: '🐈 Gato' }, { v: 'other', l: '🐾 Outro' }].map(({ v, l }) => (
                    <button type="button" key={v}
                      className={`${styles.radioChip} ${animalType === v ? styles.radioChipActive : ''}`}
                      onClick={() => setAnimalType(v)}>{l}</button>
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

              {/* Raça */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Raça <span className={styles.fieldHint}>· até 3</span></label>
                {racasSel.length >= 3 && <p className={styles.limitWarning}>⚠️ Máximo de 3 raças</p>}
                <div className={styles.checkGrid}>
                  {BREEDS_BY_TYPE[animalType].map((b) => (
                    <button type="button" key={b}
                      className={`${styles.checkChip} ${racasSel.includes(b) ? styles.checkChipActive : ''}`}
                      onClick={() => toggleRaca(b)}>{b}</button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Descrição (opcional)</label>
                <textarea className={styles.outroInput}
                  placeholder="Algum detalhe que ajude a identificar o animal..."
                  value={descricao} onChange={(e) => setDescricao(e.target.value)}
                  style={{ minHeight: 90 }} />
              </div>
            </div>
          )}

          {/* ── Passo 1: Localização ── */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}><MapPin size={20} /> Onde você viu?</h2>

              <div className={styles.mapWrap}>
                <LocationPicker
                  lat={mapCoords.lat}
                  lng={mapCoords.lng}
                  address={address}
                  locating={locating}
                  active={step === 1}
                  onUseMyLocation={handleUseMyLocation}
                  onPositionChange={handlePositionChange}
                />
              </div>

              {/* Endereço estruturado */}
              <div className={styles.fieldGroup}>
                <div className={styles.twoCol}>
                  <Input label="Logradouro" placeholder="Rua das Flores" value={address.logradouro}
                    onChange={(e) => setAddress({ ...address, logradouro: e.target.value })} />
                  <Input label="Número" placeholder="123" value={address.numero}
                    onChange={(e) => setAddress({ ...address, numero: e.target.value })} />
                </div>
                <div className={styles.twoCol}>
                  <Input label="Bairro" placeholder="Jardim Europa" value={address.bairro}
                    onChange={(e) => setAddress({ ...address, bairro: e.target.value })} />
                  <Input label="Cidade" placeholder="São Paulo" value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                </div>
                <Input label="Estado" placeholder="SP" value={address.estado}
                  onChange={(e) => setAddress({ ...address, estado: e.target.value })} />
              </div>
            </div>
          )}

          {/* ── Passo 2: Contato ── */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}><Phone size={20} /> Suas informações</h2>
              <p className={styles.stepDesc}>Totalmente opcional. Ajuda quem está procurando.</p>

              <Input label="Seu nome" placeholder="Maria Silva" value={reporterName}
                onChange={(e) => setReporterName(e.target.value)} />
              <Input label="Telefone / WhatsApp" placeholder="(11) 99999-9999" value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)} />
              <Input label="E-mail" type="email" placeholder="seu@email.com" value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)} />

              <div className={styles.checkGroup}>
                <label className={styles.checkLabel}>
                  <input
                    type="radio"
                    name="accepts_contact"
                    checked={acceptsContact}
                    onChange={() => handleAcceptsContact(true)}
                  />
                  <span>Aceito receber contato</span>
                </label>

                {acceptsContact && (
                  <div className={styles.contactMethods}>
                    <p className={styles.contactMethodsLabel}>Como prefere ser contactado?</p>
                    <div className={styles.methodBoxes}>
                      {CONTACT_METHODS.map((method) => (
                        <button
                          key={method}
                          type="button"
                          className={`${styles.methodBox} ${contactMethods.includes(method) ? styles.methodBoxActive : ''}`}
                          onClick={() => toggleContactMethod(method)}
                          aria-pressed={contactMethods.includes(method)}
                        >
                          {method === 'WhatsApp' && '💬 '}
                          {method === 'SMS' && '📱 '}
                          {method === 'Ligação' && '📞 '}
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className={styles.checkLabel}>
                  <input
                    type="radio"
                    name="accepts_contact"
                    checked={!acceptsContact}
                    onChange={() => handleAcceptsContact(false)}
                  />
                  <span>Prefiro não ser contactado</span>
                </label>
              </div>
            </div>
          )}

          {/* ── Navegação ── */}
          <div className={styles.navBtns}>
            {step > 0 && (
              <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>← Voltar</Button>
            )}
            <div style={{ flex: 1 }} />
            {step < STEPS.length - 1 ? (
              <Button type="button" variant="primary" onClick={nextStep}>Próximo →</Button>
            ) : (
              <Button type="button" variant="primary" loading={loading} onClick={handleSubmit}>
                Enviar relato 🐾
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
