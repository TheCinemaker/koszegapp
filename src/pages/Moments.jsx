import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { hu } from 'date-fns/locale';
import { IoCameraOutline, IoCloseOutline, IoLocationOutline, IoSendOutline, IoImagesOutline, IoTimeOutline, IoArrowBack } from 'react-icons/io5';
import { supabase } from '../lib/supabaseClient';
import { containsProfanity } from '../utils/badWordsHU';
import { FadeUp } from '../components/AppleMotion';
import SEO from '../components/SEO';

const BUCKET = 'moments';

function timeLeft(expiresAt) {
  const mins = differenceInMinutes(new Date(expiresAt), new Date());
  if (mins < 1) return 'hamarosan eltűnik';
  if (mins < 60) return `${mins} perc`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} óra`;
}

function compressImage(file, maxW = 1080) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/jpeg', 0.82);
    };
    img.src = url;
  });
}

export default function Moments() {
  const navigate = useNavigate();
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);

  // Posting state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [coords, setCoords] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const fetchMoments = useCallback(async () => {
    const { data } = await supabase
      .from('city_moments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);
    if (data) setMoments(data);
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchMoments(); 

    // ⚡ REALTIME CSATORNA BEKÖTÉSE
    const channel = supabase
      .channel('realtime_moments_page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'city_moments' }, (payload) => {
        // Új pillanat beszúrása a feed tetejére (maximum 40 elemet tartunk meg)
        setMoments((prev) => [payload.new, ...prev].slice(0, 40));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMoments]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPostError('');
  };

  const handleLocationToggle = () => {
    if (!useLocation) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null)
      );
    } else {
      setCoords(null);
    }
    setUseLocation(v => !v);
  };

  const handlePost = async () => {
    if (!file) return;
    if (caption && containsProfanity(caption)) {
      setPostError('Kérjük, kulturált szöveget írj! 🙏');
      return;
    }
    setPosting(true);
    try {
      const blob = await compressImage(file);
      const filename = `moment_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, blob, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      await supabase.from('city_moments').insert({
        photo_url: urlData.publicUrl,
        caption: caption.trim() || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      setShowPost(false);
      setFile(null);
      setPreview(null);
      setCaption('');
      setCoords(null);
      setUseLocation(false);
      fetchMoments();
    } catch (err) {
      setPostError('Hiba történt, próbáld újra!');
    } finally {
      setPosting(false);
    }
  };

  const closePost = () => {
    setShowPost(false);
    setFile(null);
    setPreview(null);
    setCaption('');
    setPostError('');
  };

  return (
    <div className="min-h-screen pb-32 pt-4 px-4 max-w-4xl mx-auto">
        <SEO
            title="KőszegReels – 24 órás pillanatok"
            description="Az igazi Kőszeg a helyiek és turisták szemével. Nézz, posztolj és oszd meg pillanataidat — minden kép 24 óra múlva örökre eltűnik."
            url="/moments"
            keywords="KőszegReels, Kőszeg pillanatok, Kőszeg közösség, Kőszeg élő feed"
        />

      {/* Header */}
      <FadeUp>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800/80 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-95 transition-all shrink-0"
              aria-label="Vissza"
            >
              <IoArrowBack className="text-lg" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                📸 KőszegReels
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
                Pillanatok amelyek 24 óra múlva eltűnnek · {moments.length} aktív
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPost(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <IoCameraOutline className="text-lg" />
            Posztolj!
          </button>
        </div>
      </FadeUp>

      {/* Feed */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : moments.length === 0 ? (
        <FadeUp>
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="text-6xl">📸</div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Még nincs egy pillanat sem!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold max-w-xs">
              Légy te az első aki megmutatja milyen most Kőszeg!
            </p>
            <button
              onClick={() => setShowPost(true)}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-lg active:scale-95 transition-all"
            >
              Posztolj most!
            </button>
          </div>
        </FadeUp>
      ) : (
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {moments.map((m, i) => (
            <FadeUp key={m.id} delay={i * 0.04}>
              <div className="break-inside-avoid rounded-2xl overflow-hidden relative group shadow-sm border border-white/60 dark:border-zinc-800/80 bg-gray-100 dark:bg-zinc-900">
                <img
                  src={m.photo_url}
                  alt=""
                  className="w-full object-cover block group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Time badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-black">
                  <IoTimeOutline className="text-xs" />
                  {timeLeft(m.expires_at)}
                </div>

                {/* Location badge */}
                {m.lat && m.lng && (
                  <div className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-indigo-300">
                    <IoLocationOutline className="text-xs" />
                  </div>
                )}

                {/* Caption */}
                {m.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{m.caption}</p>
                    <p className="text-white/50 text-[9px] font-bold mt-1">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: hu })}
                    </p>
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      )}

      {/* Post modal */}
      {showPost && (
        <div
          className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={closePost}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] p-6 flex flex-col gap-4 shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">📸 Pillanat megosztása</h3>
              <button onClick={closePost} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <IoCloseOutline className="text-xl" />
              </button>
            </div>

            {/* Photo picker */}
            <label className="cursor-pointer">
              {preview ? (
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-zinc-200 dark:border-zinc-800">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <IoCameraOutline className="text-white text-4xl" />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-indigo-500/30 dark:border-indigo-400/20 aspect-[4/3] flex flex-col items-center justify-center gap-3 text-zinc-400 hover:border-indigo-500 hover:text-indigo-500 bg-zinc-50/50 dark:bg-zinc-950/20 transition-all duration-300">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <IoCameraOutline className="text-3xl" />
                  </div>
                  <div className="text-center px-4">
                    <span className="text-sm font-black text-gray-800 dark:text-zinc-200 block">Kamera megnyitása</span>
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-zinc-400 mt-1 block">Kattints ide egy élő fotó készítéséhez! 📸</span>
                  </div>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>

            {/* Caption */}
            <input
              type="text"
              value={caption}
              onChange={e => { setCaption(e.target.value.slice(0, 120)); setPostError(''); }}
              placeholder="Rövid felirat... (opcionális)"
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm font-semibold placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />

            {/* Location toggle */}
            <button
              onClick={handleLocationToggle}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold transition-all ${
                useLocation
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <IoLocationOutline className="text-lg" />
              {useLocation && coords ? 'Helyzet hozzáadva ✓' : 'Helyzet hozzáadása (opcionális)'}
            </button>

            {postError && (
              <p className="text-rose-500 text-xs font-black text-center">{postError}</p>
            )}

            <button
              onClick={handlePost}
              disabled={!file || posting}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              {posting ? (
                <span className="animate-pulse">Feltöltés...</span>
              ) : (
                <>
                  <IoSendOutline className="text-lg" />
                  Megosztom a pillanatot!
                </>
              )}
            </button>

            <p className="text-zinc-400 text-[10px] font-semibold text-center">
              A fotód 24 óra múlva automatikusan eltűnik. Semmi személyes adatot nem gyűjtünk.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
