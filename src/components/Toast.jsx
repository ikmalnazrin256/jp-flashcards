import React from 'react';
import { Check } from 'lucide-react';

export const Toast = ({ message }) => (
  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-[150] animate-in slide-in-from-top-4 duration-300 transition-opacity opacity-95 text-sm font-bold whitespace-nowrap flex items-center pointer-events-none">
    <Check className="w-4 h-4 mr-2 text-green-400 dark:text-green-600" /> {message}
  </div>
);
