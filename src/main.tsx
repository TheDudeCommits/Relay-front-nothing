import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { PrivyAuthProvider } from './auth/privy/PrivyAuthProvider';
import { AuthProvider } from './auth/AuthProvider';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyAuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </PrivyAuthProvider>
  </StrictMode>,
);
