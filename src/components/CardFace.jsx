import React, { useState } from 'react';
import { Volume2, Eye, Book } from 'lucide-react';
import { playAudio, openExternalUrl } from '../utils';

export const CardFace = ({ data, side = 'front', hideRomaji = false, reverse = false }) => {
  const [hintCardId, setHintCardId] = useState(null);

  if (!data) return <div className="w-full h-full rounded-3xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"><p className="text-gray-400 text-sm font-bold uppercase tracking-widest">End of Stack</p></div>;
  
  const handleSpeak = (e) => {
    e.stopPropagation();
    playAudio(data.kana || data.kanji);
  };

  const showHint = hintCardId === data.id;

  const openDictionary = (e) => {
    e?.stopPropagation(); 
    openExternalUrl(`https://jisho.org/search/${encodeURIComponent(data.kanji || data.kana || '')}`);
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
                        <button onClick={(e) => { e.stopPropagation(); setHintCardId(data.id); }} className="text-xs font-bold text-gray-300 dark:text-gray-600 hover:text-indigo-400 dark:hover:text-indigo-400 uppercase tracking-widest flex items-center justify-center transition-colors">
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
