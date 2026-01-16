import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import Admin from './Admin.tsx';
import './index.css';

// Simple routing based on pathname
const isAdminRoute = window.location.pathname === '/admin' || window.location.hostname.startsWith('admin.');

console.log('Portfolio loading...', { pathname: window.location.pathname, isAdmin: isAdminRoute });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminRoute ? <Admin /> : <App />}
  </StrictMode>
);
