// src/pages/Kiosk/KioskEventDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { IoLocationOutline, IoWalkOutline, IoTicketOutline, IoBookmarkOutline } from 'react-icons/io5';
import KioskHeader from '../../components/Kiosk/KioskHeader';
import { fetchEventById } from '../../api';
import { supabase } from '../../lib/supabaseClient';
import { getDistance, formatDistance } from './KioskAttractions';
import { VENUE_COORDS } from './KioskEvents';
import { useKioskLang } from '../../contexts/KioskLangContext';

const KIOSK_LAT = 47.388451231945666;
const KIOSK_LNG = 16.542002964713447;

const getEventImage = (image) => {
  if (!image) return '/images/fo_ter.jpg';
  if (image.startsWith('http')) return image;
  if (image === 'event_default.jpg') return '/images/fo_ter.jpg';
  if (image === 'varszinhaz_default.jpg') return '/images/events/varszinhaz_default.jpg';
  return `/images/events/${image}`;
};

export default function KioskEventDetail() {
  const { id } = useParams();
  const { t } = useKioskLang();
  const [evt, setEvt] = useState(null);
  const [ticketEvent, setTicketEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Fetch local event details
  useEffect(() => {
    let isMounted = true;
    fetchEventById(id)
      .then(data => {
        if (isMounted) {
          setEvt(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load event detail in Kiosk:", err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [id]);

  // 2) Query matching Ticket Event from Supabase (Soft-Link)
  useEffect(() => {
    if (!evt) return;
    let isMounted = true;

    const fetchTicketLink = async () => {
      try {
        const { data, error } = await supabase
          .from('ticket_events')
          .select('*')
          .eq('name', evt.name)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;
        if (isMounted && data) {
          setTicketEvent(data);
        }
      } catch (err) {
        console.error("Error looking up ticket in Kiosk:", err);
      }
    };

    fetchTicketLink();
    return () => { isMounted = false; };
  }, [evt]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black">
        <KioskHeader />
        <div className="flex-1 flex items-center justify-center text-zinc-400 font-bold animate-pulse">
          {t('eventDetail.loading')}
        </div>
      </div>
    );
  }

  if (!evt) {
    return (
      <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black">
        <KioskHeader />
        <div className="flex-1 flex items-center justify-center text-rose-500 font-bold">
          {t('eventDetail.notFound')}
        </div>
      </div>
    );
  }

  // Calculate distance if matched
  const locKey = String(evt.location || '').toLowerCase().trim();
  let venueCoords = null;
  for (const [key, value] of Object.entries(VENUE_COORDS)) {
    if (locKey.includes(key)) {
      venueCoords = value;
      break;
    }
  }
  const distance = venueCoords ? getDistance(KIOSK_LAT, KIOSK_LNG, venueCoords.lat, venueCoords.lng) : null;

  // Ticket card dynamic values based on database entry
  const ticketHeader = t('eventDetail.ticketHeader');
  const ticketTitle = t('eventDetail.ticketTitle');
  const ticketDesc = t('eventDetail.ticketDesc');
  const ticketPrice = ticketEvent ? `${parseInt(ticketEvent.price).toLocaleString()} Ft` : null;

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-zinc-50 to-zinc-100 dark:from-indigo-950/10 dark:via-zinc-950 dark:to-black transition-colors duration-500 overflow-y-auto">
      <KioskHeader />

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col justify-start gap-6 select-none animate-fadeIn">
        
        {/* Banner Image */}
        <div className="relative rounded-[2.5rem] overflow-hidden w-full h-[280px] shadow-lg shrink-0 border border-zinc-200/50 dark:border-zinc-800/50">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${getEventImage(evt.image)})`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

          {/* Location proximity badge */}
          {distance !== null && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 px-4 py-2 rounded-full bg-white/90 dark:bg-zinc-900/90 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm shadow-md border border-zinc-200/20 dark:border-zinc-700/20">
              <IoWalkOutline className="text-lg" />
              <span>{formatDistance(distance, t('common.rightHere'))} {t('common.fromYou')}</span>
            </div>
          )}
        </div>

        {/* Header Titles */}
        <div className="flex flex-col gap-1.5">
          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest">
            {evt.date} • {evt.time || t('common.allDay')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight uppercase">
            {evt.name}
          </h2>
          <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            <IoLocationOutline className="text-base text-indigo-500 dark:text-indigo-400" />
            <span>{evt.location}</span>
          </div>
        </div>

        {/* Content & Description */}
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl p-6 bg-white/80 dark:bg-zinc-900/55 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
            <h3 className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1">
              <IoBookmarkOutline />
              {t('eventDetail.detailsTitle')}
            </h3>
            <p className="text-zinc-700 dark:text-zinc-250 text-sm leading-relaxed font-semibold whitespace-pre-line">
              {evt.description}
            </p>
          </div>

          {/* QR BRIDGE TICKET CARD */}
          {ticketEvent && (
            <div className="rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-br from-indigo-500/10 via-indigo-600/5 to-purple-500/10 dark:from-indigo-400/10 dark:via-indigo-500/5 dark:to-purple-400/10 border-2 border-indigo-500/30 dark:border-indigo-400/20 shadow-xl flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between relative overflow-hidden group">
              <div className="flex-1 flex flex-col gap-3 text-center md:text-left relative z-10">
                <div className="flex items-center gap-2 justify-center md:justify-start text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                  <IoTicketOutline className="text-base" />
                  {ticketHeader}
                </div>
                <h4 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight uppercase leading-none">
                  {ticketTitle}
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
                  {ticketDesc}
                </p>
                {ticketPrice && (
                  <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {ticketPrice}
                  </div>
                )}
              </div>

              {/* QR Image Frame */}
              <div className="shrink-0 p-4 bg-white rounded-3xl shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 relative z-10 hover:scale-105 active:scale-95 transition-transform duration-300">
                <img 
                  src="/images/theticket_qr.png" 
                  alt="Jegyvásárlás QR kód" 
                  className="w-40 h-40 object-contain block rounded-xl"
                  loading="lazy"
                />
              </div>

              {/* Background Accent glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-500" />
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
