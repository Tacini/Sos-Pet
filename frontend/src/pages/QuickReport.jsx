import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Phone, Upload, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportService } from '../services';
import { Button, Input, Textarea } from '../components/ui';
import styles from './QuickReport.module.css';

const STEPS = ['Foto', 'Localização', 'Contato'];

const CORES = ['Preto', 'Branco', 'Caramelo', 'Cinza', 'Marrom', 'Amarelo', 'Mesclado', 'Rajado'];

const RACAS = {
  dog: ['Vira-lata', 'Labrador', 'Golden Retriever', 'Poodle', 'Bulldog', 'Pastor Alemão', 'Shih Tzu', 'Outro'],
  cat: ['Vira-lata', 'Siamês', 'Persa', 'Maine Coon', 'Angorá', 'Bengal', 'Ragdoll', 'Outro'],
};

export default function QuickReport() {
  const navigate = useNavigate();
  const [step, setStep]                 = useState(0);
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted]       = useState(false);
  const [animalType, setAnimalType]     = useState('');
  const [outroTipo, setOutroTipo]       = useState('');
  const [coresSel, setCoresSel]         = useState([]);
  const [racaSel, setRacaSel]           = useState('');
  const [outraRaca, setOutraRaca]       = useState('');
  const fileInputRef = useRef();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm({
    defaultValues: {
      accepts_contact: 'false',
      wants_updates: 'false',
      contact_methods: [],
    },
  });

  const acceptsContact = watch('accepts_contact') === 'true';

  const toggleCor = (cor) =>
    setCoresSel((prev) =>
      prev.includes(cor) ? prev.filter((c) => c !== cor) : [...prev, cor]
    );

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Foto muito grande. Máximo 5MB.'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const nextStep = async () => {
    if (step === 0 && !photoFile) { toast.error('Adicione uma foto do animal.'); return; }
    if (step === 1) { const ok = await trigger(['location_text']); if (!ok) return; }
    setStep((s) => s + 1);
  };

  const onSubmit = async (data) => {
    if (!photoFile) { toast.error('Foto obrigatória.'); return; }

    const racaFinal = racaSel === 'Outro' ? outraRaca : racaSel;

    const formData = new FormData();
    formData.append('photo', photoFile);

    const fields = {
      location_text:   data.location_text,
      latitude:        data.latitude,
      longitude:       data.longitude,
      city:            data.city,
      neighborhood:    data.neighborhood,
      animal_type:     animalType === 'other' ? outroTipo.trim() : animalType,
      animal_color:    coresSel.join(', '),
      breed:           racaFinal,
      description:     data.description,
      reporter_name:   data.reporter_name,
      reporter_phone:  data.reporter_phone,
      reporter_email:  data.reporter_email,
      accepts_contact: data.accepts_contact,
      wants_updates:   data.wants_updates,
      contact_methods: JSON.stringify(
        Array.isArray(data.contact_methods) ? data.contact_methods : []
      ),
    };

    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') formData.append(k, v);
    });

    try {
      await reportService.create(formData);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao enviar relato. Tente novamente.');
    }
  };

  if (submitted) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h2 className={styles.successTitle}>Relato enviado!</h2>
          <p className={styles.successDesc}>
            Obrigado por ajudar! Seu relato pode fazer a diferença para uma família inteira.
          </p>
          <div className={styles.successActions}>
            <Button variant="primary" onClick={() => navigate('/')}>Voltar à página inicial</Button>
            <Button variant="outline" onClick={() => {
              setSubmitted(false); setStep(0);
              setPhotoFile(null); setPhotoPreview(null);
              setAnimalType(''); setOutroTipo('');
              setCoresSel([]); setRacaSel(''); setOutraRaca('');
            }}>
              Enviar outro relato
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
          <p className={styles.subtitle}>Preencha o formulário abaixo em 3 passos rápidos</p>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          {STEPS.map((label, i) => (
            <div key={label} className={styles.stepItem}>
              <div className={`${styles.stepDot} ${i <= step ? styles.stepDotActive : ''} ${i < step ? styles.stepDotDone : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`${styles.stepLabel} ${i === step ? styles.stepLabelActive : ''}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />}
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── Passo 0: Foto ── */}
            {step === 0 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}><Camera size={20} /> Foto do animal</h2>
                <p className={styles.stepDesc}>Uma boa foto é essencial para identificar o animal.</p>

                <div
                  className={`${styles.dropzone} ${photoPreview ? styles.dropzoneHasPhoto : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className={styles.preview} />
                      <button type="button" className={styles.removePhoto}
                        onClick={(e) => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); }}>
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <div className={styles.dropzoneContent}>
                      <Upload size={32} className={styles.uploadIcon} />
                      <p>Clique para escolher uma foto</p>
                      <span>JPG, PNG ou WEBP · Máx. 5MB</span>
                    </div>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />

                <div className={styles.optionalSection}>
                  <h3 className={styles.optionalLabel}>Informações opcionais do animal</h3>

                  {/* Tipo — radio button */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Tipo</label>
                    <div className={styles.radioRow}>
                      {[
                        { value: 'dog',   label: '🐕 Cachorro' },
                        { value: 'cat',   label: '🐈 Gato'     },
                        { value: 'other', label: '🐾 Outro'    },
                      ].map(({ value, label }) => (
                        <label
                          key={value}
                          className={`${styles.radioChip} ${animalType === value ? styles.radioChipActive : ''}`}
                        >
                          <input
                            type="radio"
                            name="animal_type_radio"
                            value={value}
                            checked={animalType === value}
                            onChange={() => { setAnimalType(value); setRacaSel(''); setOutroTipo(''); setOutraRaca(''); }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    {/* Campo aberto para "Outro" tipo */}
                    {animalType === 'other' && (
                      <input
                        className={styles.outroInput}
                        type="text"
                        placeholder="Qual animal? ex: Coelho, Hamster, Pássaro..."
                        value={outroTipo}
                        onChange={(e) => setOutroTipo(e.target.value)}
                        autoFocus
                      />
                    )}
                  </div>

                  {/* Raça — checkbox (aparece só se cachorro ou gato) */}
                  {RACAS[animalType] && (
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Raça</label>
                      <div className={styles.checkGrid}>
                        {RACAS[animalType].map((raca) => (
                          <label
                            key={raca}
                            className={`${styles.checkChip} ${racaSel === raca ? styles.checkChipActive : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={racaSel === raca}
                              onChange={() => { setRacaSel(racaSel === raca ? '' : raca); setOutraRaca(''); }}
                            />
                            {raca}
                          </label>
                        ))}
                      </div>
                      {/* Campo aberto para "Outro" raça */}
                      {racaSel === 'Outro' && (
                        <input
                          className={styles.outroInput}
                          type="text"
                          placeholder="Qual a raça? ex: Akita, Sphynx..."
                          value={outraRaca}
                          onChange={(e) => setOutraRaca(e.target.value)}
                          autoFocus
                        />
                      )}
                    </div>
                  )}

                  {/* Cor — checkbox múltiplo */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Cor(es)</label>
                    <div className={styles.checkGrid}>
                      {CORES.map((cor) => (
                        <label
                          key={cor}
                          className={`${styles.checkChip} ${coresSel.includes(cor) ? styles.checkChipActive : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={coresSel.includes(cor)}
                            onChange={() => toggleCor(cor)}
                          />
                          {cor}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label="Descrição (opcional)"
                    placeholder="Algum detalhe que ajude a identificar o animal..."
                    rows={3}
                    {...register('description')}
                  />
                </div>
              </div>
            )}

            {/* ── Passo 1: Localização ── */}
            {step === 1 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}><MapPin size={20} /> Onde você viu o animal?</h2>
                <p className={styles.stepDesc}>Quanto mais detalhes, mais fácil será encontrar o dono.</p>

                <Textarea
                  label="Localização *"
                  placeholder="ex: Próximo ao mercado da Rua das Flores, bairro Jardim Europa, São Paulo"
                  error={errors.location_text?.message}
                  rows={3}
                  {...register('location_text', { required: 'Localização é obrigatória' })}
                />

                <div className={styles.twoCol}>
                  <Input label="Cidade" placeholder="São Paulo" {...register('city')} />
                  <Input label="Bairro" placeholder="Jardim Europa" {...register('neighborhood')} />
                </div>

                <div className={styles.twoCol}>
                  <Input label="Latitude (opcional)" type="number" step="any" placeholder="-23.550520" {...register('latitude')} />
                  <Input label="Longitude (opcional)" type="number" step="any" placeholder="-46.633308" {...register('longitude')} />
                </div>
                <p className={styles.hint}>
                  💡 Você pode obter as coordenadas abrindo o Google Maps e clicando no local.
                </p>
              </div>
            )}

            {/* ── Passo 2: Contato ── */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}><Phone size={20} /> Suas informações de contato</h2>
                <p className={styles.stepDesc}>Totalmente opcional. Ajuda quem está procurando.</p>

                <div className={styles.twoCol}>
                  <Input label="Seu nome" placeholder="Maria Silva" {...register('reporter_name')} />
                  <Input label="Telefone / WhatsApp" placeholder="(11) 99999-9999" {...register('reporter_phone')} />
                </div>

                <Input label="E-mail" type="email" placeholder="seu@email.com" {...register('reporter_email')} />

                <div className={styles.checkGroup}>
                  <label className={styles.checkLabel}>
                    <input type="radio" value="true"  {...register('accepts_contact')} />
                    <span>Aceito receber contato</span>
                  </label>
                  <label className={styles.checkLabel}>
                    <input type="radio" value="false" {...register('accepts_contact')} />
                    <span>Prefiro não ser contactado</span>
                  </label>
                </div>

                {acceptsContact && (
                  <div className={styles.contactMethods}>
                    <p className={styles.optionalLabel}>Meios de contato aceitos:</p>
                    <div className={styles.checkRow}>
                      {['WhatsApp', 'Ligação', 'SMS'].map((m) => (
                        <label key={m} className={styles.checkChip}>
                          <input type="checkbox" value={m} {...register('contact_methods')} />
                          <span>{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.checkGroup}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" {...register('wants_updates')} />
                    <span>Quero receber atualizações sobre este caso</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className={styles.navBtns}>
              {step > 0 && (
                <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  ← Voltar
                </Button>
              )}
              <div style={{ flex: 1 }} />
              {step < STEPS.length - 1 ? (
                <Button type="button" variant="primary" onClick={nextStep}>
                  Próximo →
                </Button>
              ) : (
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  Enviar relato 🐾
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
