import { useState } from 'react';
import ChatAI from './ChatAI';

export default function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="AI chat megnyitása"
        className="w-12 h-12 rounded-full bg-[#52a5dd] shadow-xl flex items-center justify-center text-white text-2xl
                   transition-all duration-300 hover:scale-110 active:scale-95 animate-floating backdrop-blur-sm"
      >
        🤖
      </button>

      <ChatAI visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
