import { useEffect, useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Login } from '../components/Login';
import { errorConfiguracionSupabase, supabase } from '../lib/supabase';
import { consumirErrorAutenticacion, sincronizarSesionTitan } from '../lib/sesion';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(
    () => consumirErrorAutenticacion() || errorConfiguracionSupabase
  );
  const [modoRecuperacion, setModoRecuperacion] = useState(false);
  const [nuevaContrasena, setNuevaContrasena] = useState('');

  // El enlace de recuperación de Supabase vuelve con una sesión de tipo
  // PASSWORD_RECOVERY: se pide la contraseña nueva antes de entrar al panel.
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') {
        setModoRecuperacion(true);
        setCargando(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleCorreoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCorreo(e.target.value);
    if (errorGeneral) setErrorGeneral('');
  };

  const handleContrasenaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContrasena(e.target.value);
    if (errorGeneral) setErrorGeneral('');
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !contrasena) {
      setErrorGeneral('Por favor ingresa tu correo y contraseña.');
      return;
    }
    if (!supabase) {
      setErrorGeneral(errorConfiguracionSupabase);
      return;
    }

    setCargando(true);
    setErrorGeneral('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: contrasena,
      });
      if (error) {
        // Supabase es la autoridad: se muestra su mensaje exacto, sin traducirlo.
        setErrorGeneral(error.message);
        return;
      }

      const sesionLista = await sincronizarSesionTitan();
      if (!sesionLista) {
        setErrorGeneral(consumirErrorAutenticacion() || 'No se pudo iniciar sesión en Titan V.');
        return;
      }

      onLoginSuccess();
      navigate('/dashboard');
    } catch (error: any) {
      setErrorGeneral(error?.message || 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const iniciarConGoogle = async () => {
    if (!supabase) {
      setErrorGeneral(errorConfiguracionSupabase);
      return;
    }

    setCargando(true);
    setErrorGeneral('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        setErrorGeneral(error.message);
        setCargando(false);
      }
      // Si no hay error, Supabase redirige al navegador; App.tsx detecta la
      // sesión al volver y la canjea por el JWT de Titan V.
    } catch (error: any) {
      setErrorGeneral(error?.message || 'No se pudo abrir el inicio de sesión con Google.');
      setCargando(false);
    }
  };

  const guardarNuevaContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setErrorGeneral(errorConfiguracionSupabase);
      return;
    }
    if (nuevaContrasena.length < 6) {
      setErrorGeneral('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);
    setErrorGeneral('');
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaContrasena });
      if (error) {
        setErrorGeneral(error.message);
        return;
      }

      const sesionLista = await sincronizarSesionTitan();
      if (!sesionLista) {
        setErrorGeneral(consumirErrorAutenticacion() || 'No se pudo iniciar sesión en Titan V.');
        return;
      }

      onLoginSuccess();
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      setErrorGeneral(error?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  if (modoRecuperacion) {
    return (
      <div style={estilos.pantalla}>
        <div style={estilos.tarjeta}>
          <h2 style={estilos.titulo}>Nueva contraseña</h2>
          {errorGeneral && <div className="field-error" role="alert" style={{ marginBottom: '12px' }}>{errorGeneral}</div>}
          <form onSubmit={guardarNuevaContrasena}>
            <label htmlFor="nueva-contrasena" style={estilos.etiqueta}>
              Contraseña nueva <span className="required-mark">*</span>
            </label>
            <input
              id="nueva-contrasena"
              type="password"
              autoComplete="new-password"
              value={nuevaContrasena}
              onChange={(e) => { setNuevaContrasena(e.target.value); if (errorGeneral) setErrorGeneral(''); }}
              placeholder="Mínimo 6 caracteres"
              style={estilos.input}
              required
            />
            <button type="submit" disabled={cargando} style={estilos.boton}>
              {cargando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Login
      correo={correo}
      contrasena={contrasena}
      onCorreoChange={handleCorreoChange}
      onContrasenaChange={handleContrasenaChange}
      onEnviar={handleEnviar}
      onGoogleLogin={iniciarConGoogle}
      onVolverPrincipal={() => navigate('/')}
      cargando={cargando}
      errorGeneral={errorGeneral}
    />
  );
};

const estilos = {
  pantalla: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#121212',
    padding: '20px',
    boxSizing: 'border-box' as const,
  },
  tarjeta: {
    width: '100%',
    maxWidth: '360px',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    border: '1px solid #333',
    borderRadius: '14px',
    padding: '28px',
    color: '#fff',
  },
  titulo: { color: '#fff', margin: '0 0 16px 0', fontSize: '22px' },
  etiqueta: { display: 'block', fontSize: '13px', color: '#ddd', marginBottom: '7px' },
  input: {
    width: '100%',
    padding: '11px',
    boxSizing: 'border-box' as const,
    backgroundColor: '#121212',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '7px',
    fontSize: '14px',
  },
  boton: {
    width: '100%',
    padding: '12px',
    marginTop: '14px',
    backgroundColor: '#ffcc00',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
  },
};

export default LoginPage;
