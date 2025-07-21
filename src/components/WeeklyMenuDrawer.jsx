import React, { useState, useEffect } from 'react';
import Drawer from './Drawer';
import MenuCard from './MenuCard';
import { fetchMenus } from '../api/sheets';

const sheetId = '1I-f8S2RtPaQS8Pn30HibSQFkuByyfvxJdNMuedy0bhg';
const sheetName = 'Form Responses 1';

export default function WeeklyMenuDrawer() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMenus() {
      try {
        const data = await fetchMenus(sheetId, sheetName);
        setMenus(data);
      } catch (err) {
        console.error('Error fetching menus:', err);
        setError('Hiba a menük betöltésekor.');
      } finally {
        setLoading(false);
      }
    }
    loadMenus();
  }, []);

  return (
    <Drawer>
      {loading && <p>Betöltés...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        menus.length > 0 ? (
          menus.map((menu, idx) => (
            <MenuCard key={`${menu.etterem}-${menu.datum}-${menu.menu_tipus}-${idx}`} data={menu} />
          ))
        ) : (
          <p>Nincs megjeleníthető menü a héten.</p>
        )
      )}
    </Drawer>
  );
}

