// URL pública del backend. En local se usa el puerto 8000; en producción
// DEBE definirse VITE_API_URL en Frontend/.env (nunca quedar quemada).
const urlConfigurada = ((import.meta as any).env?.VITE_API_URL || '').trim();
export const API_URL = (
  urlConfigurada || ((import.meta as any).env?.DEV ? 'http://127.0.0.1:8000' : '')
).replace(/\/+$/, '');

export const obtenerApiUrl = (): string => {
  if (API_URL) return API_URL;
  // En producción sin VITE_API_URL se asume mismo origen (ej. Vercel con /api).
  if ((import.meta as any).env?.PROD) return '';
  throw new Error('Configura VITE_API_URL en Frontend/.env con la URL del backend Titan V.');
};

/** Extrae el mensaje legible de una respuesta de FastAPI (o de Supabase). */
export const leerErrorApi = async (respuesta: Response): Promise<string> => {
  try {
    const datos = await respuesta.json();
    if (typeof datos?.detail === 'string') return datos.detail;
    if (typeof datos?.message === 'string') return datos.message;
    if (typeof datos?.error?.message === 'string') return datos.error.message;
    if (typeof datos?.error === 'string') return datos.error;
  } catch {
    // La respuesta no tenía cuerpo JSON: se usa el estado HTTP.
  }
  return `Error ${respuesta.status}: ${respuesta.statusText || 'No se pudo completar la solicitud.'}`;
};

export const fetchConToken = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${obtenerApiUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    alert("Tu sesión expiró o no es válida. Por favor, inicia sesión nuevamente.");
    window.location.href = "/login";
  }

  if (response.status === 403) {
    console.warn("Acceso denegado (403):", endpoint);
  }

  return response;
};
