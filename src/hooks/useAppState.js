import { useState, useEffect } from 'react';
import { STORAGE_KEYS, DEFAULT_USER_STATS, DEFAULT_DECK } from '../constants';
import { normalizeDecks, normalizeProgressMap, normalizeDeckSettings, normalizeActiveSession, normalizeUserStats, safeStorageGetJson, safeStorageSetJson, safeStorageSetText } from '../utils';

export const useAppState = () => {
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState([]);
  const [progressMap, setProgressMap] = useState({}); 
  const [deckSettings, setDeckSettings] = useState({}); 
  const [activeSession, setActiveSession] = useState(null);
  const [userStats, setUserStats] = useState(DEFAULT_USER_STATS);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      const savedDecks = normalizeDecks(safeStorageGetJson(STORAGE_KEYS.decks, []));
      const savedProgress = normalizeProgressMap(safeStorageGetJson(STORAGE_KEYS.progress, {}));
      const savedSettings = normalizeDeckSettings(safeStorageGetJson(STORAGE_KEYS.settings, {}));
      const savedSession = normalizeActiveSession(safeStorageGetJson(STORAGE_KEYS.activeSession, null));
      const darkModeSetting = localStorage.getItem(STORAGE_KEYS.darkMode);
      const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const savedDarkMode = darkModeSetting === null ? Boolean(prefersDark) : darkModeSetting === 'true';
      const savedStats = normalizeUserStats(safeStorageGetJson(STORAGE_KEYS.userStats, DEFAULT_USER_STATS));
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedDecks.length === 0) setDecks([DEFAULT_DECK]); else setDecks(savedDecks);
      setProgressMap(savedProgress);
      setDeckSettings(savedSettings);
      setActiveSession(savedSession);
      setDarkMode(savedDarkMode);
      setUserStats(savedStats);
    } catch { setDecks([DEFAULT_DECK]); }
    setLoading(false);
  }, []);

  useEffect(() => { const timeout = setTimeout(() => { if(!loading) safeStorageSetJson(STORAGE_KEYS.decks, decks); }, 1000); return () => clearTimeout(timeout); }, [decks, loading]);
  useEffect(() => { const timeout = setTimeout(() => { if(!loading) safeStorageSetJson(STORAGE_KEYS.progress, progressMap); }, 1000); return () => clearTimeout(timeout); }, [progressMap, loading]);
  useEffect(() => { const timeout = setTimeout(() => { if(!loading) safeStorageSetJson(STORAGE_KEYS.settings, deckSettings); }, 1000); return () => clearTimeout(timeout); }, [deckSettings, loading]);
  useEffect(() => { const timeout = setTimeout(() => { if(!loading) safeStorageSetJson(STORAGE_KEYS.userStats, userStats); }, 1000); return () => clearTimeout(timeout); }, [userStats, loading]);
  
  useEffect(() => {
    safeStorageSetText(STORAGE_KEYS.darkMode, darkMode ? 'true' : 'false');
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);
  
  useEffect(() => {
     if(!loading) safeStorageSetJson(STORAGE_KEYS.activeSession, activeSession);
  }, [activeSession, loading]);

  return {
    loading,
    decks, setDecks,
    progressMap, setProgressMap,
    deckSettings, setDeckSettings,
    activeSession, setActiveSession,
    userStats, setUserStats,
    darkMode, setDarkMode
  };
};
