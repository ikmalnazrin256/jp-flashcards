import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Book, Settings, Trophy, List, ChevronRight, ChevronLeft, Shuffle, Upload, Check, X, Flame, Plus, Trash2, FolderOpen, Filter, Zap, AlertTriangle, Download, Hash, Scissors, Home, Search, RefreshCw, Layers, LogOut, Volume2, Edit2, Save, ExternalLink, RotateCcw, Keyboard, HelpCircle, Eye, HardDrive, FileJson, PlayCircle, PenTool, Moon, Sun, Tag, Play, Calendar, Repeat } from 'lucide-react';

// --- CONSTANTS ---
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
const DAILY_GOAL_TARGET = 30; // Cards per day

// --- DATA: Default Sample (Fallback) ---
const DEFAULT_CARDS = [
  { id: 'def-1', originalNumber: '1', kanji: '私', kana: 'わたし', romaji: 'watashi', english: 'I / Me', level: 'N5' },
  { id: 'def-2', originalNumber: '2', kanji: '猫', kana: 'ねこ', romaji: 'neko', english: 'Cat', level: 'N5' },
  { id: 'def-3', originalNumber: '3', kanji: '犬', kana: 'いぬ', romaji: 'inu', english: 'Dog', level: 'N5' },
  { id: 'def-4', originalNumber: '4', kanji: '食べる', kana: 'たべる', romaji: 'taberu', english: 'To eat', level: 'N5' },
  { id: 'def-5', originalNumber: '5', kanji: '見る', kana: 'みる', romaji: 'miru', english: 'To see / To watch', level: 'N5' },
  { id: 'def-6', originalNumber: '6', kanji: '本', kana: 'ほん', romaji: 'hon', english: 'Book', level: 'N5' },
];

const DEFAULT_DECK = {
  id: 'default-deck',
  name: 'Starter Deck (N5)',
  cards: DEFAULT_CARDS,
  createdAt: Date.now(),
  color: 'bg-indigo-600'
};

const COLOR_OPTIONS = [
    { name: 'Indigo', value: 'bg-indigo-600' },
    { name: 'Blue', value: 'bg-blue-600' },
    { name: 'Green', value: 'bg-emerald-600' },
    { name: 'Red', value: 'bg-rose-600' },
    { name: 'Orange', value: 'bg-orange-500' },
    { name: 'Purple', value: 'bg-purple-600' },
    { name: 'Pink', value: 'bg-pink-600' },
    { name: 'Slate', value: 'bg-slate-600' },
];

// --- UTILS: SRS Algorithm ---
const calculateSRS = (currentStats, rating) => {
  let { interval, ease, reviews } = currentStats || { interval: 0, ease: 2.5, status: 'new', reviews: 0 };
  let nextInterval, nextEase = ease, nextStatus = 'review';

  if (rating === 1) { // Again
    nextInterval = 0;
    nextEase = Math.max(1.3, ease - 0.2);
    nextStatus = 'learning';
  } else if (rating === 2) { // Hard
    nextInterval = Math.max(1, interval * 1.2);
    nextEase = Math.max(1.3, ease - 0.15);
  } else if (rating === 3) { // Good
    nextInterval = interval === 0 ? 1 : interval * ease;
  } else if (rating === 4) { // Easy
    nextInterval = interval === 0 ? 4 : interval * ease * 1.3;
    nextEase = ease + 0.15;
  }

  return {
    interval: Math.round(nextInterval * 10) / 10,
    ease: nextEase,
    status: nextStatus,
    dueDate: Date.now() + (nextInterval * MILLISECONDS_IN_DAY),
    lastReviewed: Date.now(),
    lastRating: rating,
    reviews: (reviews || 0) + 1
  };
};

const formatTimeInterval = (days) => {
  if (days <= 0) return '<10m';
  if (days < 1) return '1d';
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
};

// --- UTILS: Haptics & Audio ---
const triggerHaptic = (pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

const playAudio = (text) => {
  if (!text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP'; 
  utterance.rate = 0.9; 
  const voices = window.speechSynthesis.getVoices();
  const jpVoice = voices.find(v => v.lang.includes('ja') || v.lang.includes('JP'));
  if (jpVoice) utterance.voice = jpVoice;
  window.speechSynthesis.speak(utterance);
};

const sanitize = (text) => {
  return text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
};

const parseCSV = (text) => {
  const cleanText = text.replace(/^\uFEFF/, '');
  const rows = cleanText.split(/\r?\n/).map(row => row.trim()).filter(r => r);
  if (rows.length < 2) return [];

  const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  
  return rows.slice(1).map((row, index) => {
    const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    const card = { id: `csv-${Date.now()}-${index}` };
    
    headers.forEach((header, i) => {
      if (!values[i]) return;
      const val = sanitize(values[i]);
      
      if (['#', 'no', 'id', 'number', 'index'].includes(header)) {
        card.originalNumber = val;
      }
      else if (header.includes('kanji') || header === 'japanese') {
        card.kanji = val;
      }
      else if (header === 'kana' || header.includes('reading')) {
        card.kana = val;
      }
      else if (header.includes('romaji')) {
        card.romaji = val;
      }
      else if (header.includes('english') || header.includes('translation') || header.includes('meaning')) {
        card.english = val;
      }
      else if (header.includes('level') || header === 'week') {
        card.level = header === 'week' ? `W${val}` : val;
      }
      else if (header.includes('tag') || header.includes('jlpt') || header.includes('group') || header.includes('type')) {
          if (!card.level) card.level = val;
      }
    });

    return {
      id: card.id,
      originalNumber: card.originalNumber || (index + 1).toString(),
      kanji: card.kanji || '?',
      kana: card.kana || '', 
      romaji: card.romaji || '',
      english: card.english || 'No definition',
      level: card.level || 'Uncategorized'
    };
  });
};

const exportToCSV = (deck) => {
  if (!deck || !deck.cards) return;
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF#,Kanji,Kana,Romaji,English,Level\n"; 
  deck.cards.forEach(card => {
    const row = [
      `"${card.originalNumber || ''}"`,
      `"${card.kanji || ''}"`,
      `"${card.kana || ''}"`,
      `"${card.romaji || ''}"`,
      `"${card.english || ''}"`,
      `"${card.level || ''}"`
    ].join(",");
    csvContent += row + "\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${deck.name.replace(/\s+/g, '_')}_export.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- COMPONENTS ---

const ErrorBoundary = class extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("App crashed:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Something went wrong.</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The application encountered an unexpected error.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
};

const Toast = ({ message }) => (
  <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-[150] animate-in slide-in-from-top-4 duration-300 transition-opacity opacity-95 text-sm font-bold whitespace-nowrap flex items-center pointer-events-none">
    <Check className="w-4 h-4 mr-2 text-green-400 dark:text-green-600" /> {message}
  </div>
);

const DeleteConfirmationModal = ({ isOpen, deckName, onConfirm, onCancel }) => {
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

const ExitConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
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

const ShortcutsModal = ({ isOpen, onClose }) => {
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

const EditCardModal = ({ isOpen, card, onSave, onCancel, mode = 'edit' }) => {
  const [formData, setFormData] = useState(card || {});

  useEffect(() => {
    if (isOpen) {
        setFormData(card || { kanji: '', kana: '', romaji: '', english: '', level: 'N5' });
    }
  }, [card, isOpen]);

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

const EditDeckModal = ({ isOpen, deck, onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('');

    useEffect(() => {
        if(deck) {
            setName(deck.name);
            setColor(deck.color || 'bg-indigo-600');
        }
    }, [deck]);

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

const SplitDeckModal = ({ isOpen, deck, onConfirm, onCancel }) => {
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

const SessionSummary = ({ stats, onContinue, onHome }) => {
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

const CardFace = ({ data, side = 'front', hideRomaji = false, reverse = false, onToast }) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [data?.id]);

  if (!data) return <div className="w-full h-full rounded-3xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"><p className="text-gray-400 text-sm font-bold uppercase tracking-widest">End of Stack</p></div>;
  
  const handleSpeak = (e) => {
    e.stopPropagation();
    playAudio(data.kana || data.kanji);
  };

  const openDictionary = (e) => {
    e?.stopPropagation(); 
    window.open(`https://jisho.org/search/${data.kanji || data.kana}`, '_blank');
  };

  // Determine what to show based on reverse mode
  const showFrontJapanese = !reverse;
  
  // Content for Japanese Side (Kanji/Kana)
  const JapaneseContent = (
      <>
          <div className="text-center w-full relative group">
             <h2 className={`font-black text-gray-800 dark:text-white mb-4 ${data.kanji && data.kanji.length > 5 ? 'text-3xl' : 'text-6xl'}`}>{data.kanji}</h2>
             <button 
                onClick={handleSpeak}
                className="absolute -right-2 top-1/2 transform -translate-y-1/2 p-3 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:text-gray-600 dark:hover:text-indigo-400 dark:hover:bg-gray-700 rounded-full transition-all"
                title="Play Audio"
             >
               <Volume2 className="w-6 h-6" />
             </button>
             
             {/* HINT SYSTEM */}
             {data.kana && (
                <div className="mt-2 h-6 flex justify-center">
                    {showHint ? (
                        <p className="text-xl text-indigo-500 dark:text-indigo-400 font-medium animate-in fade-in slide-in-from-top-2">{data.kana}</p>
                    ) : (
                        <button onClick={(e) => { e.stopPropagation(); setShowHint(true); }} className="text-xs font-bold text-gray-300 dark:text-gray-600 hover:text-indigo-400 dark:hover:text-indigo-400 uppercase tracking-widest flex items-center justify-center transition-colors">
                            <Eye className="w-3 h-3 mr-1" /> Show Reading
                        </button>
                    )}
                </div>
             )}
          </div>
      </>
  );

  // Content for English Side
  const EnglishContent = (
      <div className="text-center"><span className="text-indigo-200 dark:text-gray-400 text-xs uppercase tracking-widest font-bold block mb-1">Translation</span><p className="text-3xl font-bold leading-tight text-white dark:text-white">{data.english}</p></div>
  );

  // Content for Back Details (Romaji/Pronunciation)
  const PronunciationDetails = (
      <div className="mb-8 text-center relative w-full">
        <span className="text-indigo-200 dark:text-gray-400 text-xs uppercase tracking-widest font-bold block mb-1">Pronunciation</span>
        <div className="flex flex-col items-center justify-center relative">
            {hideRomaji ? 
              <p className="text-white/40 dark:text-gray-500 text-sm italic border-b border-white/20 dark:border-gray-700 pb-1 inline-block mb-1">Hidden</p> : 
              <p className="text-white text-3xl font-bold italic font-mono leading-none mb-2">{data.romaji}</p>
            }
            <p className="text-indigo-100 dark:text-gray-300 text-xl font-bold">{data.kana}</p>
        </div>
        <div className="absolute right-0 top-0 flex flex-col space-y-2">
            <button 
                onClick={handleSpeak}
                className="p-2 text-indigo-300 dark:text-gray-500 hover:text-white dark:hover:text-white rounded-full transition-colors"
                title="Play Audio"
            >
                <Volume2 className="w-5 h-5" />
            </button>
        </div>
      </div>
  );

  return (
    <div className={`w-full h-full rounded-3xl flex flex-col items-center justify-center p-6 overflow-hidden select-none ${side === 'back' ? 'bg-indigo-600 dark:bg-gray-800 text-white' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}>
      {side === 'front' && (
        <>
          <span className="text-xs font-bold text-indigo-400 dark:text-indigo-300 absolute top-6 right-6 border border-indigo-200 dark:border-indigo-800 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30">{data.level}</span>
          <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600 absolute top-6 left-6">#{data.originalNumber}</span>
          
          {/* Reverse Logic: Show English on front if reverse mode is on */}
          {showFrontJapanese ? JapaneseContent : <div className="text-gray-800 dark:text-white text-center"><p className="text-3xl font-bold">{data.english}</p></div>}
          
          <p className="text-gray-400 dark:text-gray-600 text-xs font-semibold mt-8 absolute bottom-6 tracking-widest uppercase">Tap to flip</p>
        </>
      )}
      {side === 'back' && (
        <>
          {showFrontJapanese ? (
              // Standard: Back shows Pronunciation + English
              <>
                  {PronunciationDetails}
                  <div className="w-12 h-1 bg-white/20 dark:bg-gray-700 rounded-full mb-8"></div>
                  {EnglishContent}
              </>
          ) : (
              // Reverse: Back shows Pronunciation + Japanese Kanji
              <>
                  {PronunciationDetails}
                  <div className="w-12 h-1 bg-white/20 dark:bg-gray-700 rounded-full mb-8"></div>
                  <div className="text-center w-full">
                      <span className="text-indigo-200 dark:text-gray-400 text-xs uppercase tracking-widest font-bold block mb-1">Japanese</span>
                      <h2 className="font-black text-white text-5xl mb-4">{data.kanji}</h2>
                  </div>
              </>
          )}
          
          <button 
            onClick={openDictionary}
            className="mt-8 flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-800/30 dark:shadow-black/30 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-transform active:scale-95"
            title="Open Jisho Dictionary (J)"
          >
            <Book className="w-4 h-4 mr-2" /> Jisho
          </button>
        </>
      )}
    </div>
  );
};

const Flashcard = ({ data, prevData, nextData, isFlipped, onFlip, onSwipe, onDrag, hideRomaji, autoPlay, reverse, onToast }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  const dragXRef = useRef(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  // --- AUTO-PLAY LOGIC ---
  useEffect(() => {
    if (isFlipped && autoPlay && data) {
        // Small delay to ensure smooth flip animation first
        const timer = setTimeout(() => {
            playAudio(data.kana || data.kanji);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isFlipped, autoPlay, data]);

  const handleStart = (clientX) => {
    if (isAnimatingOut) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    startXRef.current = clientX;
  };

  const handleMove = useCallback((clientX) => {
    if (!isDraggingRef.current) return;
    let delta = clientX - startXRef.current;
    
    // Boundary constraints
    if (!prevData && delta > 0) delta = 0;
    if (!nextData && delta < 0) delta = 0;

    dragXRef.current = delta;
    setDragX(delta);
    if (onDrag) onDrag(delta); 
  }, [onDrag, prevData, nextData]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;
    const currentDrag = dragXRef.current;
    const threshold = 100;
    const exitDistance = 1000;

    if (Math.abs(currentDrag) > threshold) {
      setIsAnimatingOut(true);
      const targetDrag = currentDrag > 0 ? exitDistance : -exitDistance;
      setDragX(targetDrag);
      if (onDrag) onDrag(targetDrag); 
      setTimeout(() => { 
          triggerHaptic(20);
          onSwipe(currentDrag > 0 ? 'right' : 'left'); 
      }, 200);
    } else {
      setDragX(0);
      dragXRef.current = 0;
      if (onDrag) onDrag(0); 
    }
  }, [onSwipe, onDrag]);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const onMouseDown = (e) => handleStart(e.clientX);
  const onTouchStart = (e) => handleStart(e.touches[0].clientX);

  const rotate = dragX * 0.05;
  const transition = isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
  const progress = Math.min(Math.abs(dragX) / 150, 1);
  const bgOpacity = progress;
  const rightTintOpacity = dragX > 0 ? Math.min(dragX / 300, 0.4) : 0;
  const leftTintOpacity = dragX < 0 ? Math.min(Math.abs(dragX) / 300, 0.4) : 0;

  return (
    <div className="relative w-full max-w-sm h-80 perspective-1000 mx-auto select-none touch-none">
      <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0">
         <div className="absolute inset-0 shadow-xl rounded-3xl" style={{ opacity: dragX < 0 ? bgOpacity : 0, transition: isDragging ? 'none' : 'all 0.2s ease-out' }}><CardFace data={nextData} side="front" reverse={reverse} /></div>
         <div className="absolute inset-0 shadow-xl rounded-3xl" style={{ opacity: dragX > 0 ? bgOpacity : 0, transition: isDragging ? 'none' : 'all 0.2s ease-out' }}><CardFace data={prevData} side="front" reverse={reverse} /></div>
      </div>
      <div className="relative w-full h-full shadow-xl rounded-3xl will-change-transform" style={{ transform: `translateX(${dragX}px) rotate(${rotate}deg)`, transition, cursor: isDragging ? 'grabbing' : 'grab', zIndex: 10 }} onMouseDown={onMouseDown} onTouchStart={onTouchStart} onClick={() => { if(Math.abs(dragX) < 5) { triggerHaptic(10); onFlip(); } }}>
        <div className={`relative w-full h-full transform-style-3d transition-transform duration-300 ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute w-full h-full backface-hidden" style={{ zIndex: isFlipped ? 0 : 2 }}>
             <CardFace data={data} side="front" reverse={reverse} onToast={onToast} />
             {dragX > 0 && <div className="absolute top-4 left-4 border-4 border-green-500 text-green-500 rounded-xl px-2 py-1 text-xl font-black uppercase opacity-50 transform -rotate-12">Prev</div>}
             {dragX < 0 && <div className="absolute top-4 right-4 border-4 border-red-500 text-red-500 rounded-xl px-2 py-1 text-xl font-black uppercase opacity-50 transform rotate-12">Next</div>}
             <div className="absolute inset-0 bg-green-500 pointer-events-none" style={{ opacity: rightTintOpacity, mixBlendMode: 'overlay' }}></div>
             <div className="absolute inset-0 bg-red-500 pointer-events-none" style={{ opacity: leftTintOpacity, mixBlendMode: 'overlay' }}></div>
          </div>
          <div className="absolute w-full h-full backface-hidden rotate-y-180" style={{ zIndex: isFlipped ? 2 : 0 }}><CardFace data={data} side="back" hideRomaji={hideRomaji} reverse={reverse} onToast={onToast} /></div>
        </div>
      </div>
    </div>
  );
};

// --- REDESIGNED NAVIGATION: Header with Breadcrumbs ---

const Header = ({ activeDeck, view, onBack, onGoToLibrary, onImport, darkMode, toggleDarkMode }) => {
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

// --- UPDATED VIEWS ---

const LibraryView = ({ decks, progressMap, userStats, onSelectDeck, onDeleteDeck, onSplitDeck, fileInputRef }) => {
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
          {decks.map(deck => {
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
                    <button onClick={(e) => { e.stopPropagation(); onSplitDeck(deck); }} className="text-gray-300 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-gray-700" title="Split Deck"><Scissors className="w-4 h-4" /></button>
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

const DeckDashboardView = ({ deck, stats, onStart, onViewCards, onViewSettings, onExport, onEditDeck, onAddCard, activeSession, onResumeSession, onDiscardSession }) => {
  const [filters, setFilters] = useState({ new: true, again: true, hard: true, good: true, easy: true, ignoreDueDate: false });
  const [startFrom, setStartFrom] = useState('');
  const [reverseMode, setReverseMode] = useState(false); // NEW: Reverse Mode Toggle
  
  // CATEGORY/TAG LOGIC:
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Calculate unique tags available in this deck
  const availableTags = useMemo(() => {
     if(!deck) return [];
     const tags = new Set();
     deck.cards.forEach(c => {
         if(c.level) tags.add(c.level);
     });
     return Array.from(tags).sort();
  }, [deck]);

  // Select all tags by default on load
  useEffect(() => {
      setSelectedTags(availableTags);
  }, [availableTags.length]); 

  const toggleFilter = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  
  const toggleTag = (tag) => {
      setSelectedTags(prev => 
          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
  };
  
  const toggleAllTags = () => {
      if (selectedTags.length === availableTags.length) {
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
          tags: selectedTags,
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
                   {selectedTags.length === availableTags.length ? 'Clear All' : 'Select All'}
               </button>
             </div>
             {availableTags.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${selectedTags.includes(tag) ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-indigo-300'}`}
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

// 3. Main App Container
const App = () => {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  
  const [decks, setDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [progressMap, setProgressMap] = useState({}); 
  const [deckSettings, setDeckSettings] = useState({}); 
  const [deckToDelete, setDeckToDelete] = useState(null); 
  const [deckToSplit, setDeckToSplit] = useState(null);
  const [deckToEdit, setDeckToEdit] = useState(null); 
  const [showExitModal, setShowExitModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [isAddingCard, setIsAddingCard] = useState(false); 
  const [history, setHistory] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // SESSION PERSISTENCE
  const [activeSession, setActiveSession] = useState(null);

  // USER STATS (STREAK, GOALS)
  const [userStats, setUserStats] = useState({
      streak: 0,
      lastStudyDate: null,
      dailyReviews: 0,
      lastReviewDate: null
  });

  // DARK MODE STATE
  const [darkMode, setDarkMode] = useState(false);

  // Search state for ListView
  const [searchTerm, setSearchTerm] = useState('');
  // Filter state for ListView
  const [listFilter, setListFilter] = useState('all'); // 'all', 'new', 'again', etc.
  const [listCategoryFilter, setListCategoryFilter] = useState('all'); // New Category Filter
  
  const [view, setView] = useState('library'); 
  const [sessionQueue, setSessionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // New State for Session Stats
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  // REVERSE MODE
  const [isReverseMode, setIsReverseMode] = useState(false);

  const activeDeck = useMemo(() => decks.find(d => d.id === activeDeckId), [decks, activeDeckId]);
  const activeProgress = useMemo(() => activeDeckId ? (progressMap[activeDeckId] || {}) : {}, [progressMap, activeDeckId]);
  const activeSettings = useMemo(() => activeDeckId ? (deckSettings[activeDeckId] || { dailyNew: 10, hideRomaji: false, autoPlay: false }) : {}, [deckSettings, activeDeckId]);

  // Calculate unique tags available in this deck for List View
  const availableListTags = useMemo(() => {
     if(!activeDeck) return [];
     const tags = new Set();
     activeDeck.cards.forEach(c => {
         if(c.level) tags.add(c.level);
     });
     return Array.from(tags).sort();
  }, [activeDeck]);


  // File Input Ref for FAB
  const fileInputRef = useRef(null);
  const restoreInputRef = useRef(null);
  const progressBarRef = useRef(null);
  const countTextRef = useRef(null);
  const percentageTextRef = useRef(null);

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 2500); };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    if (view !== 'study') return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault(); 
        if (!isFlipped) {
            triggerHaptic(10);
            setIsFlipped(true);
        }
      } else if (e.code === 'ArrowRight') {
        if (!isFlipped) handleNavigate('next');
      } else if (e.code === 'ArrowLeft') {
        if (!isFlipped) handleNavigate('prev');
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      } else if (e.key === 'z' || e.key === 'Z') {
          handleUndo();
      } else if (e.key === 'j' || e.key === 'J') {
          const currentCard = sessionQueue[currentIndex];
          if(currentCard) window.open(`https://jisho.org/search/${currentCard.kanji || currentCard.kana}`, '_blank');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isFlipped, currentIndex, sessionQueue, history]); 

  useEffect(() => {
    try {
      const savedDecks = JSON.parse(localStorage.getItem('jp_flashcards_decks') || '[]');
      const savedProgress = JSON.parse(localStorage.getItem('jp_flashcards_progress_global') || '{}');
      const savedSettings = JSON.parse(localStorage.getItem('jp_flashcards_settings_global') || '{}');
      const savedSession = JSON.parse(localStorage.getItem('jp_flashcards_active_session') || 'null');
      const savedDarkMode = localStorage.getItem('jp_flashcards_darkmode') === 'true'; 
      const savedStats = JSON.parse(localStorage.getItem('jp_flashcards_user_stats') || '{"streak": 0, "lastStudyDate": null, "dailyReviews": 0, "lastReviewDate": null}');
      
      if (savedDecks.length === 0) setDecks([DEFAULT_DECK]); else setDecks(savedDecks);
      setProgressMap(savedProgress);
      setDeckSettings(savedSettings);
      setActiveSession(savedSession);
      setDarkMode(savedDarkMode);
      setUserStats(savedStats);
    } catch(e) { setDecks([DEFAULT_DECK]); }
    setLoading(false);
  }, []);

  useEffect(() => { const timeout = setTimeout(() => { if(!loading) localStorage.setItem('jp_flashcards_decks', JSON.stringify(decks)); }, 1000); return () => clearTimeout(timeout); }, [decks, loading]);
  useEffect(() => { const timeout = setTimeout(() => { if(!loading) localStorage.setItem('jp_flashcards_progress_global', JSON.stringify(progressMap)); }, 1000); return () => clearTimeout(timeout); }, [progressMap, loading]);
  useEffect(() => { const timeout = setTimeout(() => { if(!loading) localStorage.setItem('jp_flashcards_settings_global', JSON.stringify(deckSettings)); }, 1000); return () => clearTimeout(timeout); }, [deckSettings, loading]);
  useEffect(() => { const timeout = setTimeout(() => { if(!loading) localStorage.setItem('jp_flashcards_user_stats', JSON.stringify(userStats)); }, 1000); return () => clearTimeout(timeout); }, [userStats, loading]);
  useEffect(() => { localStorage.setItem('jp_flashcards_darkmode', darkMode); }, [darkMode]);
  
  // Persist Active Session
  useEffect(() => {
     if(!loading) localStorage.setItem('jp_flashcards_active_session', JSON.stringify(activeSession));
  }, [activeSession, loading]);

  // Cleanup progress bar style on view change or index change
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.transition = 'width 0.3s ease-out';
      progressBarRef.current.style.width = `${((currentIndex + 1) / sessionQueue.length) * 100}%`;
    }
    if (countTextRef.current) countTextRef.current.innerText = `Card ${currentIndex + 1} / ${sessionQueue.length}`;
    if (percentageTextRef.current) percentageTextRef.current.innerText = `${Math.round(((currentIndex + 1) / sessionQueue.length) * 100)}%`;
  }, [currentIndex, sessionQueue.length, view]);

  const createDeck = (name, cards) => {
    const newDeck = { id: `deck-${Date.now()}`, name, cards, createdAt: Date.now(), color: ['bg-rose-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500'][Math.floor(Math.random()*4)] };
    setDecks(prev => [...prev, newDeck]);
    showToast(`Deck "${name}" created!`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const name = file.name.replace('.csv', '');
        try {
          const cards = parseCSV(text);
          if (cards.length > 0) createDeck(name, cards);
          else alert("CSV appears empty or invalid.");
        } catch(err) { alert("Error parsing CSV"); }
      };
      reader.readAsText(file);
    }
  };

  const handleBackup = () => {
    const data = { decks, progressMap, deckSettings, userStats, version: '1.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jp3000_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Backup downloaded successfully");
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.decks && data.progressMap) {
          if (confirm("This will overwrite your current data. Are you sure?")) {
            setDecks(data.decks);
            setProgressMap(data.progressMap);
            setDeckSettings(data.deckSettings || {});
            if(data.userStats) setUserStats(data.userStats);
            showToast("Data restored successfully");
          }
        } else {
          alert("Invalid backup file");
        }
      } catch (err) {
        alert("Error parsing backup file");
      }
    };
    reader.readAsText(file);
  };

  const requestDeleteDeck = (id) => { const deck = decks.find(d => d.id === id); if (deck) setDeckToDelete(deck); };
  const confirmDeleteDeck = () => {
    if (!deckToDelete) return;
    const id = deckToDelete.id;
    setDecks(prev => prev.filter(d => d.id !== id));
    const newProg = {...progressMap}; delete newProg[id]; setProgressMap(newProg);
    const newSet = {...deckSettings}; delete newSet[id]; setDeckSettings(newSet);
    // Also clear active session if it belongs to this deck
    if(activeSession && activeSession.deckId === id) setActiveSession(null);
    
    if (activeDeckId === id) { setActiveDeckId(null); setView('library'); }
    setDeckToDelete(null);
    showToast("Deck deleted");
  };

  // --- SPLIT DECK LOGIC ---
  const requestSplitDeck = (deck) => setDeckToSplit(deck);
  const performSplitDeck = (batchSize) => {
    if (!deckToSplit || !batchSize) return;
    const { cards, name } = deckToSplit;
    const newDecks = [];
    for (let i = 0; i < cards.length; i += batchSize) {
        const chunk = cards.slice(i, i + batchSize);
        const partNum = Math.floor(i / batchSize) + 1;
        const start = i + 1;
        const end = Math.min(i + batchSize, cards.length);
        newDecks.push({
            id: `deck-${Date.now()}-${partNum}`,
            name: `${name} (Part ${partNum}: ${start}-${end})`,
            cards: chunk,
            createdAt: Date.now(),
            color: ['bg-rose-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500'][Math.floor(Math.random()*4)]
        });
    }
    setDecks(prev => [...prev, ...newDecks]);
    setDeckToSplit(null);
    showToast(`Created ${newDecks.length} sub-decks`);
  };

  const updateSettings = (key, value) => {
    if (!activeDeckId) return;
    setDeckSettings(prev => ({ ...prev, [activeDeckId]: { ...activeSettings, [key]: value } }));
  };
  
  // --- RESET PROGRESS LOGIC ---
  const resetDeckProgress = () => {
      if (!activeDeckId) return;
      if (confirm("Are you sure? This will delete all progress for this deck.")) {
          const newProg = {...progressMap};
          delete newProg[activeDeckId];
          setProgressMap(newProg);
          setActiveSession(null); // Clear any active session
          showToast("Progress reset successfully");
          setView('dashboard');
      }
  };
  
  // --- DECK EDIT LOGIC ---
  const saveDeckEdit = (updatedDeck) => {
      setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));
      setDeckToEdit(null);
      showToast("Deck details updated");
  };
  
  // --- CARD EDIT/ADD LOGIC ---
  const handleAddCard = (newCardData) => {
     if(!activeDeckId) return;
     const newCard = {
         ...newCardData,
         id: `manual-${Date.now()}`,
         originalNumber: (activeDeck.cards.length + 1).toString()
     };
     setDecks(prev => prev.map(d => {
         if (d.id !== activeDeckId) return d;
         return { ...d, cards: [...d.cards, newCard] };
     }));
     setIsAddingCard(false);
     showToast("Card added successfully");
  };

  const saveCardEdit = (updatedCard) => {
      if (!activeDeckId || !updatedCard) return;
      
      setDecks(prevDecks => prevDecks.map(d => {
          if (d.id !== activeDeckId) return d;
          return {
              ...d,
              cards: d.cards.map(c => c.id === updatedCard.id ? updatedCard : c)
          };
      }));
      setEditingCard(null);
      showToast("Card updated");
  };

  const handleShuffle = () => {
    if (sessionQueue.length <= 1) return;
    const current = sessionQueue[currentIndex];
    const upcoming = sessionQueue.slice(currentIndex + 1);
    for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }
    const passed = sessionQueue.slice(0, currentIndex + 1);
    setSessionQueue([...passed, ...upcoming]);
    showToast("Upcoming cards shuffled");
  };

  // --- SESSION MANAGEMENT ---
  const startSession = useCallback((filters) => {
    if (!activeDeck) return;
    const now = Date.now();
    const deckCards = activeDeck.cards;
    const deckProg = activeProgress;

    const reviewCandidates = deckCards.filter(c => {
      const p = deckProg[c.id];
      if (!p) return false;
      let r = p.lastRating;
      if (!r) { if (p.reviews === 0) r = 2; else if (p.interval > 20) r = 4; else if (p.interval > 6) r = 3; else r = 2; }
      if (r === 1 && !filters.again) return false;
      if (r === 2 && !filters.hard) return false;
      if (r === 3 && !filters.good) return false;
      if (r === 4 && !filters.easy) return false;
      
      // CATEGORY FILTER
      if (filters.tags && filters.tags.length > 0) {
          if (!filters.tags.includes(c.level)) return false;
      }
      return true;
    });

    const scheduledReviews = filters.ignoreDueDate 
      ? reviewCandidates 
      : reviewCandidates.filter(c => deckProg[c.id].dueDate <= now);
      
    // Randomize review order a bit
    for (let i = scheduledReviews.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1)); 
        [scheduledReviews[i], scheduledReviews[j]] = [scheduledReviews[j], scheduledReviews[i]]; 
    }

    let newCards = [];
    if (filters.new) {
       let startIndex = 0;
       if (filters.startNumber) {
           const target = parseInt(filters.startNumber);
           const foundIndex = deckCards.findIndex(c => parseInt(c.originalNumber) === target);
           if (foundIndex !== -1) startIndex = foundIndex; else startIndex = Math.max(0, target - 1);
       }
       // Apply filters to new cards too
       newCards = deckCards
          .slice(startIndex) 
          .filter(c => !deckProg[c.id] && (filters.tags && filters.tags.length > 0 ? filters.tags.includes(c.level) : true)) 
          .slice(0, activeSettings.dailyNew); 
    }

    let queue = [...scheduledReviews, ...newCards];
    if (queue.length === 0) { showToast("No cards match filters."); return; }

    setSessionQueue(queue);
    setHistory([]); 
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 }); 
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsReverseMode(filters.reverse || false);
    
    // SAVE NEW SESSION STATE
    const newSession = {
        deckId: activeDeckId,
        queue: queue, // Store full queue objects for simplicity in this demo (better to store IDs for huge decks)
        currentIndex: 0,
        stats: { again: 0, hard: 0, good: 0, easy: 0 },
        history: [],
        timestamp: Date.now(),
        reverseMode: filters.reverse || false
    };
    setActiveSession(newSession);

    setView('study');
  }, [activeDeck, activeProgress, activeSettings]);

  const resumeSession = () => {
      if(!activeSession || activeSession.deckId !== activeDeckId) return;
      
      setSessionQueue(activeSession.queue);
      setHistory(activeSession.history || []);
      setSessionStats(activeSession.stats);
      setCurrentIndex(activeSession.currentIndex);
      setIsReverseMode(activeSession.reverseMode || false);
      setIsFlipped(false);
      setView('study');
  };

  const discardSession = () => {
      if(confirm("Discard current session progress? Reviewed cards will remain reviewed.")) {
          setActiveSession(null);
      }
  };

  const updateUserStats = () => {
      const today = new Date().toISOString().slice(0, 10);
      const lastReview = userStats.lastReviewDate;
      
      let newStreak = userStats.streak;
      let newDaily = userStats.dailyReviews;

      if (lastReview !== today) {
          // New day
          newDaily = 0;
          // Check if yesterday was last review
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastReview === yesterday.toISOString().slice(0, 10)) {
             // Streak continues
          } else if (lastReview !== today) {
             // Streak broken if not today and not yesterday (but allow 0 to start)
             if (userStats.streak > 0) newStreak = 0;
          }
          // Simple streak logic: if reviewed today, ensure streak is at least 1 or increment if continued
          // For simplicity in this demo: we increment streak if last review was yesterday, else reset. 
          // If already reviewed today, don't increment.
      }
      
      // Actually, standard logic:
      // If lastReview == yesterday, streak++
      // If lastReview < yesterday, streak = 1
      // If lastReview == today, keep streak
      
      if (lastReview !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toISOString().slice(0, 10);
          
          if (lastReview === yStr) {
              newStreak++;
          } else {
              newStreak = 1; 
          }
          newDaily = 1;
      } else {
          newDaily++;
      }

      setUserStats({
          streak: newStreak,
          lastStudyDate: today, // Legacy field, keeping for compat
          lastReviewDate: today,
          dailyReviews: newDaily
      });
  };

  const handleRate = (rating) => {
    const currentCard = sessionQueue[currentIndex];
    if (!currentCard || !activeDeckId) return;
    
    triggerHaptic(50);
    updateUserStats();

    const oldStats = activeProgress[currentCard.id];
    const prevSessionStats = {...sessionStats};
    
    const newHistory = [...history, {
        index: currentIndex,
        cardId: currentCard.id,
        oldStats: oldStats, 
        sessionStats: prevSessionStats,
        wasRequeued: rating === 1 
    }];
    setHistory(newHistory);

    const newSessionStats = {
        ...sessionStats,
        [rating === 1 ? 'again' : rating === 2 ? 'hard' : rating === 3 ? 'good' : 'easy']: sessionStats[rating === 1 ? 'again' : rating === 2 ? 'hard' : rating === 3 ? 'good' : 'easy'] + 1
    };
    setSessionStats(newSessionStats);

    const newStats = calculateSRS(oldStats, rating);
    setProgressMap(prev => ({ ...prev, [activeDeckId]: { ...(prev[activeDeckId] || {}), [currentCard.id]: newStats } }));
    
    // Update active session persistence
    let nextIndex = currentIndex + 1;
    let nextQueue = [...sessionQueue];
    
    if (rating === 1) {
        nextQueue.push(currentCard); // Re-queue locally
        setSessionQueue(nextQueue);
    }
    
    // Sync session state
    if (!activeSession) return; // Should exist
    const updatedSession = {
        ...activeSession,
        queue: nextQueue,
        currentIndex: nextIndex, // Temporarily increment, finalized in nav
        stats: newSessionStats,
        history: newHistory,
        reverseMode: isReverseMode
    };
    setActiveSession(updatedSession);
    
    setIsFlipped(false);
    setTimeout(() => {
        if (currentIndex < sessionQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else { 
            // End of session
            setActiveSession(null); // Clear session
            setView('summary'); 
        } 
    }, 150);
  };

  const handleNavigate = (direction) => {
    // Only used for viewing, rating handles real navigation
    if (direction === 'next' && currentIndex < sessionQueue.length - 1) { 
        triggerHaptic(10);
        setIsFlipped(false); 
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        // Sync swipe/arrow nav with saved session state
        if(activeSession) {
            setActiveSession({...activeSession, currentIndex: nextIdx});
        }
    }
    else if (direction === 'prev' && currentIndex > 0) { 
        triggerHaptic(10);
        setIsFlipped(false); 
        const prevIdx = currentIndex - 1;
        setCurrentIndex(prevIdx); 
        // Sync swipe/arrow nav with saved session state
        if(activeSession) {
             setActiveSession({...activeSession, currentIndex: prevIdx});
        }
    }
  };

  const handleUndo = () => {
      if (history.length === 0) return;
      
      triggerHaptic(20);
      const lastAction = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      
      setHistory(newHistory);
      setCurrentIndex(lastAction.index);
      setSessionStats(lastAction.sessionStats);
      
      if (lastAction.oldStats) {
          setProgressMap(prev => ({
              ...prev,
              [activeDeckId]: { ...prev[activeDeckId], [lastAction.cardId]: lastAction.oldStats }
          }));
      } else {
          setProgressMap(prev => {
              const newDeckProgress = {...prev[activeDeckId]};
              delete newDeckProgress[lastAction.cardId];
              return { ...prev, [activeDeckId]: newDeckProgress };
          });
      }
      
      let nextQueue = [...sessionQueue];
      if (lastAction.wasRequeued) {
          nextQueue = nextQueue.slice(0, -1);
          setSessionQueue(nextQueue);
      }
      
      // Sync session state
      if(activeSession) {
          setActiveSession({
              ...activeSession,
              queue: nextQueue,
              currentIndex: lastAction.index,
              stats: lastAction.sessionStats,
              history: newHistory
          });
      }
      
      setIsFlipped(true);
      showToast("Undid last rating");
  };
  
  const handleDragProgress = useCallback((delta) => {
    if (!progressBarRef.current || sessionQueue.length === 0) return;
    
    const total = sessionQueue.length;
    
    if (delta === 0) {
      progressBarRef.current.style.transition = 'width 0.3s ease-out';
      progressBarRef.current.style.width = `${((currentIndex + 1) / total) * 100}%`;
      return;
    }
    
    progressBarRef.current.style.transition = 'none';
    const dragPercentage = Math.max(-1, Math.min(1, delta / 300));
    const currentBase = currentIndex + 1;
    const adjustment = -dragPercentage;
    let newProgressValue = currentBase + adjustment;
    newProgressValue = Math.max(0, Math.min(total, newProgressValue));
    
    const widthPercent = (newProgressValue / total) * 100;
    progressBarRef.current.style.width = `${widthPercent}%`;

    if (countTextRef.current) {
        const visualCardNum = Math.min(Math.max(1, Math.round(newProgressValue)), total);
        countTextRef.current.innerText = `Card ${visualCardNum} / ${total}`;
    }
    if (percentageTextRef.current) {
        const visualPercent = Math.round((newProgressValue / total) * 100);
        percentageTextRef.current.innerText = `${visualPercent}%`;
    }
  }, [currentIndex, sessionQueue.length]);

  // --- NAVIGATION HANDLERS ---
  const goToLibrary = () => {
    setView('library');
    setActiveDeckId(null);
  };

  const goToDashboard = (deckId) => {
    setActiveDeckId(deckId);
    setView('dashboard');
  };

  const goToCards = () => { 
      setListFilter('all'); 
      setListCategoryFilter('all');
      setSearchTerm('');
      setView('list'); 
  };
  const goToSettings = () => setView('settings');

  // Helper for card status in list view
  const getCardRatingType = (cardId) => {
     const p = activeProgress[cardId];
     if (!p) return 'new';
     if (p.lastRating === 1) return 'again';
     if (p.lastRating === 2) return 'hard';
     if (p.lastRating === 3) return 'good';
     if (p.lastRating === 4) return 'easy';
     return 'new'; // Fallback
  };

  const getRatingColor = (type) => {
    switch (type) {
      case 'new': return 'bg-blue-200';
      case 'again': return 'bg-red-400';
      case 'hard': return 'bg-orange-400';
      case 'good': return 'bg-green-400';
      case 'easy': return 'bg-cyan-400';
      default: return 'bg-gray-200';
    }
  };
  
  // List View Variables
  const filteredListCards = activeDeck ? activeDeck.cards
    .filter(card => {
        const matchesSearch = searchTerm === '' || 
          card.kanji.includes(searchTerm) || 
          card.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
          card.originalNumber.includes(searchTerm);
        
        const type = getCardRatingType(card.id);
        const matchesStatus = listFilter === 'all' || type === listFilter;
        
        const matchesCategory = listCategoryFilter === 'all' || card.level === listCategoryFilter;
        
        return matchesSearch && matchesStatus && matchesCategory;
    }) : [];

  return (
    <ErrorBoundary>
      <div className={`h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col border-x border-gray-200 dark:border-gray-800 relative`}>
        
        {/* HIERARCHICAL HEADER - Hidden in study mode */}
        {view !== 'study' && (
          <Header 
            activeDeck={activeDeck}
            view={view}
            onBack={() => {
              if (view === 'dashboard') goToLibrary();
              else if (view === 'list' || view === 'settings') setView('dashboard');
            }}
            onGoToLibrary={goToLibrary}
            onImport={() => fileInputRef.current?.click()}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
          />
        )}

        {toastMessage && <Toast message={toastMessage} />}
        <DeleteConfirmationModal isOpen={!!deckToDelete} deckName={deckToDelete?.name} onConfirm={confirmDeleteDeck} onCancel={() => setDeckToDelete(null)} />
        <SplitDeckModal isOpen={!!deckToSplit} deck={deckToSplit} onConfirm={performSplitDeck} onCancel={() => setDeckToSplit(null)} />
        <ExitConfirmationModal 
            isOpen={showExitModal} 
            onConfirm={() => {
                setShowExitModal(false);
                setView('dashboard');
            }} 
            onCancel={() => setShowExitModal(false)} 
        />
        <EditCardModal 
            isOpen={!!editingCard || isAddingCard} 
            card={isAddingCard ? null : editingCard} 
            mode={isAddingCard ? 'add' : 'edit'}
            onSave={isAddingCard ? handleAddCard : saveCardEdit} 
            onCancel={() => { setEditingCard(null); setIsAddingCard(false); }} 
        />
        <EditDeckModal isOpen={!!deckToEdit} deck={deckToEdit} onSave={saveDeckEdit} onCancel={() => setDeckToEdit(null)} />
        <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-gray-50/50 dark:bg-gray-900">
          {view === 'library' && (
            <div className="relative h-full">
              <LibraryView 
                  decks={decks} 
                  progressMap={progressMap} 
                  userStats={userStats}
                  onSelectDeck={goToDashboard} 
                  onCreateDeck={handleFileChange} 
                  onDeleteDeck={requestDeleteDeck} 
                  onSplitDeck={requestSplitDeck} 
                  fileInputRef={fileInputRef}
              />
            </div>
          )}
          
          {view === 'dashboard' && activeDeck && (
            <DeckDashboardView 
              deck={activeDeck} 
              stats={{ 
                total: activeDeck.cards.length, 
                due: activeDeck.cards.filter(c => (activeProgress[c.id]?.dueDate || 0) <= Date.now() && activeProgress[c.id]).length, 
                new: activeDeck.cards.filter(c => !activeProgress[c.id]).length 
              }} 
              onStart={startSession} 
              onViewCards={goToCards}
              onViewSettings={goToSettings}
              onExport={() => exportToCSV(activeDeck)}
              onEditDeck={() => setDeckToEdit(activeDeck)}
              onAddCard={() => setIsAddingCard(true)}
              activeSession={activeSession && activeSession.deckId === activeDeckId ? activeSession : null}
              onResumeSession={resumeSession}
              onDiscardSession={discardSession}
            />
          )}
          
          {view === 'settings' && activeDeck && (
            <div className="p-6 pb-28 animate-in slide-in-from-right-4 duration-300">
              <div className="mb-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure learning for this deck</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center"><Settings className="w-4 h-4 mr-2" /> Study Config</h3>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2"><label className="text-sm font-bold text-gray-700 dark:text-gray-300">New Cards / Day</label><span className="text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md text-xs">{activeSettings.dailyNew}</span></div>
                    <input type="range" min="0" max="50" step="5" value={activeSettings.dailyNew} onChange={(e) => updateSettings('dailyNew', Number(e.target.value))} className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Hide Romaji</span>
                      <button onClick={() => updateSettings('hideRomaji', !activeSettings.hideRomaji)} className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${activeSettings.hideRomaji ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${activeSettings.hideRomaji ? 'left-7' : 'left-1'}`}></div></button>
                  </div>
                  {/* AUTO PLAY TOGGLE */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center"><Volume2 className="w-4 h-4 mr-2 text-gray-400"/> Auto-play Audio</span>
                      <button onClick={() => updateSettings('autoPlay', !activeSettings.autoPlay)} className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${activeSettings.autoPlay ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 ${activeSettings.autoPlay ? 'left-7' : 'left-1'}`}></div></button>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center mt-6"><HardDrive className="w-4 h-4 mr-2" /> Data Management</h3>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <button onClick={handleBackup} className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition border border-indigo-100 dark:border-indigo-800">
                        <Download className="w-4 h-4 mr-2" /> Backup Data (JSON)
                    </button>
                    <div className="relative">
                        <button onClick={() => restoreInputRef.current?.click()} className="w-full py-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-xl font-bold flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600">
                            <FileJson className="w-4 h-4 mr-2" /> Restore Backup
                        </button>
                        <input type="file" ref={restoreInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                    </div>
                </div>

                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center mt-6"><AlertTriangle className="w-4 h-4 mr-2" /> Danger Zone</h3>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm space-y-4">
                    <button onClick={resetDeckProgress} className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition border border-red-100 dark:border-red-800">
                        <RotateCcw className="w-4 h-4 mr-2" /> Reset Progress
                    </button>
                </div>
              </div>
            </div>
          )}
          
          {view === 'summary' && (
             <SessionSummary 
                stats={sessionStats} 
                onContinue={() => setView('dashboard')} 
                onHome={() => setView('dashboard')}
             />
          )}

          {/* LIST VIEW */}
          {view === 'list' && activeDeck && (
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
                  filteredListCards.map((word, idx) => {
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
                                window.open(`https://jisho.org/search/${word.kanji || word.kana}`, '_blank');
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
          )}

          {/* IMMERSIVE STUDY SESSION OVERLAY */}
          {view === 'study' && activeDeck && (
            <div className="absolute inset-0 z-50 bg-gray-50 dark:bg-gray-900 h-full flex flex-col p-4 animate-in zoom-in-95 duration-200">
              {/* HEADER: EXIT + PROGRESS INFO */}
              <div className="flex items-center justify-between mb-2">
                <button 
                    onClick={() => setShowExitModal(true)}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                <div className="flex items-center space-x-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    <button onClick={() => setShowShortcuts(true)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-indigo-500 transition" title="Shortcuts"><HelpCircle className="w-4 h-4" /></button>
                    <span ref={countTextRef}>Card {currentIndex + 1} / {sessionQueue.length}</span>
                    <span ref={percentageTextRef} className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">{Math.round(((currentIndex + 1) / sessionQueue.length) * 100)}%</span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full mb-4 overflow-hidden">
                <div 
                  ref={progressBarRef}
                  className="bg-indigo-500 h-full" 
                  style={{ width: `${((currentIndex + 1) / sessionQueue.length) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center relative z-0 min-h-0">
                  {sessionQueue[currentIndex] ? ( 
                    <Flashcard 
                      key={sessionQueue[currentIndex].id} 
                      data={sessionQueue[currentIndex]} 
                      prevData={sessionQueue[currentIndex - 1]} 
                      nextData={sessionQueue[currentIndex + 1]} 
                      isFlipped={isFlipped} 
                      onFlip={() => setIsFlipped(!isFlipped)} 
                      onDrag={handleDragProgress} 
                      onSwipe={(dir) => { 
                        if(dir === 'left' && currentIndex < sessionQueue.length - 1) { 
                          setIsFlipped(false); 
                          const nextIdx = currentIndex + 1;
                          setTimeout(() => {
                              setCurrentIndex(nextIdx);
                              if(activeSession) {
                                  // CRITICAL FIX: Ensure activeSession is updated with the NEW index
                                  const updated = { ...activeSession, currentIndex: nextIdx };
                                  setActiveSession(updated);
                                  localStorage.setItem('jp_flashcards_active_session', JSON.stringify(updated));
                              }
                          }, 50); 
                        } 
                        if(dir === 'right' && currentIndex > 0) { 
                          setIsFlipped(false); 
                          const prevIdx = currentIndex - 1;
                          setTimeout(() => {
                              setCurrentIndex(prevIdx);
                              if(activeSession) {
                                  // CRITICAL FIX: Ensure activeSession is updated with the NEW index
                                  const updated = { ...activeSession, currentIndex: prevIdx };
                                  setActiveSession(updated);
                                  localStorage.setItem('jp_flashcards_active_session', JSON.stringify(updated));
                              }
                          }, 50); 
                        } 
                      }} 
                      hideRomaji={activeSettings.hideRomaji} 
                      autoPlay={activeSettings.autoPlay}
                      reverse={isReverseMode}
                      onToast={showToast}
                    /> 
                  ) : ( <div className="text-center text-gray-400">Loading...</div> )}
              </div>

              {/* BOTTOM CONTROL ZONE */}
              <div className="mt-auto w-full space-y-3 pt-2">
                  <div className="flex items-center justify-between px-4">
                      {/* UNDO BUTTON (REPLACES PREV) */}
                      <button 
                        onClick={handleUndo} 
                        disabled={history.length === 0}
                        className={`p-4 rounded-full transition-all active:scale-95 shadow-sm border border-gray-100 dark:border-gray-700 ${history.length === 0 ? 'opacity-30 bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600'}`}
                        title="Undo Last Rating (Z)"
                      >
                        <RotateCcw className="w-6 h-6" />
                      </button>
                      
                      <button onClick={handleShuffle} className="p-3 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 transition active:scale-95" title="Shuffle Upcoming"><Shuffle className="w-5 h-5" /></button>

                      <button onClick={() => handleNavigate('next')} disabled={currentIndex === sessionQueue.length - 1} className={`p-4 rounded-full transition-all active:scale-95 shadow-sm border border-gray-100 dark:border-gray-700 ${currentIndex === sessionQueue.length - 1 ? 'opacity-30 bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600'}`}><ChevronRight className="w-6 h-6" /></button>
                  </div>

                  <div className="h-16 w-full px-1">
                    {isFlipped ? (
                        <div className="grid grid-cols-4 gap-2 h-full animate-in slide-in-from-bottom-2 duration-200">
                            <button onClick={() => handleRate(1)} className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/40 text-red-500 dark:text-red-300 rounded-2xl font-bold text-xs border border-red-100 dark:border-red-900 active:scale-95 transition-transform">Again <span className="text-[9px] opacity-70">(1)</span></button>
                            <button onClick={() => handleRate(2)} className="flex flex-col items-center justify-center bg-orange-50 dark:bg-orange-900/40 text-orange-500 dark:text-orange-300 rounded-2xl font-bold text-xs border border-orange-100 dark:border-orange-900 active:scale-95 transition-transform">Hard <span className="text-[9px] opacity-70">(2)</span></button>
                            <button onClick={() => handleRate(3)} className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/40 text-green-500 dark:text-green-300 rounded-2xl font-bold text-xs border border-green-100 dark:border-green-900 active:scale-95 transition-transform">Good <span className="text-[9px] opacity-70">(3)</span></button>
                            <button onClick={() => handleRate(4)} className="flex flex-col items-center justify-center bg-cyan-50 dark:bg-cyan-900/40 text-cyan-500 dark:text-cyan-300 rounded-2xl font-bold text-xs border border-cyan-100 dark:border-cyan-900 active:scale-95 transition-transform">Easy <span className="text-[9px] opacity-70">(4)</span></button>
                        </div>
                    ) : (
                        <button onClick={() => setIsFlipped(true)} className="w-full h-full bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 hover:bg-indigo-700 active:scale-95 transition-transform text-lg flex items-center justify-center">Show Answer <span className="ml-2 text-xs opacity-70 font-normal">(Space)</span></button>
                    )}
                  </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Input for CSV Import */}
        <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileChange} />
      </div>
    </ErrorBoundary>
  );
};

export default App;