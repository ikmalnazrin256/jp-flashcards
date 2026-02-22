import React from 'react';
import { Settings, HardDrive, Download, FileJson, AlertTriangle, RotateCcw, Volume2 } from 'lucide-react';

export const SettingsView = ({ activeSettings, updateSettings, handleBackup, restoreInputRef, handleRestore, resetDeckProgress }) => {
    return (
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
    );
};
