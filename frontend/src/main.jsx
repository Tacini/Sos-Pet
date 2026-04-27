import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-body)',
            background: 'var(--white)',
            color: 'var(--charcoal)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--sand-dark)',
          },
          success: { iconTheme: { primary: 'var(--forest)', secondary: 'var(--white)' } },
          error:   { iconTheme: { primary: 'var(--error)',  secondary: 'var(--white)' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
