import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Home        from './pages/Home';
import Login       from './pages/Login';
import Register    from './pages/Register';
import QuickReport from './pages/QuickReport';
import LostPetForm from './pages/LostPetForm';
import SearchPage  from './pages/SearchPage';
import MyPets      from './pages/MyPets';

function NotFound() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontFamily: 'var(--font-display)',
    }}>
      <span style={{ fontSize: '4rem' }}>🐾</span>
      <h1 style={{ fontSize: '2rem', color: 'var(--charcoal)' }}>Página não encontrada</h1>
      <a href="/" style={{ color: 'var(--terra)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
        Voltar à página inicial
      </a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* Públicas */}
        <Route path="/"        element={<Home />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/relatar" element={<QuickReport />} />
        <Route path="/busca"   element={<SearchPage />} />

        {/* Protegidas */}
        <Route path="/meu-pet" element={
          <ProtectedRoute><MyPets /></ProtectedRoute>
        } />
        <Route path="/meu-pet/novo" element={
          <ProtectedRoute><LostPetForm /></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
