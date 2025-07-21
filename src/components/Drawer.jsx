import React from 'react';

export default function Drawer({ open, onClose, children }) {
  return (
    <div
      className={`fixed inset-y-0 left-0 w-80 bg-white shadow-lg transform 
        ${open ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 z-40`}
    >
      {/* Close button */}
      <div className="flex justify-end p-2 border-b">
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          ✕
        </button>
      </div>
      {/* Drawer content */}
      <div className="p-4 overflow-y-auto h-full">
        {children}
      </div>
    </div>
  );
}
