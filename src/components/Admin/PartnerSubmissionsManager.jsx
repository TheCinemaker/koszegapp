
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { 
  FaStore, 
  FaBed, 
  FaPhone, 
  FaEnvelope, 
  FaGlobe, 
  FaMapMarkerAlt, 
  FaDownload, 
  FaCheck, 
  FaTrash, 
  FaClock, 
  FaInfoCircle,
  FaCheckCircle,
  FaFacebook,
  FaInstagram
} from 'react-icons/fa';

export default function PartnerSubmissionsManager() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Load submissions from local storage & public/data/submissions
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      // 1. Fetch live submission JSON files from GitHub public/data/submissions/ directory
      let githubSubmissions = [];
      try {
        const ghRes = await fetch('/.netlify/functions/get-partner-submissions');
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (Array.isArray(ghData.submissions)) {
            githubSubmissions = ghData.submissions;
          }
        }
      } catch (err) {
        console.warn('GitHub submissions fetch skipped:', err);
      }

      // 2. Load from localStorage (local cache fallback)
      const localData = JSON.parse(localStorage.getItem('visitkoszeg_partner_submissions') || '[]');

      // Combine & deduplicate by ID (GitHub submissions take priority)
      const combined = [...githubSubmissions, ...localData];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

      setSubmissions(unique);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. DOWNLOAD INDIVIDUAL JSON FILE
  const handleDownloadJson = (item) => {
    const nameSlug = (item.name || 'partner').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    const filename = `${nameSlug}.json`;
    const jsonStr = JSON.stringify(item, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success(`JSON fájl letöltve: ${filename}`);
  };

  // 2. MERGE / APPROVE SUBMISSION INTO HOTELS.JSON OR RESTAURANTS.JSON
  const handleMergeSubmission = async (item) => {
    const isGastro = item.target_database === 'restaurants.json' || item.id.toString().startsWith('gastro');
    const targetPath = isGastro ? 'public/data/restaurants.json' : 'public/data/hotels.json';
    const dbName = isGastro ? 'restaurants.json' : 'hotels.json';

    if (!window.confirm(`Biztosan bedolgozod a(z) "${item.name}" egységet a(z) ${dbName} adatbázisba?`)) {
      return;
    }

    setProcessingId(item.id);
    const toastId = toast.loading(`Bedolgozás a(z) ${dbName} állományba...`);

    try {
      // Fetch current database contents
      const res = await fetch(`/${targetPath.replace('public/', '')}`);
      if (!res.ok) throw new Error(`Nem sikerült betölteni a(z) ${dbName} fájlt.`);
      
      const currentList = await res.json();
      
      // Clean up metadata fields from submission object before merging
      const { target_database, status, submitted_at, has_logo, photos_count, _githubPath, _githubSha, _filename, ...cleanItem } = item;
      
      // Append item
      const updatedList = [...currentList, cleanItem];

      // Send to Github / Netlify save function if available
      try {
        const saveRes = await fetch('/.netlify/functions/save-github-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: targetPath, content: updatedList })
        });
        if (saveRes.ok) {
          toast.success(`Sikeresen bedolgozva a felhős ${dbName} állományba!`, { id: toastId });
        } else {
          toast.success(`Bedolgozva! Ne felejtsd el elmenteni az adminban a ${dbName} ágat.`, { id: toastId });
        }
      } catch (err) {
        toast.success(`Bedolgozási struktúra elkészült a(z) ${dbName} fájlhoz!`, { id: toastId });
      }

      // Remove from pending list and delete from GitHub submissions folder
      handleDeleteSubmission(item.id, false);

    } catch (err) {
      console.error('Merge error:', err);
      toast.error(`Hiba a bedolgozáskor: ${err.message}`, { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  // 3. DELETE / TRASH INDIVIDUAL SUBMISSION
  const handleDeleteSubmission = async (id, confirm = true) => {
    if (confirm && !window.confirm('Biztosan törlöd (kukázod) ezt a beküldött adatlapot?')) {
      return;
    }

    const target = submissions.find(s => s.id === id);
    const updated = submissions.filter(s => s.id !== id);
    setSubmissions(updated);

    // GitHub mappából törlés ha felhős fájl volt
    if (target?._githubPath) {
      try {
        await fetch('/.netlify/functions/delete-github-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: target._githubPath, sha: target._githubSha })
        });
      } catch (err) {
        console.warn('GitHub submission delete failed:', err);
      }
    }

    // localStorage cache tisztítása
    try {
      const localData = JSON.parse(localStorage.getItem('visitkoszeg_partner_submissions') || '[]');
      localStorage.setItem(
        'visitkoszeg_partner_submissions',
        JSON.stringify(localData.filter(s => s.id !== id))
      );
    } catch (e) {
      console.warn('localStorage cleanup failed:', e);
    }



    if (confirm) {
      toast.success('Adatlap kukázva.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-indigo-500/20 text-white shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📥 Beérkezett Partneri Adatlapok</span>
            <span className="text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full font-mono">
              {submissions.length} db függőben
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Tekintsd át a partnerek által beküldött adatlapokat. 1 kattintással bedolgozhatod őket az éles <code className="text-indigo-300">hotels.json</code> vagy <code className="text-indigo-300">restaurants.json</code> adatbázisba!
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2"
        >
          🔄 Lista Frissítése
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : submissions.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            <FaCheckCircle />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Nincs függőben lévő partneri adatbekérő!</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Minden beérkezett adatlapot átnéztél és bedolgoztál. Amikor egy partner kitölti a <strong>/adatbekero</strong> oldalt, azonnal meg fog jelenni itt.
          </p>
        </div>
      ) : (
        /* Submissions Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((item) => {
            const isGastro = item.target_database === 'restaurants.json' || item.id.toString().startsWith('gastro');
            const nameSlug = (item.name || 'partner').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300"
              >
                <div>
                  {/* Card Header Badge */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                        isGastro ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {isGastro ? <FaStore /> : <FaBed />}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white capitalize">
                          {item.type || (isGastro ? 'Vendéglátás' : 'Szálláshely')}
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono">
                          Cél: {isGastro ? 'restaurants.json' : 'hotels.json'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md font-mono">
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('hu-HU') : 'Ma'}
                    </span>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                        <FaMapMarkerAlt className="text-indigo-500" />
                        <span>{item.address}</span>
                      </p>
                    </div>

                    {/* Contacts block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                      {item.phone && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <FaPhone className="text-indigo-500 text-xs" />
                          <span className="truncate">{item.phone}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <FaEnvelope className="text-indigo-500 text-xs" />
                          <span className="truncate">{item.email}</span>
                        </div>
                      )}
                      {item.website && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 sm:col-span-2">
                          <FaGlobe className="text-indigo-500 text-xs" />
                          <a href={item.website} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline truncate">
                            {item.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Notes & Description */}
                    {item.notes && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-start gap-2">
                        <FaClock className="text-amber-500 mt-0.5 text-xs flex-shrink-0" />
                        <span>{item.notes}</span>
                      </div>
                    )}

                    {item.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 italic">
                        "{item.description}"
                      </p>
                    )}

                    {/* Amenities Tags */}
                    {item.amenities && item.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.amenities.map((am, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-medium border border-indigo-200 dark:border-indigo-800"
                          >
                            {am}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 flex-wrap">
                  {/* Action 1: JSON Download */}
                  <button
                    onClick={() => handleDownloadJson(item)}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    title="Letöltés egyedi JSON fájlként"
                  >
                    <FaDownload />
                    <span>JSON (`{nameSlug}.json`)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Action 2: Trash/Delete */}
                    <button
                      onClick={() => handleDeleteSubmission(item.id)}
                      className="p-2.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition"
                      title="Törlés (Kukázás)"
                    >
                      <FaTrash size={14} />
                    </button>

                    {/* Action 3: Merge / Approve */}
                    <button
                      disabled={processingId === item.id}
                      onClick={() => handleMergeSubmission(item)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FaCheck />
                      <span>🟢 Bedolgozás</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
