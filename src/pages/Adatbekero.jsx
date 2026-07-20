import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoStorefront, 
  IoBedOutline, 
  IoCheckmarkCircle, 
  IoCloudUploadOutline, 
  IoCallOutline, 
  IoMailOutline, 
  IoGlobeOutline, 
  IoLocationOutline, 
  IoTimeOutline, 
  IoInformationCircleOutline,
  IoCheckmark,
  IoSparkles,
  IoArrowBack,
  IoCopyOutline,
  IoLogoFacebook,
  IoLogoInstagram
} from 'react-icons/io5';


const AMENITY_OPTIONS = [
  { id: 'bankkartya', label: 'Bankkártyás fizetés', icon: '💳' },
  { id: 'szep_kartya', label: 'SZÉP Kártya elfogadás (OTP, MBH, K&H)', icon: '💳' },
  { id: 'wifi', label: 'Ingyenes Wi-Fi', icon: '📶' },
  { id: 'klima', label: 'Légkondicionáló (Klíma)', icon: '❄️' },
  { id: 'terasz', label: 'Terasz / Kerthelyiség', icon: '☀️' },
  { id: 'parkolo', label: 'Saját / Díjmentes parkoló', icon: '🚗' },
  { id: 'kutyabarat', label: 'Kutyabarát / Háziállat bevihető', icon: '🐕' },
  { id: 'csaladbarat', label: 'Család- és gyermekbarát', icon: '🧒' },
  { id: 'mentes', label: 'Vegetáriánus / Mentes ételek', icon: '🥗' },
  { id: 'kiszallitas', label: 'Ételkiszállítás / Elvitel', icon: '🛵' },
  { id: 'akadalymentes', label: 'Akadálymentesített', icon: '♿' },
  { id: 'ebike', label: 'E-bike töltési lehetőség', icon: '🚴' },
];

const GASTRO_TYPES = ['étterem', 'pizzéria', 'kávézó', 'cukrászda', 'borozó / bár', 'fagyizó', 'bisztró', 'egyéb vendéglátás'];
const HOTEL_TYPES = ['apartman', 'panzió', 'hotel / szálloda', 'vendégház', 'erdei szállás', 'turistaház', 'egyéb szállás'];

export default function Adatbekero() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [categoryType, setCategoryType] = useState('gastro'); // 'gastro' | 'hotel'
  const [subType, setSubType] = useState('étterem');
  const [customSubType, setCustomSubType] = useState('');
  const [name, setName] = useState('');
  const [zipCity, setZipCity] = useState('9730 Kőszeg');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  
  const [openingHours, setOpeningHours] = useState('Egész évben nyitva');
  const [capacity, setCapacity] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  
  const [shortDesc, setShortDesc] = useState('');
  const [detailedDesc, setDetailedDesc] = useState('');
  
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  // Images (Base64 previews)
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const toggleAmenity = (id) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleCategoryChange = (type) => {
    setCategoryType(type);
    if (type === 'gastro') {
      setSubType('étterem');
    } else {
      setSubType('apartman');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePhotosUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setPhotos(files);
      const prevs = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          prevs.push(reader.result);
          if (prevs.length === files.length) {
            setPhotoPreviews([...prevs]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Generate output JSON structure for isolated partner_submissions.json
  const timeId = Date.now().toString().slice(-6);
  const nameSlug = (name || 'partner').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  const finalType = subType.toLowerCase().includes('egyéb') && customSubType.trim() ? customSubType.trim() : subType;

  const generatedJson = {
    id: categoryType === 'gastro' ? `gastro-sub-${timeId}` : parseInt(timeId, 10),
    target_database: categoryType === 'gastro' ? 'restaurants.json' : 'hotels.json',
    name: name || 'Vendéglátó / Szálláshely Neve',
    type: finalType,
    tags: [finalType, categoryType === 'gastro' ? 'vendéglátás' : 'szállás', ...selectedAmenities],
    address: `${zipCity}, ${address}`.trim(),
    phone: phone || null,
    email: email || null,
    website: website || null,
    facebook: facebook || null,
    instagram: instagram || null,
    image: logoPreview ? `partner_uploads/logo_${nameSlug}_${timeId}.png` : `${nameSlug}.jpg`,
    logo: logoPreview ? `partner_uploads/logo_${nameSlug}_${timeId}.png` : null,
    gallery: photoPreviews.map((_, idx) => `partner_uploads/photo_${nameSlug}_${timeId}_${idx + 1}.jpg`),
    amenities: selectedAmenities.map(id => AMENITY_OPTIONS.find(a => a.id === id)?.label || id),
    open_all_year: openingHours.toLowerCase().includes('egész évben'),
    notes: capacity ? `Férőhely: ${capacity}. Nyitvatartás: ${openingHours}` : openingHours,
    description: shortDesc,
    details: detailedDesc || shortDesc,
    submitted_at: new Date().toISOString(),
    status: 'pending_review'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Save directly to GitHub directory (public/data/submissions/<slug>.json) via Netlify Function
      try {
        const ghRes = await fetch('/.netlify/functions/submit-partner-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generatedJson)
        });
        if (ghRes.ok) {
          console.log('[Adatbekero] Submission saved to GitHub submissions folder successfully!');
        } else {
          console.warn('[Adatbekero] GitHub submission notice:', await ghRes.text());
        }
      } catch (err) {
        console.warn('[Adatbekero] Netlify function submit-partner-form skipped/failed:', err);
      }

      // 2. Save to local storage cache so admin can review instantly on same device
      try {
        const existing = JSON.parse(localStorage.getItem('visitkoszeg_partner_submissions') || '[]');
        const updated = [generatedJson, ...existing.filter(x => x.id !== generatedJson.id)];
        localStorage.setItem('visitkoszeg_partner_submissions', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage cache failed:', e);
      }

      setSubmitError(null);
      setSubmitted(true);
    } catch (err) {
      console.error('Partner submission error:', err);
      setSubmitError(err.message || 'Ismeretlen hiba');
    } finally {
      setSubmitting(false);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white pb-24">
      {/* Clean Branded Header - NO NAVBAR, NO DISTRACTIONS */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20 text-white">
              vK
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-white tracking-wider uppercase">VISITKŐSZEG</h1>
              <p className="text-xs text-indigo-400 font-medium">Partneri Adatbekérő 2026</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium uppercase tracking-wide">
            🔒 Hivatalos Adatbekérő
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Intro Hero Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <h2 className="text-2xl font-black tracking-tight text-white mb-2 uppercase flex items-center gap-2">
                  <IoSparkles className="text-indigo-400" /> Adatbekérés
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Töltsd ki az alábbi űrlapot kb. 1 perc alatt, hogy helyed naprakészen és pontos adatokkal jelenjen meg a <strong className="text-white font-bold">VISITKŐSZEG.HU</strong> hivatalos turisztikai platformon és alkalmazásban.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Kategória Választó */}
                <div className="bg-slate-800/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">
                    1. Egység Típusa *
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('gastro')}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        categoryType === 'gastro'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                        categoryType === 'gastro' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <IoStorefront />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">Vendéglátás</div>
                        <div className="text-xs text-slate-400">Étterem, kávézó, bár...</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCategoryChange('hotel')}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        categoryType === 'hotel'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                        categoryType === 'hotel' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <IoBedOutline />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">Szálláshely</div>
                        <div className="text-xs text-slate-400">Hotel, apartman, panzió...</div>
                      </div>
                    </button>
                  </div>

                  {/* Alkategória Választó */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-medium">Pontos alkategória</label>
                    <select
                      value={subType}
                      onChange={(e) => setSubType(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition capitalize"
                    >
                      {(categoryType === 'gastro' ? GASTRO_TYPES : HOTEL_TYPES).map(type => (
                        <option key={type} value={type} className="bg-slate-900 text-white capitalize">
                          {type}
                        </option>
                      ))}
                    </select>

                    {subType.toLowerCase().includes('egyéb') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3"
                      >
                        <label className="block text-xs text-indigo-300 mb-1 font-medium">
                          Pontosítsd az egyedi típust (pl. Kemping, Hostel, Sátorhely, Bikepacker ágy, Street food kocsma...) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="pl. Kemping / Sátorhely / Hostel / Bikepacker ágy"
                          value={customSubType}
                          onChange={(e) => setCustomSubType(e.target.value)}
                          className="w-full bg-slate-900/90 border border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* 2. Elérhetőségek & Alapadatok */}
                <div className="bg-slate-800/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">
                    2. Alapadatok & Elérhetőségek
                  </label>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Egység Neve *</label>
                    <input
                      type="text"
                      required
                      placeholder="pl. Belvárosi Apartman Kőszeg"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Település / Irányítószám</label>
                      <input
                        type="text"
                        value={zipCity}
                        onChange={(e) => setZipCity(e.target.value)}
                        placeholder="9730 Kőszeg"
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Utca, házszám *</label>
                      <input
                        type="text"
                        required
                        placeholder="pl. Fő tér 12."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Telefonszám (Információ / Foglalás)</label>
                      <div className="relative">
                        <IoCallOutline className="absolute left-3.5 top-3.5 text-slate-500 text-base" />
                        <input
                          type="tel"
                          placeholder="+36 30 123 4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">E-mail cím</label>
                      <div className="relative">
                        <IoMailOutline className="absolute left-3.5 top-3.5 text-slate-500 text-base" />
                        <input
                          type="email"
                          placeholder="info@hely.hu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Weboldal URL</label>
                    <div className="relative">
                      <IoGlobeOutline className="absolute left-3.5 top-3.5 text-slate-500 text-base" />
                      <input
                        type="url"
                        placeholder="https://www.helyed.hu"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Facebook oldal link</label>
                      <div className="relative">
                        <IoLogoFacebook className="absolute left-3.5 top-3.5 text-blue-500 text-base" />
                        <input
                          type="text"
                          placeholder="facebook.com/helyneve"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Instagram link</label>
                      <div className="relative">
                        <IoLogoInstagram className="absolute left-3.5 top-3.5 text-pink-500 text-base" />
                        <input
                          type="text"
                          placeholder="instagram.com/helyneve"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Nyitvatartás & Részletek */}
                <div className="bg-slate-800/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">
                    3. Nyitvatartás & Részletek
                  </label>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Nyitvatartás / Szezonalitás</label>
                    <input
                      type="text"
                      placeholder="pl. Egész évben nyitva (H-P: 10:00-22:00, Sz-V: 09:00-23:00)"
                      value={openingHours}
                      onChange={(e) => setOpeningHours(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">
                        {categoryType === 'hotel' ? 'Férőhely / Szobák száma' : 'Éttermi férőhelyek száma'}
                      </label>
                      <input
                        type="text"
                        placeholder={categoryType === 'hotel' ? "pl. 3 apartman, összesen 12 fő" : "pl. 50 beltéri + 30 terasz"}
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-medium">Árkategória / Tájékoztató ár</label>
                      <input
                        type="text"
                        placeholder={categoryType === 'hotel' ? "pl. 15 000 Ft/fő/éj-től" : "pl. Átlagos főétel: 3500 Ft"}
                        value={priceFrom}
                        onChange={(e) => setPriceFrom(e.target.value)}
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Rövid bemutatkozás (2-3 mondat)</label>
                    <textarea
                      rows={2}
                      placeholder="Miben különleges a helyed? Hangulat, specialitások, elhelyezkedés..."
                      value={shortDesc}
                      onChange={(e) => setShortDesc(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Részletes leírás / Étlap & Kínálat részletei (Opcionális)</label>
                    <textarea
                      rows={3}
                      placeholder="Bővebb információk a látogatóknak..."
                      value={detailedDesc}
                      onChange={(e) => setDetailedDesc(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                    />
                  </div>
                </div>

                {/* 4. Szolgáltatás Chipek (Kattintgatós) */}
                <div className="bg-slate-800/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">
                    4. Szolgáltatások & Jellemzők (Kattints rájuk!)
                  </label>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {AMENITY_OPTIONS.map((item) => {
                      const isSelected = selectedAmenities.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleAmenity(item.id)}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                          {isSelected && <IoCheckmark className="text-white text-sm" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Képek & Logó Feltöltése */}
                <div className="bg-slate-800/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">
                    5. Logó & Fotók Csatolása
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Logó Feltöltő */}
                    <div className="border border-dashed border-white/20 rounded-2xl p-4 text-center hover:border-indigo-500/50 transition relative bg-slate-900/40">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {logoPreview ? (
                        <div className="flex flex-col items-center">
                          <img src={logoPreview} alt="Logo preview" className="h-20 object-contain rounded-lg mb-2" />
                          <span className="text-xs text-indigo-400 font-medium">Logó csatolva ✓ (Kattints a cseréhez)</span>
                        </div>
                      ) : (
                        <div className="py-4 flex flex-col items-center text-slate-400">
                          <IoCloudUploadOutline className="text-3xl text-indigo-400 mb-2" />
                          <span className="text-xs font-bold text-white mb-1">Hivatalos Logó Feltöltése</span>
                          <span className="text-[11px] text-slate-500">Kattints vagy húzd ide (PNG / JPG)</span>
                        </div>
                      )}
                    </div>

                    {/* Fotók Feltöltése */}
                    <div className="border border-dashed border-white/20 rounded-2xl p-4 text-center hover:border-indigo-500/50 transition relative bg-slate-900/40">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotosUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {photoPreviews.length > 0 ? (
                        <div className="flex flex-col items-center">
                          <div className="flex gap-1 overflow-x-auto max-w-full pb-1 mb-2">
                            {photoPreviews.map((p, idx) => (
                              <img key={idx} src={p} alt="Preview" className="w-14 h-14 object-cover rounded-lg" />
                            ))}
                          </div>
                          <span className="text-xs text-indigo-400 font-medium">{photoPreviews.length} db fotó csatolva ✓</span>
                        </div>
                      ) : (
                        <div className="py-4 flex flex-col items-center text-slate-400">
                          <IoCloudUploadOutline className="text-3xl text-indigo-400 mb-2" />
                          <span className="text-xs font-bold text-white mb-1">1-3 db Fotó Feltöltése</span>
                          <span className="text-[11px] text-slate-500">Épület, belső tér, ételek, szobák...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hibaüzenet - ne nyeljük el némán a mentési hibát */}
                {submitError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                    <p className="font-bold mb-1">Nem sikerült elmenteni az adatokat!</p>
                    <p className="text-red-400/80 text-xs font-mono">{submitError}</p>
                    <p className="mt-2 text-xs">Kérjük próbáld újra, vagy másold ki a JSON-t és küldd el emailben.</p>
                  </div>
                )}

                {/* Beküldés Gomb */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span>Adatok rögzítése...</span>
                  ) : (
                    <>
                      <IoCheckmarkCircle className="text-xl" />
                      <span>Adatok Beküldése a VISITKŐSZEG-re</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* SIKERES BEKÜLDÉS KÉPERNYŐ */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/80 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <IoCheckmarkCircle />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white mb-2">Köszönjük! Az adataidat rögzítettük! 🎉</h2>
                <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                  Az adataid sikeresen beérkeztek a <strong className="text-white font-bold">VISITKŐSZEG.HU</strong> adminisztrációjához. Rövid ellenőrzés után az adatlapod élesben is megjelenik a platformon!
                </p>
              </div>

              {/* JSON preview code block */}
              <div className="bg-slate-950 rounded-2xl p-4 text-left border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Generált Adatstruktúra:</span>
                  <button
                    onClick={copyJson}
                    className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg flex items-center gap-1 transition"
                  >
                    <IoCopyOutline />
                    <span>{copied ? 'Másolva!' : 'JSON Másolása'}</span>
                  </button>
                </div>
                <pre className="text-xs text-indigo-300 font-mono overflow-x-auto max-h-48 p-2 bg-slate-900/50 rounded-xl">
                  {JSON.stringify(generatedJson, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setAddress('');
                  setPhone('');
                  setEmail('');
                  setWebsite('');
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm rounded-xl transition"
              >
                Újabb adatlap kitöltése
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
