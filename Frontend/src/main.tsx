import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// La autenticación (incluido Google) la gestiona Supabase desde src/lib/supabase.ts,
// así que aquí no se monta ningún proveedor de OAuth externo.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
