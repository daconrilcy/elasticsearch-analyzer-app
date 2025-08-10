import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// --- CORRECTION : Imports pour React Query ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.scss'

// --- CORRECTION : Création d'une instance du client ---
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* --- CORRECTION : L'application est maintenant enveloppée par le Provider --- */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)