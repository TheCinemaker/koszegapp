import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DarkModeProvider } from './contexts/DarkModeContext';
import App from './App';
import { FavoritesProvider } from './contexts/FavoritesContext.jsx'
import { HeroUIProvider } from '@heroui/react';

import './index.css';
import './i18n';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      <HeroUIProvider>
        <DarkModeProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </DarkModeProvider>
      </HeroUIProvider>
    </BrowserRouter>
  </React.StrictMode>
);
