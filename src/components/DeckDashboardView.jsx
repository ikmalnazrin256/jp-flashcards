import React, { useState, useMemo } from 'react';
import { Plus, PenTool, Flame, Book, Play, Layers, List, Settings, Filter, RotateCcw, Zap, Download } from 'lucide-react';

export const DeckDashboardView = ({ deck, stats, activeSettings, onStart, onViewCards, onViewSettings, onExport, onEditDeck, onAddCard, activeSession, onResumeSession, onDiscardSession }) => {
  const [filters, setFilters] = useState({ new: true, again: true, hard: true, good: true, easy: true, ignoreDueDate: false });
  const [startFrom, setStartFrom] = useState('');
  const [reverseMode, setReverseMode] = useState(false); // NEW: Reverse Mode Toggle
  
  // CATEGORY/TAG LOGIC:
  const [selectedTags, setSelectedTags] = useState(null);
  
  // Calculate unique tags available in this deck
  const availableTags = useMemo(() => {
     if(!deck) return [];
     const tags = new Set();
     deck.cards.forEach(c => {
         if(c.level) tags.add(c.level);
     });
     return Array.from(tags).sort();
  }, [deck]);

  const selectedTagsValue = selectedTags ?? availableTags;

  const toggleFilter = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  
  const toggleTag = (tag) => {
      const current = selectedTags ?? availableTags;
      setSelectedTags(
        current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]
      );
  };
  
  const toggleAllTags = () => {
      if (selectedTagsValue.length === availableTags.length) {
          setSelectedTags([]);
      } else {
          setSelectedTags(availableTags);
      }
  };

  const handleStart = () => {
      // Validate startFrom input
      const startNum = parseInt(startFrom);
      if (startFrom && (isNaN(startNum) || startNum < 1)) {
          alert("Start card number must be 1 or greater.");
          return;
      }
      
      onStart({
          ...filters,
          startNumber: startFrom,
          tags: selectedTagsValue,
          reverse: reverseMode
      });
  };

  // Distinctive colors for card types
  const filterColors = {
    new: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    again: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    hard: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    good: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    easy: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-black text-gray-800 dark:text-white leading-tight">{deck.name}</h1>
            <div className="flex space-x-2">
                <button onClick={onAddCard} className="text-gray-300 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition p-1 rounded-md" title="Add Card"><Plus className="w-5 h-5"/></button>
                <button onClick={onEditDeck} className="text-gray-300 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition p-1 rounded-md" title="Edit Deck"><PenTool className="w-4 h-4"/></button>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{deck.cards.length} cards in this deck</p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-800">
            <div className="flex items-center text-rose-500 dark:text-rose-400 mb-2">
              <Flame className="w-5 h-5 mr-1" />
              <span className="font-bold text-xs uppercase">Due Now</span>
            </div>
            <p className="text-3xl font-black text-gray-800 dark:text-white">{stats.due}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center text-blue-500 dark:text-blue-400 mb-2">
              <Book className="w-5 h-5 mr-1" />
              <span className="font-bold text-xs uppercase">New</span>
            </div>
            <p className="text-3xl font-black text-gray-800 dark:text-white">{stats.new}</p>
            {activeSettings && (
              <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-1 font-semibold">
                Limit: {activeSettings.reviewPeriod === 'weekly' ? `${activeSettings.weeklyNew ?? 70}/wk` : `${activeSettings.dailyNew ?? 10}/day`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {activeSession ? (
             <div className="space-y-2">
                <button 
                  onClick={onResumeSession}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center"
                >
                  <Play className="w-6 h-6 mr-2" /> Resume Session (Card {activeSession.currentIndex + 1}/{activeSession.queue.length})
                </button>
                <button 
                  onClick={onDiscardSession}
                  className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg font-bold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Discard & Start New
                </button>
             </div>
        ) : (
            <button 
              onClick={handleStart}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center"
            >
              <Layers className="w-6 h-6 mr-2" /> Start Study Session
            </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onViewCards}
            className="py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 text-sm hover:border-indigo-200 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <List className="w-4 h-4 mr-2" /> View Cards
          </button>
          <button 
            onClick={onViewSettings}
            className="py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 text-sm hover:border-indigo-200 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <Settings className="w-4 h-4 mr-2" /> Settings
          </button>
        </div>
      </div>

      {/* Study Options */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
          <Filter className="w-4 h-4 mr-2"/> Study Options
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 dark:text-gray-400">Start from card #</label>
            <input 
              type="number" 
              min="1"
              placeholder="1" 
              value={startFrom} 
              onChange={(e) => setStartFrom(e.target.value)} 
              className="w-20 p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-gray-700 dark:text-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
               <span className="text-sm text-gray-700 dark:text-gray-400 flex items-center"><RotateCcw className="w-3 h-3 mr-2" /> Reverse Cards (EN first)</span>
               <button onClick={() => setReverseMode(!reverseMode)} className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${reverseMode ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${reverseMode ? 'left-7' : 'left-1'}`}></div></button>
          </div>

          {/* CATEGORY FILTERS */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-2">
               <span className="text-sm text-gray-700 dark:text-gray-400">Filter by Category:</span>
               <button onClick={toggleAllTags} className="text-xs font-bold text-indigo-500 hover:text-indigo-600">
                   {selectedTagsValue.length === availableTags.length ? 'Clear All' : 'Select All'}
               </button>
             </div>
             {availableTags.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${selectedTagsValue.includes(tag) ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-indigo-300'}`}
                        >
                            {tag}
                        </button>
                    ))}
                 </div>
             ) : (
                 <p className="text-xs text-gray-400 italic">No categories found in deck.</p>
             )}
          </div>
          
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 dark:text-gray-400">Show card types:</span>
              <button 
                onClick={() => toggleFilter('ignoreDueDate')} 
                className={`text-xs px-3 py-1 rounded-full font-bold transition flex items-center ${filters.ignoreDueDate ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}
              >
                <Zap className="w-3 h-3 mr-1" /> Cram Mode
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['new','again','hard','good','easy'].map(f => (
                <button 
                  key={f} 
                  onClick={() => toggleFilter(f)} 
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition capitalize ${filters[f] ? filterColors[f] : 'border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export */}
      <button 
        onClick={onExport}
        className="w-full py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl font-bold flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border border-gray-200 dark:border-gray-700"
      >
        <Download className="w-4 h-4 mr-2" /> Export Deck as CSV
      </button>
    </div>
  );
};
