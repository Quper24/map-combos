import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { LanguageProvider } from './i18n/Language';
import './index.css';

// Preserve old /#/combo-id links from published video descriptions.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1));
}
ReactDOM.createRoot(document.getElementById('app')).render(
  <LanguageProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </LanguageProvider>,
);
