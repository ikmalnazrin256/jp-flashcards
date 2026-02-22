import React, { useState } from 'react';
import { AlertTriangle, LogOut, Keyboard, X, Plus, Edit2, Save, PenTool, Scissors } from 'lucide-react';
import { COLOR_OPTIONS } from '../constants';

export const DeleteConfirmationModal = ({ isOpen, deckName, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500"><AlertTriangle className="w-6 h-6" /></div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Deck?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete <span className="font-bold text-gray-700 dark:text-gray-200">"{deckName}"</span>?</p>
          <div className="flex w-full space-x-3">
            <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30 transition">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExitConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 text-indigo-500 dark:text-indigo-400"><LogOut className="w-6 h-6 ml-1" /></div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">End Session?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your progress is <strong>saved automatically</strong> after every card.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">You can resume this session later from the dashboard.</p>
          <div className="flex w-full space-x-3">
            <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Stay</button>
            <button onClick={onConfirm} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition">Exit</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const shortcuts = [
    { key: 'Space', desc: 'Flip Card' },
    { key: '1-4', desc: 'Rate Card' },
    { key: 'Z', desc: 'Undo' },
    { key: 'J', desc: 'Jisho Lookup' },
    { key: '→', desc: 'Next Card' },
  ];
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-xs p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center"><Keyboard className="w-5 h-5 mr-2 text-indigo-500"/> Shortcuts</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-2">
            {shortcuts.map(s => (
                <div key={s.key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{s.desc}</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-mono font-bold text-gray-700 dark:text-gray-200 text-xs min-w-[24px] text-center">{s.key}</kbd>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export const EditCardModal = ({ isOpen, card, onSave, onCancel, mode = 'edit' }) => {
  const [formData, setFormData] = useState(card || { kanji: '', kana: '', romaji: '', english: '', level: 'N5' });

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col max-h-[90vh]">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            {mode === 'add' ? <Plus className="w-5 h-5 mr-2 text-indigo-500" /> : <Edit2 className="w-5 h-5 mr-2 text-indigo-500" />}
            {mode === 'add' ? 'Add New Card' : 'Edit Card'}
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
           <div>
             <label className="text-xs font-bold text-gray-400 uppercase">Kanji</label>
             <input className="w-full p-3 border dark:border-gray-600 rounded-xl font-bold text-lg bg-gray-50 dark:bg-gray-700 dark:text-white" value={formData.kanji || ''} onChange={e => setFormData({...formData, kanji: e.target.value})} placeholder="e.g. 私" />
           </div>
           <div>
             <label className="text-xs font-bold text-gray-400 uppercase">Kana (Reading)</label>
             <input className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white" value={formData.kana || ''} onChange={e => setFormData({...formData, kana: e.target.value})} placeholder="e.g. わたし" />
           </div>
           <div>
             <label className="text-xs font-bold text-gray-400 uppercase">Meaning</label>
             <textarea className="w-full p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white h-24" value={formData.english || ''} onChange={e => setFormData({...formData, english: e.target.value})} placeholder="e.g. I / Me" />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase">Romaji</label>
               <input className="w-full p-2 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm" value={formData.romaji || ''} onChange={e => setFormData({...formData, romaji: e.target.value})} placeholder="watashi" />
             </div>
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase">Category / Tag</label>
               <input className="w-full p-2 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm" value={formData.level || ''} onChange={e => setFormData({...formData, level: e.target.value})} placeholder="e.g. N5, Verb, Week 1" />
             </div>
           </div>
        </div>

        <div className="flex w-full space-x-3 mt-6">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition flex items-center justify-center">
            <Save className="w-4 h-4 mr-2" /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const EditDeckModal = ({ isOpen, deck, onSave, onCancel }) => {
  const [name, setName] = useState(deck?.name || '');
  const [color, setColor] = useState(deck?.color || 'bg-indigo-600');

    if (!isOpen || !deck) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <PenTool className="w-5 h-5 mr-2 text-indigo-500" /> Edit Deck
                </h3>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Deck Name</label>
                        <input className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Color Theme</label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((c) => (
                                <button 
                                    key={c.value} 
                                    onClick={() => setColor(c.value)}
                                    className={`w-8 h-8 rounded-full ${c.value} transition-transform hover:scale-110 ${color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex w-full space-x-3">
                    <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
                    <button onClick={() => onSave({ ...deck, name, color })} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition">Save</button>
                </div>
            </div>
        </div>
    );
};

export const SplitDeckModal = ({ isOpen, deck, onConfirm, onCancel }) => {
  const [batchSize, setBatchSize] = useState(50);
  
  if (!isOpen || !deck) return null;

  const totalCards = deck.cards.length;
  const numDecks = Math.ceil(totalCards / batchSize);

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Scissors className="w-5 h-5 mr-2 text-indigo-500" /> Split Deck
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Break <strong>"{deck.name}"</strong> into smaller parts to make learning easier.
        </p>
        
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Cards per Part</label>
          <div className="flex items-center space-x-3">
            <input 
              type="number" 
              value={batchSize}
              min="10"
              max={totalCards}
              onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 50))}
              className="w-24 p-3 border border-gray-200 dark:border-gray-600 rounded-xl text-center font-bold text-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              = <strong className="text-indigo-600 dark:text-indigo-400">{numDecks}</strong> new decks
            </div>
          </div>
        </div>

        <div className="flex w-full space-x-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
          <button onClick={() => onConfirm(batchSize)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition">Split</button>
        </div>
      </div>
    </div>
  );
};
