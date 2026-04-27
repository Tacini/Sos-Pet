import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PawPrint, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success('Bem-vindo de volta! 🐾');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Falha no login. Verifique suas credenciais.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <PawPrint size={32} className={styles.logo} />
          <h1 className={styles.title}>Bem-vindo de volta</h1>
          <p className={styles.subtitle}>Entre para gerenciar seus anúncios</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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
            label="Senha"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Senha é obrigatória' })}
          />

          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} style={{ width: '100%' }}>
            Entrar
          </Button>
        </form>

        <p className={styles.footer}>
          Não tem conta?{' '}
          <Link to="/cadastro" className={styles.link}>Cadastre-se grátis</Link>
        </p>
      </div>
    </div>
  );
}
