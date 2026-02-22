import React from 'react';
import { Search, Tag, Book, Edit2 } from 'lucide-react';
import { formatTimeInterval, openExternalUrl } from '../utils';

export const ListView = ({ 
    activeDeck, 
    searchTerm, 
    setSearchTerm, 
    listFilter, 
    setListFilter, 
    listCategoryFilter, 
    setListCategoryFilter, 
    availableListTags, 
    filteredListCards, 
    activeProgress, 
    getCardRatingType, 
    getRatingColor, 
    setEditingCard 
}) => {
    return (
        <div className="p-4 space-y-4 pb-28 animate-in slide-in-from-right-4 duration-300">
            <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Cards</h2>
                <div className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                {activeDeck.name}
                </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input 
                type="text" 
                placeholder="Search cards..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 dark:text-white" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filter Chips - Status */}
            <div className="flex flex-wrap gap-2 mb-2">
                {[
                    { id: 'all', label: 'All', className: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400' },
                    { id: 'new', label: 'New', className: 'border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20' },
                    { id: 'again', label: 'Again', className: 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20' },
                    { id: 'hard', label: 'Hard', className: 'border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20' },
                    { id: 'good', label: 'Good', className: 'border-green-200 dark:border-green-800 text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/20' },
                    { id: 'easy', label: 'Easy', className: 'border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20' }
                ].map(type => (
                    <button 
                    key={type.id}
                    onClick={() => setListFilter(type.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize transition ${listFilter === type.id ? 'ring-2 ring-offset-1 ring-indigo-500 ' + type.className : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ' + type.className}`}
                    >
                    {type.label}
                    </button>
                ))}
            </div>

            {/* Filter Chips - Category */}
            {availableListTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={() => setListCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize transition ${listCategoryFilter === 'all' ? 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 border-gray-800 dark:border-gray-100' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}
                    >
                        All Categories
                    </button>
                    {availableListTags.map(tag => (
                        <button 
                            key={tag}
                            onClick={() => setListCategoryFilter(tag)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize transition flex items-center ${listCategoryFilter === tag ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}
                        >
                            <Tag className="w-3 h-3 mr-1" /> {tag}
                        </button>
                    ))}
                </div>
            )}
            </div>
            
            {filteredListCards.length > 0 ? (
                filteredListCards.map((word) => {
                const p = activeProgress[word.id];
                const type = getCardRatingType(word.id);
                const statusColor = getRatingColor(type);
                
                return (
                <div key={word.id} className={`p-4 rounded-xl border flex justify-between items-center bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm group`}>
                    <div className="flex items-center w-full min-w-0">
                    <span className="text-gray-300 dark:text-gray-600 text-xs font-mono mr-3 w-6 text-right flex-shrink-0">{word.originalNumber}</span>
                    <div className={`flex-shrink-0 w-2 h-10 rounded-full mr-4 ${statusColor}`}></div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg truncate dark:text-white">{word.kanji} <span className="text-gray-400 dark:text-gray-500 font-normal text-sm ml-2">{word.kana}</span></p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{word.english}</p>
                        {word.level && <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{word.level}</span>}
                    </div>
                    </div>
                    <div className="flex items-center ml-2 space-x-1">
                    {p && <span className="text-xs font-mono text-gray-400 dark:text-gray-600 mr-3 hidden sm:inline-block">{formatTimeInterval(p.interval)}</span>}
                    
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                        openExternalUrl(`https://jisho.org/search/${encodeURIComponent(word.kanji || word.kana || '')}`);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition"
                        title="Look up on Jisho"
                    >
                        <Book className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={() => setEditingCard(word)}
                        className="p-2 text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    </div>
                </div>
                );
            })
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-gray-500 dark:text-gray-400 font-bold">No cards found</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Try adjusting your filters or search term.</p>
                </div>
            )}
        </div>
    );
};
