import React from 'react';
import { X, HelpCircle, RotateCcw, Shuffle, ChevronRight } from 'lucide-react';
import { Flashcard } from './Flashcard';

export const StudyView = ({ 
    sessionQueue, 
    currentIndex, 
    isFlipped, 
    setIsFlipped, 
    handleDragProgress, 
    handleSwipe, 
    activeSettings, 
    isReverseMode, 
    setShowExitModal, 
    setShowShortcuts, 
    countTextRef, 
    percentageTextRef, 
    progressBarRef, 
    handleUndo, 
    history, 
    handleShuffle, 
    handleNavigate, 
    handleRate 
}) => {
    return (
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
                    onSwipe={handleSwipe} 
                    hideRomaji={activeSettings.hideRomaji} 
                    autoPlay={activeSettings.autoPlay}
                    reverse={isReverseMode}
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
    );
};
