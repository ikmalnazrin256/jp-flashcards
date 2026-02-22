import React, { useState } from 'react';
import { AlertTriangle, LogOut, Keyboard, X, Plus, Edit2, Save, PenTool, Scissors, Upload, RotateCcw, Trash2 } from 'lucide-react';
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
  const clampedBatch = Math.min(Math.max(1, batchSize), totalCards);
  const numDecks = Math.ceil(totalCards / clampedBatch);

  // Build preview labels (show first 4, collapse rest)
  const previewParts = [];
  for (let i = 0; i < numDecks; i++) {
    const start = i * clampedBatch + 1;
    const end = Math.min((i + 1) * clampedBatch, totalCards);
    previewParts.push({ label: `Part ${i + 1}`, range: `${start}–${end}` });
  }
  const PREVIEW_LIMIT = 4;
  const visibleParts = previewParts.slice(0, PREVIEW_LIMIT);
  const hiddenCount = numDecks - PREVIEW_LIMIT;

  const PRESETS = [10, 20, 30, 50];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">

        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-3 text-indigo-500 shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Split Deck</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">{totalCards} cards total</p>
          </div>
        </div>

        {/* What this does */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl p-3 mb-5 text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
          <strong className="block mb-0.5">What does this do?</strong>
          Divides <span className="font-semibold">"{deck.name}"</span> into smaller decks by card order. Your <span className="font-semibold">original deck is kept</span> — only new sub-decks are created. Great for tackling a large deck in manageable chunks.
        </div>

        {/* Cards per part */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Cards per part</label>
          <div className="flex items-center gap-2 mb-3">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setBatchSize(p)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${
                  clampedBatch === p
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={batchSize}
              min="1"
              max={totalCards}
              onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-center font-bold text-base dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              → <strong className="text-indigo-600 dark:text-indigo-400">{numDecks} new deck{numDecks !== 1 ? 's' : ''}</strong> will be created
            </p>
          </div>
        </div>

        {/* Live preview */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Preview</label>
          <div className="flex flex-wrap gap-2">
            {visibleParts.map((p, i) => (
              <span key={i} className="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold">
                <span className="text-indigo-500 mr-1">{p.label}</span>
                <span className="text-gray-400 dark:text-gray-500">cards {p.range}</span>
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg text-xs font-semibold">
                +{hiddenCount} more
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full space-x-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
          <button onClick={() => onConfirm(clampedBatch)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition flex items-center justify-center gap-2">
            <Scissors className="w-4 h-4" /> Split into {numDecks}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ImportOverwriteModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 text-amber-500">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Overwrite Data?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This will <span className="font-semibold text-amber-600 dark:text-amber-400">replace all your current decks and progress</span> with the backup file. This cannot be undone.
          </p>
          <div className="flex w-full space-x-3">
            <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/30 transition">Restore</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResetProgressModal = ({ isOpen, deckName, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reset Progress?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            All SRS progress for{deckName ? <> <span className="font-bold text-gray-700 dark:text-gray-200">"{deckName}"</span></> : ' this deck'} will be permanently deleted. Cards will return to their initial state.
          </p>
          <div className="flex w-full space-x-3">
            <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30 transition">Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DiscardSessionModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 text-orange-500">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Discard Session?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            The current session queue will be cleared.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            Cards you already reviewed in this session will <strong>remain reviewed</strong>.
          </p>
          <div className="flex w-full space-x-3">
            <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition">Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
};
