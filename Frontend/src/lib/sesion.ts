import { API_URL, leerErrorApi } from '../api';
import { errorConfiguracionSupabase, supabase } from './supabase';

interface DatosSesionTitan {
  token: string;
  usuario_id: number | string;
  nombre?: string;
  rol?: number | string;
}

const CLAVE_ERROR = 'error_autenticacion';
let canjeEnCurso: Promise<boolean> | null = null;

const guardarSesionTitan = (datos: DatosSesionTitan) => {
  localStorage.setItem('token', datos.token);
  localStorage.setItem('usuario_id', String(datos.usuario_id));
  localStorage.setItem('usuario_nombre', datos.nombre || 'Usuario');
  if (datos.rol !== undefined) localStorage.setItem('rol', String(datos.rol));
};

export const limpiarDatosSesionTitan = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario_id');
  localStorage.removeItem('usuario_nombre');
  localStorage.removeItem('rol');
};

export const consumirErrorAutenticacion = (): string => {
  const mensaje = sessionStorage.getItem(CLAVE_ERROR) || '';
  if (mensaje) sessionStorage.removeItem(CLAVE_ERROR);
  return mensaje;
};

/**
 * Canjea el access_token de Supabase por el JWT interno de Titan V.
 * El backend vuelve a verificar el token contra Supabase: nunca confía en el
 * correo que mande el navegador. Devuelve true cuando la sesión quedó lista.
 */
export const sincronizarSesionTitan = (): Promise<boolean> => {
  if (!supabase) {
    sessionStorage.setItem(CLAVE_ERROR, errorConfiguracionSupabase);
    return Promise.resolve(false);
  }

  // El listener global de App y el handler del formulario pueden dispararse
  // a la vez; una sola petición de canje evita duplicados y carreras.
  if (canjeEnCurso) return canjeEnCurso;

  canjeEnCurso = (async () => {
    try {
      const { data, error } = await supabase!.auth.getSession();
      if (error) throw new Error(error.message);
      if (!data.session) return false;
      const base = API_URL || ((import.meta as any).env?.PROD ? '' : '');
      if (!base && !(import.meta as any).env?.PROD) {
        throw new Error('Configura VITE_API_URL en Frontend/.env con la URL del backend Titan V.');
      }

      const respuesta = await fetch(`${base}/api/auth/supabase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: data.session.access_token }),
      });

      if (!respuesta.ok) throw new Error(await leerErrorApi(respuesta));
      guardarSesionTitan(await respuesta.json());
      return true;
    } catch (error: any) {
      sessionStorage.setItem(CLAVE_ERROR, error?.message || 'No se pudo iniciar sesión en Titan V.');
      return false;
    } finally {
      canjeEnCurso = null;
    }
  })();

  return canjeEnCurso;
};

export const cerrarSesionTitan = async () => {
  try {
    if (supabase) await supabase.auth.signOut();
  } catch {
    // Si Supabase no responde, igual se limpia la sesión local.
  }
  limpiarDatosSesionTitan();
};
