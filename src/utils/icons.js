import L from 'leaflet';

export const machineIcon = new L.Icon({
  iconUrl: '/images/parking_meter.png',
  iconRetinaUrl: '/images/parking_meter.png',
  iconAnchor: [15, 30],   // Az ikon "hegye"
  popupAnchor: [0, -30], // A popup pozíciója az ikonhoz képest
  shadowUrl: null,      
  shadowSize: null,
  shadowAnchor: null,
  iconSize: [30, 30],
});
