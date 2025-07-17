import React, { useState, useEffect, useRef } from 'react';

const SYSTEM_PROMPT = {
  role: 'system',
  content: `Te a KőszegAPP hivatalos AI idegenvezetője vagy. 
Csak olyan információt adhatsz, ami **1000%-osan pontos, hiteles és ellenőrzött** Kőszeg városával kapcsolatban. 
Soha nem találgathatsz, nem találhatsz ki éttermet, szállást vagy programot! 
Ha nem vagy teljesen biztos az adatban, mondd inkább azt, hogy:
"Ebben nem vagyok teljesen biztos, javaslom hogy nézd meg az interneten."
Ha útvonalat kérdeznek, mondd azt, hogy sokkal egyszerűbb, ha a google térképen nézi meg, sajnos ez a része az app-nak még fejlesztés alatt van.

Ha bármiben bizonytalan vagy, hívd meg a `searchWeb` függvényt a legfrissebb webes találatokért!

Feladatod:
- Válaszolj magyarul, udvariasan, barátságosan.
- Ha más nyelven kérdeznek, válts át arra a nyelvre.
- Tegeződj, de kérdezd meg az elején, hogy ez nem zavarja-e. Ha igen, válts magázásra és légy még illedelmesebb.
- Soha ne beszélj szexről, háborúról, politikáról, drogokról, nemi identitásról és semmi 18 év alatti témáról.
- Vedd fel a beszélgetőpartner stílusát, de csúnya szavakat nem használhatsz. viccersen természetesen káromkodhatsz, ha a beszélgetőpartnered is káromkodik, de tegyél mellé emojikat.

Kérlek, mindig mondj el mindent pontosan és csak valós adatokat! 
Ha bármiben bizonytalan vagy, inkább mondd hogy nem tudod 100%-ra, így elkerülöd a téves információt.`
};

export default function ChatAI({ onClose, visible }) {
  
  if (!visible) return null;
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      type: 'text',
      content: 'Szia! Én vagyok a KőszegAPP AI segédje. Miben segíthetek?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q) return;
    setInput('');

    const userMsg = { sender: 'user', type: 'text', content: q };
    setMessages(ms => [...ms, userMsg]);
    setLoading(true);

    const chatContext = [
      SYSTEM_PROMPT,
      ...messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: q }
    ];

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatContext })
      });
      const { reply } = await res.json();
      setMessages(ms => [
        ...ms,
        { sender: 'ai', type: 'text', content: reply.trim() }
      ]);
    } catch (err) {
      console.error('Chat hiba:', err);
      setMessages(ms => [
        ...ms,
        { sender: 'ai', type: 'text', content: 'Sajnálom, hiba történt. Kérlek próbáld meg újra.' }
      ]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendMessage();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed bottom-1 left-1 right-1 w-auto h-[70vh] bg-[#fdf6e3] text-gray-800 rounded-3xl shadow-2xl flex flex-col z-50">
        <div className="flex items-center justify-between px-4 py-3 bg-[#ece2c6] rounded-t-3xl shadow">
          <span className="font-semibold text-lg">KőszegAPP Segéd</span>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
          >✕</button>
        </div>

        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-3 py-2 rounded-xl shadow ${
                msg.sender === 'user'
                  ? 'ml-auto bg-[#cce4f6]'
                  : 'mr-auto bg-[#f9f3d2]'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <div className="flex border-t border-[#e0d7c5] p-3 gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            onBlur={() => {
              setTimeout(() => {
                if (bodyRef.current) {
                  bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
                }
              }, 200);
            }}
            placeholder="Írj ide..."
            disabled={loading}
            className="flex-1 px-3 py-2 border border-[#d6cbb3] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#52a5dd] bg-[#fdf6e3]"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 bg-[#52a5dd] text-white rounded-r-lg hover:bg-[#3d94c5] transition disabled:opacity-50"
          >
            {loading ? 'Írok…' : 'Küld'}
          </button>
        </div>
      </div>
    </>
  );
}
