import React from 'react';
import { Trophy, RefreshCw } from 'lucide-react';

export const SessionSummary = ({ stats, onContinue, onHome }) => {
  const total = stats.again + stats.hard + stats.good + stats.easy;
  const accuracy = total > 0 ? Math.round(((stats.good + stats.easy) / total) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-10 duration-500">
      <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-sm" />
      <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2">Session Complete!</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">You reviewed <strong className="text-indigo-600 dark:text-indigo-400">{total}</strong> cards.</p>

      <div className="w-full max-w-sm grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800 text-center">
          <p className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Accuracy</p>
          <p className="text-3xl font-black text-green-700 dark:text-green-300">{accuracy}%</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Retention</p>
          <p className="text-3xl font-black text-blue-700 dark:text-blue-300">High</p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button onClick={onContinue} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center">
          <RefreshCw className="w-5 h-5 mr-2" /> Review Again
        </button>
        <button onClick={onHome} className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
