import React from 'react';

export default function RestaurantDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto my-6 p-6 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg animate-pulse">
      <div className="h-5 w-24 bg-gray-300 opacity-50 rounded-md mb-6" />
      <div className="w-full h-64 bg-gray-300 opacity-50 rounded-lg mb-6" />
      <div className="h-9 w-3/4 bg-gray-300 opacity-50 rounded-md mb-4" />
      <div className="h-4 w-full bg-gray-300 opacity-50 rounded-md mb-2" />
      <div className="h-4 w-full bg-gray-300 opacity-50 rounded-md mb-2" />
      <div className="h-4 w-5/6 bg-gray-300 opacity-50 rounded-md mb-8" />
      <div className="w-full h-64 bg-gray-300 opacity-50 rounded-lg mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-12 w-full bg-gray-300 opacity-50 rounded-md" />
        <div className="h-12 w-full bg-gray-300 opacity-50 rounded-md" />
        <div className="h-12 w-full bg-gray-300 opacity-50 rounded-md" />
        <div className="h-12 w-full bg-gray-300 opacity-50 rounded-md" />
      </div>
    </div>
  );
}
