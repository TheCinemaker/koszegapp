import React from 'react';

export default function MenuCard({ data }) {
  const {
    etterem,
    kapcsolat,
    hazhozszallitas,
    menu_allando,
    menu_mon_a,
    menu_mon_b,
    menu_mon_c,
    menu_tue_a,
    menu_tue_b,
    menu_tue_c,
    menu_wed_a,
    menu_wed_b,
    menu_wed_c,
    menu_thu_a,
    menu_thu_b,
    menu_thu_c,
    menu_fri_a,
    menu_fri_b,
    menu_fri_c,
  } = data;

  // Helper to render a day block if any menu exists
  const renderDay = (label, a, b, c) => {
    if (!a && !b && !c) return null;
    return (
      <div className="mb-2">
        <h4 className="font-semibold">{label}</h4>
        {a && <p><strong>A:</strong> {a}</p>}
        {b && <p><strong>B:</strong> {b}</p>}
        {c && <p><strong>C:</strong> {c}</p>}
      </div>
    );
  };

  return (
    <div className="p-4 border rounded-2xl shadow-sm mb-4 bg-white">
      <h3 className="text-xl font-bold mb-1">{etterem}</h3>
      {kapcsolat && <p className="text-sm italic mb-1">Kapcsolat: {kapcsolat}</p>}
      {hazhozszallitas && <p className="text-sm italic mb-2">Házhozszállítás: {hazhozszallitas}</p>}

      {menu_allando && (
        <div className="mb-4">
          <h4 className="font-semibold">Állandó menü</h4>
          <p>{menu_allando}</p>
        </div>
      )}

      {renderDay('Hétfő', menu_mon_a, menu_mon_b, menu_mon_c)}
      {renderDay('Kedd',  menu_tue_a, menu_tue_b, menu_tue_c)}
      {renderDay('Szerda', menu_wed_a, menu_wed_b, menu_wed_c)}
      {renderDay('Csütörtök', menu_thu_a, menu_thu_b, menu_thu_c)}
      {renderDay('Péntek', menu_fri_a, menu_fri_b, menu_fri_c)}
    </div>
  );
}
