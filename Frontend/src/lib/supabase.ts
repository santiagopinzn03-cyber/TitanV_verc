import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// El cliente se construye SOLAMENTE con variables de entorno de Vite.
// No hay URLs locales quemadas: en producción se usa el proyecto real de Supabase.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const errorConfiguracionSupabase =
  !supabaseUrl || !supabaseAnonKey
    ? 'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Frontend/.env y vuelve a desplegar.'
    : '';

export const supabase: SupabaseClient | null = errorConfiguracionSupabase
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
