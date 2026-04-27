import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import styles from './Auth.module.css';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password, phone: data.phone });
      toast.success('Conta criada! Seja bem-vindo ao SOS Pet 🐾');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <PawPrint size={32} className={styles.logo} />
          <h1 className={styles.title}>Criar conta</h1>
          <p className={styles.subtitle}>Grátis e em menos de 1 minuto</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input
            label="Nome completo"
            type="text"
            placeholder="Seu nome"
            error={errors.name?.message}
            {...register('name', {
              required: 'Nome é obrigatório',
              minLength: { value: 2, message: 'Nome muito curto' },
            })}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'E-mail é obrigatório',
              pattern: { value: /\S+@\S+\.\S+/, message: 'E-mail inválido' },
            })}
          />

          <Input
            label="Telefone (opcional)"
            type="tel"
            placeholder="(11) 99999-9999"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div className={styles.row}>
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Confirme a senha',
                validate: (val) => val === watch('password') || 'As senhas não coincidem',
              })}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} style={{ width: '100%' }}>
            Criar minha conta
          </Button>
        </form>

        <p className={styles.footer}>
          Já tem conta?{' '}
          <Link to="/login" className={styles.link}>Faça login</Link>
        </p>
      </div>
    </div>
  );
}
