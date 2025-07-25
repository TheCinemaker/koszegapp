import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DarkModeProvider } from './contexts/DarkModeContext';
import App from './App';

import './index.css';
import './i18n';
import 'leaflet/dist/leaflet.css'; // <-- IDE SZÚRD BE, EZ LESZ AZ EGYETLEN HELY!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Sötét mód provider a teljes alkalmazás fölött */}
    <DarkModeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DarkModeProvider>
  </React.StrictMode>
);
