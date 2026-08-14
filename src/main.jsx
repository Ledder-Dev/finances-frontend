import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './AuthContext.jsx';
import { AppStateProvider } from './state/AppStateContext.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </AuthProvider>
  </StrictMode>,
);
