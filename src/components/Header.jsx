import React from 'react';
import { Book, Sun, Moon, Home, ChevronRight } from 'lucide-react';

export const Header = ({ activeDeck, view, onBack, onGoToLibrary, onImport, darkMode, toggleDarkMode }) => {
  return (
    <header className="bg-white dark:bg-gray-900 px-6 py-4 flex flex-col sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300 flex-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-black tracking-tighter text-xl cursor-pointer" onClick={onGoToLibrary}>
          <Book className="w-6 h-6" />
          <h1>JP 3000</h1>
        </div>
        
        <div className="flex items-center space-x-2">
            {/* Context-specific actions */}
            {view === 'library' && (
              <button 
                onClick={onImport}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition border border-indigo-100 dark:border-indigo-800"
              >
                Import CSV
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Toggle Theme"
            >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {view !== 'library' && (
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 animate-in slide-in-from-left-2 duration-300">
          <button 
            onClick={onGoToLibrary}
            className="font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center"
          >
            <Home className="w-3 h-3 mr-1" /> All Decks
          </button>
          
          {activeDeck && (
            <>
              <ChevronRight className="w-3 h-3 mx-1 text-gray-300 dark:text-gray-600" />
              <button 
                onClick={onBack}
                disabled={view === 'dashboard'}
                className={`font-bold truncate max-w-[120px] ${view === 'dashboard' ? 'text-gray-700 dark:text-gray-200' : 'text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300'}`}
              >
                {activeDeck.name}
              </button>
              
              {view !== 'dashboard' && view !== 'study' && (
                <>
                  <ChevronRight className="w-3 h-3 mx-1 text-gray-300 dark:text-gray-600" />
                  <span className="font-bold text-gray-700 dark:text-gray-200 capitalize">
                    {view === 'list' ? 'Cards' : view === 'settings' ? 'Settings' : view}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
};
