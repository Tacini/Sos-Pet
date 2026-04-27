import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PawPrint, Search, Plus, LogIn, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout, isAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <PawPrint size={22} strokeWidth={2.5} />
          <span>SOS Pet</span>
        </Link>

        {/* Desktop links */}
        <div className={styles.links}>
          <Link to="/busca" className={`${styles.link} ${isActive('/busca') ? styles.active : ''}`}>
            <Search size={16} />
            Buscar
          </Link>
          <Link to="/relatar" className={`${styles.link} ${isActive('/relatar') ? styles.active : ''}`}>
            <Plus size={16} />
            Vi um animal
          </Link>

          {isAuth ? (
            <>
              <Link to="/meu-pet" className={`${styles.link} ${isActive('/meu-pet') ? styles.active : ''}`}>
                Meus Anúncios
              </Link>
              <div className={styles.userMenu}>
                <span className={styles.userName}>{user?.name?.split(' ')[0]}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut size={16} /> Sair
                </Button>
              </div>
            </>
          ) : (
            <div className={styles.authBtns}>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <LogIn size={16} /> Entrar
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button variant="primary" size="sm">Cadastrar</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/busca"   className={styles.mobileLink} onClick={() => setMenuOpen(false)}>🔍 Buscar animais</Link>
          <Link to="/relatar" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>📍 Vi um animal</Link>
          {isAuth ? (
            <>
              <Link to="/meu-pet" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>🐾 Meus Anúncios</Link>
              <button className={styles.mobileLink} onClick={handleLogout}>🚪 Sair</button>
            </>
          ) : (
            <>
              <Link to="/login"   className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Entrar</Link>
              <Link to="/cadastro" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Cadastrar</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
