import React, { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Gyors ikon generátor adott színhez
function coloredIcon(color) {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function LiveCityMap({ events, attractions, restaurants, leisure, hotels, parking }) {
  const center = [47.389, 16.542]; // Kőszeg központ

  // Színek kategóriánként
  const icons = {
    events: coloredIcon("#e63946"),      // piros
    attractions: coloredIcon("#457b9d"), // kék
    restaurants: coloredIcon("#ffb703"), // sárga
    leisure: coloredIcon("#2a9d8f"),     // zöld
    hotels: coloredIcon("#9d4edd"),      // lila
    parking: coloredIcon("#6c757d"),     // szürke
  };

  // Csak aktuális hónap eseményei
  const now = new Date();
  const currentMonth = now.getMonth();
  const monthlyEvents = useMemo(() => {
    return events.filter(ev => {
      if (!ev.coords) return false;
      const date = ev._s || (ev.date ? new Date(ev.date) : null);
      return date && date.getMonth() === currentMonth;
    });
  }, [events, currentMonth]);

  return (
    <MapContainer center={center} zoom={15} style={{ height: "80vh", width: "100%" }}>
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LayersControl position="topright">
        {/* ESEMÉNYEK */}
        <LayersControl.Overlay checked name="Események">
          <LayerGroup>
            {monthlyEvents.map(ev => (
              ev.coords && (
                <Marker key={`ev-${ev.id}`} position={[ev.coords.lat, ev.coords.lng]} icon={icons.events}>
                  <Popup>
                    <b>{ev.name}</b><br />
                    {ev.date}
                  </Popup>
                </Marker>
              )
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* LÁTNIVALÓK */}
        <LayersControl.Overlay checked name="Látnivalók">
          <LayerGroup>
            {attractions.map(at => (
              at.coords && (
                <Marker key={`at-${at.id}`} position={[at.coords.lat, at.coords.lng]} icon={icons.attractions}>
                  <Popup><b>{at.name}</b></Popup>
                </Marker>
              )
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* VENDÉGLÁTÓ */}
        <LayersControl.Overlay checked name="Vendéglátó">
          <LayerGroup>
            {restaurants.map(r => (
              r.coords && (
                <Marker key={`r-${r.id}`} position={[r.coords.lat, r.coords.lng]} icon={icons.restaurants}>
                  <Popup><b>{r.name}</b></Popup>
                </Marker>
              )
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* SZABADIDŐ */}
        <LayersControl.Overlay checked name="Szabadidő">
          <LayerGroup>
            {leisure.map(l => (
              l.coords && (
                <Marker key={`l-${l.id}`} position={[l.coords.lat, l.coords.lng]} icon={icons.leisure}>
                  <Popup><b>{l.name}</b></Popup>
                </Marker>
              )
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* SZÁLLODÁK */}
        <LayersControl.Overlay checked name="Szállodák">
          <LayerGroup>
            {hotels.map(h => (
              h.coords && (
                <Marker key={`h-${h.id}`} position={[h.coords.lat, h.coords.lng]} icon={icons.hotels}>
                  <Popup><b>{h.name}</b></Popup>
                </Marker>
              )
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* PARKOLÓK */}
        <LayersControl.Overlay checked name="Parkolók">
          <LayerGroup>
            {parking.map(p => (
              p.coords && (
                <Marker key={`p-${p.id}`} position={[p.coords.lat, p.coords.lng]} icon={icons.parking}>
                  <Popup><b>{p.name}</b></Popup>
                </Marker>
              )
            ))}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
}
