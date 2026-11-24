import React, { useState } from 'react';
import { errorConfiguracionSupabase, supabase } from '../lib/supabase';

interface RecuperarContrasenaProps {
  onClose: () => void;
}

const RecuperarContrasena: React.FC<RecuperarContrasenaProps> = ({ onClose }) => {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [esError, setEsError] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje('');
    setEsError(false);
    if (!supabase) {
      setMensaje(errorConfiguracionSupabase);
      setEsError(true);
      return;
    }

    setEnviando(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        // Mensaje exacto de Supabase (correo no registrado, límite de envíos, etc.).
        setMensaje(error.message);
        setEsError(true);
        return;
      }
      setMensaje('Revisa tu correo para abrir el enlace y crear una contraseña nueva.');
    } catch (error: any) {
      setMensaje(error?.message || 'No se pudo enviar el correo de recuperación.');
      setEsError(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={estilos.fondo}>
      <div style={estilos.modal}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>
          Restablecer contraseña
        </h3>
        <p className="form-note" style={{ marginBottom: '12px' }}>
          Los campos marcados con <span className="required-mark">*</span> son obligatorios.
        </p>
        <form onSubmit={handleEnviar}>
          <p style={{ fontSize: '12px', color: '#b0b0b0', marginBottom: '16px' }}>
            Ingresa tu correo y te enviaremos un enlace seguro de Supabase para crear la contraseña nueva.
          </p>
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="rec-email" style={{ display: 'block', fontSize: '12px', color: '#e5e7eb', marginBottom: '6px' }}>
              Correo electrónico <span className="required-mark">*</span>
            </label>
            <input
              id="rec-email"
              type="email"
              required
              aria-required="true"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(e) => { setCorreo(e.target.value); setMensaje(''); }}
              style={estilos.input}
            />
          </div>

          {mensaje && (
            <p role="alert" style={{ fontSize: '12px', color: esError ? '#fca5a5' : '#86efac', marginBottom: '12px' }}>
              {mensaje}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} style={estilos.secundario}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando} style={{ ...estilos.primario, opacity: enviando ? 0.6 : 1 }}>
              {enviando ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const estilos = {
  fondo: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modal: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid #333',
    borderRadius: '14px',
    padding: '24px',
    width: '340px',
    textAlign: 'left' as const,
    color: '#fff',
    boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(255, 204, 0, 0.15)',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #444',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    boxSizing: 'border-box' as const,
    fontSize: '13px',
  },
  secundario: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#333',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
  },
  primario: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#ffcc00',
    color: '#000',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    fontSize: '12px',
  },
};

export default RecuperarContrasena;
