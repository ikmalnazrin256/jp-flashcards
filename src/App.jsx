import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { DeleteConfirmationModal, ExitConfirmationModal, ShortcutsModal, EditCardModal, EditDeckModal, SplitDeckModal } from './components/Modals';
import { Header } from './components/Header';
import { LibraryView } from './components/LibraryView';
import { DeckDashboardView } from './components/DeckDashboardView';
import { SettingsView } from './components/SettingsView';
import { SessionSummary } from './components/SessionSummary';
import { ListView } from './components/ListView';
import { StudyView } from './components/StudyView';
import { useAppState } from './hooks/useAppState';
import { useNavigation } from './hooks/useNavigation';
import { createId, sanitize, normalizeCard, normalizeDecks, normalizeProgressMap, normalizeDeckSettings, normalizeUserStats, isAllowedImportFile, parseCSV, exportToCSV, safeJsonParse, calculateSRS, openExternalUrl, triggerHaptic } from './utils';
import { MAX_IMPORT_CARDS, MAX_IMPORT_FILE_SIZE_BYTES, DEFAULT_USER_STATS, DEFAULT_DECK } from './constants';

const App = () => {
  const {
    loading,
    decks, setDecks,
    progressMap, setProgressMap,
    deckSettings, setDeckSettings,
    activeSession, setActiveSession,
    userStats, setUserStats,
    darkMode, setDarkMode
  } = useAppState();

  const [toastMessage, setToastMessage] = useState(null);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [deckToDelete, setDeckToDelete] = useState(null); 
  const [deckToSplit, setDeckToSplit] = useState(null);
  const [deckToEdit, setDeckToEdit] = useState(null); 
  const [showExitModal, setShowExitModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [isAddingCard, setIsAddingCard] = useState(false); 
  const [history, setHistory] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [listFilter, setListFilter] = useState('all'); 
  const [listCategoryFilter, setListCategoryFilter] = useState('all'); 
  
  const [view, setView] = useState('library'); 
  const [sessionQueue, setSessionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [isReverseMode, setIsReverseMode] = useState(false);

  const activeDeck = useMemo(() => decks.find(d => d.id === activeDeckId), [decks, activeDeckId]);
  const activeProgress = useMemo(() => activeDeckId ? (progressMap[activeDeckId] || {}) : {}, [progressMap, activeDeckId]);
  const activeSettings = useMemo(() => activeDeckId ? (deckSettings[activeDeckId] || { dailyNew: 10, weeklyNew: 70, reviewPeriod: 'daily', hideRomaji: false, autoPlay: false }) : {}, [deckSettings, activeDeckId]);

  const availableListTags = useMemo(() => {
     if(!activeDeck) return [];
     const tags = new Set();
     activeDeck.cards.forEach(c => {
         if(c.level) tags.add(c.level);
     });
     return Array.from(tags).sort();
  }, [activeDeck]);

  const fileInputRef = useRef(null);
  const restoreInputRef = useRef(null);
  const progressBarRef = useRef(null);
  const countTextRef = useRef(null);
  const percentageTextRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  useNavigation(view, setView, activeDeckId, setActiveDeckId, loading);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.transition = 'width 0.3s ease-out';
      progressBarRef.current.style.width = `${((currentIndex + 1) / sessionQueue.length) * 100}%`;
    }
    if (countTextRef.current) countTextRef.current.innerText = `Card ${currentIndex + 1} / ${sessionQueue.length}`;
    if (percentageTextRef.current) percentageTextRef.current.innerText = `${Math.round(((currentIndex + 1) / sessionQueue.length) * 100)}%`;
  }, [currentIndex, sessionQueue.length, view]);

  const createDeck = (name, cards) => {
    const sanitizedName = sanitize(name || 'Imported Deck').slice(0, 80) || 'Imported Deck';
    const normalizedCards = Array.isArray(cards) ? cards.slice(0, MAX_IMPORT_CARDS).map((card, index) => normalizeCard(card, index)) : [];
    const newDeck = { id: createId('deck'), name: sanitizedName, cards: normalizedCards, createdAt: Date.now(), color: ['bg-rose-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500'][Math.floor(Math.random()*4)] };
    setDecks(prev => [...prev, newDeck]);
    showToast(`Deck "${sanitizedName}" created!`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isAllowedImportFile(file) || !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a valid .csv file.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      alert('CSV file is too large. Please use a file under 2 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const name = file.name.replace(/\.csv$/i, '');
      try {
        const cards = parseCSV(text);
        if (cards.length > 0) createDeck(name, cards);
        else alert('CSV appears empty or invalid.');
      } catch {
        alert('Error parsing CSV');
      }
      e.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
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
    URL.revokeObjectURL(url);
    showToast("Backup downloaded successfully");
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isAllowedImportFile(file) || !file.name.toLowerCase().endsWith('.json')) {
      alert('Please select a valid .json backup file.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      alert('Backup file is too large. Please use a file under 2 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = safeJsonParse(String(event.target?.result || '{}'), null);
        if (data.decks && data.progressMap) {
          if (confirm("This will overwrite your current data. Are you sure?")) {
            const safeDecks = normalizeDecks(data.decks);
            const safeProgressMap = normalizeProgressMap(data.progressMap);
            const safeDeckSettings = normalizeDeckSettings(data.deckSettings || {});
            const safeUserStats = normalizeUserStats(data.userStats || DEFAULT_USER_STATS);
            setDecks(safeDecks.length > 0 ? safeDecks : [DEFAULT_DECK]);
            setProgressMap(safeProgressMap);
            setDeckSettings(safeDeckSettings);
            setUserStats(safeUserStats);
            showToast("Data restored successfully");
          }
        } else {
          alert("Invalid backup file");
        }
      } catch {
        alert("Error parsing backup file");
      }
      e.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  };

  const requestDeleteDeck = (id) => { const deck = decks.find(d => d.id === id); if (deck) setDeckToDelete(deck); };
  const confirmDeleteDeck = () => {
    if (!deckToDelete) return;
    const id = deckToDelete.id;
    setDecks(prev => prev.filter(d => d.id !== id));
    const newProg = {...progressMap}; delete newProg[id]; setProgressMap(newProg);
    const newSet = {...deckSettings}; delete newSet[id]; setDeckSettings(newSet);
    if(activeSession && activeSession.deckId === id) setActiveSession(null);
    
    if (activeDeckId === id) { setActiveDeckId(null); setView('library'); }
    setDeckToDelete(null);
    showToast("Deck deleted");
  };

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
  
  const resetDeckProgress = () => {
      if (!activeDeckId) return;
      if (confirm("Are you sure? This will delete all progress for this deck.")) {
          const newProg = {...progressMap};
          delete newProg[activeDeckId];
          setProgressMap(newProg);
          setActiveSession(null); 
          showToast("Progress reset successfully");
          setView('dashboard');
      }
  };
  
  const saveDeckEdit = (updatedDeck) => {
      setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));
      setDeckToEdit(null);
      showToast("Deck details updated");
  };
  
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
    const upcoming = sessionQueue.slice(currentIndex + 1);
    for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }
    const passed = sessionQueue.slice(0, currentIndex + 1);
    setSessionQueue([...passed, ...upcoming]);
    showToast("Upcoming cards shuffled");
  };

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
      
      if (filters.tags && filters.tags.length > 0) {
          if (!filters.tags.includes(c.level)) return false;
      }
      return true;
    });

    const scheduledReviews = filters.ignoreDueDate 
      ? reviewCandidates 
      : reviewCandidates.filter(c => deckProg[c.id].dueDate <= now);
      
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

       // Compute how many new cards have already been introduced this period
       let newCardLimit = activeSettings.dailyNew;
       if (activeSettings.reviewPeriod === 'weekly') {
           const today = new Date();
           const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
           const daysSinceMonday = (dayOfWeek + 6) % 7;
           const weekStart = new Date(today);
           weekStart.setHours(0, 0, 0, 0);
           weekStart.setDate(today.getDate() - daysSinceMonday);
           const weekStartMs = weekStart.getTime();
           const newThisWeek = Object.values(deckProg).filter(
               p => p.reviews === 1 && p.lastReviewed >= weekStartMs
           ).length;
           newCardLimit = Math.max(0, (activeSettings.weeklyNew || 70) - newThisWeek);
       }

       newCards = deckCards
          .slice(startIndex) 
          .filter(c => !deckProg[c.id] && (filters.tags && filters.tags.length > 0 ? filters.tags.includes(c.level) : true)) 
          .slice(0, newCardLimit); 
    }

    let queue = [...scheduledReviews, ...newCards];
    if (queue.length === 0) { showToast("No cards match filters."); return; }

    setSessionQueue(queue);
    setHistory([]); 
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 }); 
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsReverseMode(filters.reverse || false);
    
    const newSession = {
        deckId: activeDeckId,
        queue: queue, 
        currentIndex: 0,
        stats: { again: 0, hard: 0, good: 0, easy: 0 },
        history: [],
        timestamp: Date.now(),
        reverseMode: filters.reverse || false
    };
    setActiveSession(newSession);

    setView('study');
  }, [activeDeck, activeProgress, activeSettings, activeDeckId, setActiveSession]);

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

  const updateUserStats = useCallback(() => {
      const today = new Date().toISOString().slice(0, 10);
      
      setUserStats(prevStats => {
          const lastReview = prevStats.lastReviewDate;
          let newStreak = prevStats.streak;
          let newDaily = prevStats.dailyReviews;

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

          return {
              streak: newStreak,
              lastStudyDate: today, 
              lastReviewDate: today,
              dailyReviews: newDaily
          };
      });
  }, [setUserStats]);

  const handleRate = useCallback((rating) => {
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
    
    let nextIndex = currentIndex + 1;
    let nextQueue = [...sessionQueue];
    
    if (rating === 1) {
        nextQueue.push(currentCard); 
        setSessionQueue(nextQueue);
    }
    
    if (activeSession) {
        const updatedSession = {
            ...activeSession,
            queue: nextQueue,
            currentIndex: nextIndex, 
            stats: newSessionStats,
            history: newHistory,
            reverseMode: isReverseMode
        };
        setActiveSession(updatedSession);
    }
    
    setIsFlipped(false);
    setTimeout(() => {
        if (currentIndex < sessionQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else { 
            setActiveSession(null); 
            setView('summary'); 
        } 
    }, 150);
  }, [sessionQueue, currentIndex, activeDeckId, updateUserStats, activeProgress, sessionStats, history, isReverseMode, activeSession, setProgressMap, setActiveSession]);

  const handleNavigate = useCallback((direction) => {
    if (direction === 'next' && currentIndex < sessionQueue.length - 1) { 
        triggerHaptic(10);
        setIsFlipped(false); 
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        if(activeSession) {
            setActiveSession({...activeSession, currentIndex: nextIdx});
        }
    }
    else if (direction === 'prev' && currentIndex > 0) { 
        triggerHaptic(10);
        setIsFlipped(false); 
        const prevIdx = currentIndex - 1;
        setCurrentIndex(prevIdx); 
        if(activeSession) {
             setActiveSession({...activeSession, currentIndex: prevIdx});
        }
    }
  }, [currentIndex, sessionQueue.length, activeSession, setActiveSession]);

  const handleUndo = useCallback(() => {
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
  }, [history, activeDeckId, sessionQueue, activeSession, setProgressMap, setActiveSession]);

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
        if (currentCard) {
          openExternalUrl(`https://jisho.org/search/${encodeURIComponent(currentCard.kanji || currentCard.kana || '')}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isFlipped, currentIndex, sessionQueue, handleNavigate, handleRate, handleUndo]);
  
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

  const getCardRatingType = (cardId) => {
     const p = activeProgress[cardId];
     if (!p) return 'new';
     if (p.lastRating === 1) return 'again';
     if (p.lastRating === 2) return 'hard';
     if (p.lastRating === 3) return 'good';
     if (p.lastRating === 4) return 'easy';
     return 'new'; 
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

  const deckStats = useMemo(() => {
    if (!activeDeck) return { total: 0, due: 0, new: 0 };
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return {
      total: activeDeck.cards.length,
      due: activeDeck.cards.filter(c => (activeProgress[c.id]?.dueDate || 0) <= now && activeProgress[c.id]).length,
      new: activeDeck.cards.filter(c => !activeProgress[c.id]).length
    };
  }, [activeDeck, activeProgress]);

  return (
    <ErrorBoundary>
      <div className={`h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col border-x border-gray-200 dark:border-gray-800 relative`}>
        
        {view !== 'study' && (
          <Header 
            activeDeck={activeDeck}
            view={view}
            onBack={() => {
              if (view === 'dashboard') goToLibrary();
              else if (view === 'list' || view === 'settings') setView('dashboard');
              else if (view === 'summary') setView('dashboard');
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
          key={`${isAddingCard ? 'add' : 'edit'}-${editingCard?.id || 'new'}-${!!editingCard || isAddingCard}`}
            isOpen={!!editingCard || isAddingCard} 
            card={isAddingCard ? null : editingCard} 
            mode={isAddingCard ? 'add' : 'edit'}
            onSave={isAddingCard ? handleAddCard : saveCardEdit} 
            onCancel={() => { setEditingCard(null); setIsAddingCard(false); }} 
        />
        <EditDeckModal key={`${deckToEdit?.id || 'none'}-${!!deckToEdit}`} isOpen={!!deckToEdit} deck={deckToEdit} onSave={saveDeckEdit} onCancel={() => setDeckToEdit(null)} />
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
              key={activeDeck.id}
              deck={activeDeck} 
              stats={deckStats} 
              activeSettings={activeSettings}
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
            <SettingsView 
                activeSettings={activeSettings}
                updateSettings={updateSettings}
                handleBackup={handleBackup}
                restoreInputRef={restoreInputRef}
                handleRestore={handleRestore}
                resetDeckProgress={resetDeckProgress}
            />
          )}
          
          {view === 'summary' && (
             <SessionSummary 
                stats={sessionStats} 
                onContinue={() => setView('dashboard')} 
                onHome={() => setView('dashboard')}
             />
          )}

          {view === 'list' && activeDeck && (
            <ListView 
                activeDeck={activeDeck}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                listFilter={listFilter}
                setListFilter={setListFilter}
                listCategoryFilter={listCategoryFilter}
                setListCategoryFilter={setListCategoryFilter}
                availableListTags={availableListTags}
                filteredListCards={filteredListCards}
                activeProgress={activeProgress}
                getCardRatingType={getCardRatingType}
                getRatingColor={getRatingColor}
                setEditingCard={setEditingCard}
            />
          )}

          {view === 'study' && activeDeck && (
            <StudyView 
                sessionQueue={sessionQueue}
                currentIndex={currentIndex}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                handleDragProgress={handleDragProgress}
                handleSwipe={(dir) => { 
                    if(dir === 'left' && currentIndex < sessionQueue.length - 1) { 
                      setIsFlipped(false); 
                      const nextIdx = currentIndex + 1;
                      setTimeout(() => {
                          setCurrentIndex(nextIdx);
                          if(activeSession) {
                              const updated = { ...activeSession, currentIndex: nextIdx };
                              setActiveSession(updated);
                          }
                      }, 50); 
                    } 
                    if(dir === 'right' && currentIndex > 0) { 
                      setIsFlipped(false); 
                      const prevIdx = currentIndex - 1;
                      setTimeout(() => {
                          setCurrentIndex(prevIdx);
                          if(activeSession) {
                              const updated = { ...activeSession, currentIndex: prevIdx };
                              setActiveSession(updated);
                          }
                      }, 50); 
                    } 
                  }}
                activeSettings={activeSettings}
                isReverseMode={isReverseMode}
                setShowExitModal={setShowExitModal}
                setShowShortcuts={setShowShortcuts}
                countTextRef={countTextRef}
                percentageTextRef={percentageTextRef}
                progressBarRef={progressBarRef}
                handleUndo={handleUndo}
                history={history}
                handleShuffle={handleShuffle}
                handleNavigate={handleNavigate}
                handleRate={handleRate}
            />
          )}
        </main>
        
        <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileChange} />
      </div>
    </ErrorBoundary>
  );
};

export default App;
