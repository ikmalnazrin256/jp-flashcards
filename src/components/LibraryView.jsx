import React, { useState } from 'react';
import { Flame, Book, Upload, Scissors, Trash2, Check, Search, X } from 'lucide-react';
import { DAILY_GOAL_TARGET } from '../constants';

export const LibraryView = ({ decks, progressMap, userStats, onSelectDeck, onDeleteDeck, onSplitDeck, fileInputRef }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredDecks = decks.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const hasDecks = decks.length > 0;
  
  // Calculate Streak & Goal Progress
  const goalProgress = Math.min(100, Math.round((userStats.dailyReviews / DAILY_GOAL_TARGET) * 100));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">My Decks</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a deck to start learning</p>
        </div>
      </div>

      {/* Search Bar */}
      {hasDecks && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search decks..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {/* DAILY GOAL WIDGET */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg mb-6 flex items-center justify-between">
          <div>
              <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Daily Goal</p>
              <div className="flex items-baseline">
                  <span className="text-2xl font-black">{userStats.dailyReviews}</span>
                  <span className="text-sm text-indigo-200 ml-1">/ {DAILY_GOAL_TARGET} cards</span>
              </div>
          </div>
          <div className="flex items-center space-x-4">
              <div className="text-center">
                  <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Streak</p>
                  <div className="flex items-center bg-white/20 rounded-lg px-2 py-1">
                      <Flame className="w-4 h-4 mr-1 text-orange-300" fill="currentColor" />
                      <span className="font-bold">{userStats.streak}</span>
                  </div>
              </div>
              <div className="relative w-12 h-12">
                  <svg className="w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-indigo-800/30" />
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white transition-all duration-1000 ease-out" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * goalProgress) / 100} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{goalProgress}%</div>
              </div>
          </div>
      </div>
      
      {hasDecks ? (
        <div className="grid gap-4">
          {filteredDecks.length === 0 && (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm font-medium">
              No decks match &ldquo;{searchTerm}&rdquo;
            </div>
          )}
          {filteredDecks.map(deck => {
            const deckProgress = progressMap[deck.id] || {};
            const total = deck.cards.length;
            const mastered = Object.values(deckProgress).filter(s => s.interval > 20).length;
            const due = Object.values(deckProgress).filter(s => s.dueDate <= Date.now()).length;
            return (
              <div key={deck.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5" onClick={() => onSelectDeck(deck.id)}>
                <div className={`absolute top-0 left-0 w-2 h-full ${deck.color || 'bg-indigo-500'}`}></div>
                <div className="flex justify-between items-start mb-2 pl-3">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate pr-4">{deck.name}</h3>
                  <div className="flex space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); onSplitDeck(deck); }} className="text-gray-300 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-gray-700" title="Split into smaller decks"><Scissors className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteDeck(deck.id); }} className="text-gray-300 hover:text-red-400 dark:text-gray-500 dark:hover:text-red-400 transition p-2 rounded-full hover:bg-red-50 dark:hover:bg-gray-700" title="Delete Deck"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="pl-3">
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide font-bold">
                    <span>{total} Cards</span>
                    <span>{Math.round((mastered / total) * 100)}% Mastered</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
                    <div className={`h-full ${deck.color || 'bg-indigo-500'}`} style={{ width: `${Math.round((mastered / total) * 100)}%` }}></div>
                  </div>
                  {due > 0 ? (
                    <div className="mt-3 inline-flex items-center px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-md text-xs font-bold animate-pulse">
                      <Flame className="w-3 h-3 mr-1" /> {due} Due Now
                    </div>
                  ) : (
                    <div className="mt-3 inline-flex items-center px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-500 dark:text-green-400 rounded-md text-xs font-bold">
                        <Check className="w-3 h-3 mr-1" /> All Caught Up
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Book className="w-10 h-10 text-indigo-300 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Welcome to JP 3000!</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">Import a CSV file to create your first flashcard deck.</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition flex items-center"
          >
            <Upload className="w-5 h-5 mr-2" /> Import CSV
          </button>
        </div>
      )}
    </div>
  );
};
