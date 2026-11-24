import { useState, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AceptarInvitacionPage from './pages/AceptarInvitacionPage';
import { supabase } from './lib/supabase';
import { cerrarSesionTitan, limpiarDatosSesionTitan, sincronizarSesionTitan } from './lib/sesion';

import './App.css';

function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('token'));
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await cerrarSesionTitan();
    setIsLoggedIn(false);
    navigate('/login', { replace: true });
  };

  // Supabase es la autoridad de sesión: cuando vuelve el redirect de Google
  // (o hay una sesión guardada), se canjea por el JWT que usa la API de Titan V.
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') return; // LoginPage pide la contraseña nueva.
      if (evento === 'SIGNED_OUT') {
        limpiarDatosSesionTitan();
        setIsLoggedIn(false);
        return;
      }
      if (evento === 'SIGNED_IN' || evento === 'INITIAL_SESSION') {
        void sincronizarSesionTitan().then((sesionLista) => {
          if (sesionLista) {
            setIsLoggedIn(true);
          } else {
            // El error quedó en sessionStorage; LoginPage lo muestra al abrirse.
            navigate('/login', { replace: true });
          }
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoggedIn && !sessionStorage.getItem('invitacion_pendiente')) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isLoggedIn ? (
            <DashboardPage onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/invitacion/:token"
        element={<AceptarInvitacionPage isLoggedIn={isLoggedIn} onLoginSuccess={handleLoginSuccess} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
