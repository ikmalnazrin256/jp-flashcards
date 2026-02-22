import { MILLISECONDS_IN_DAY, MAX_TEXT_FIELD_LENGTH, MAX_IMPORT_CARDS, DEFAULT_USER_STATS } from '../constants';

export const calculateSRS = (currentStats, rating) => {
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

export const formatTimeInterval = (days) => {
  if (days <= 0) return '<10m';
  if (days < 1) return '1d';
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
};

export const openExternalUrl = (url) => {
  if (typeof window === 'undefined' || !url) return;
  try {
    const targetUrl = new URL(url, window.location.origin);
    if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') return;
    window.open(targetUrl.toString(), '_blank', 'noopener,noreferrer');
  } catch {
    // Ignore malformed URLs.
  }
};

export const triggerHaptic = (pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export const playAudio = (text) => {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP'; 
  utterance.rate = 0.9; 
  const voices = window.speechSynthesis.getVoices();
  const jpVoice = voices.find(v => v.lang.includes('ja') || v.lang.includes('JP'));
  if (jpVoice) utterance.voice = jpVoice;
  window.speechSynthesis.speak(utterance);
};

export const sanitize = (text) => {
  if (typeof text !== 'string') return '';
  const strippedText = Array.from(text).filter((char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code !== 127;
  }).join('');
  return strippedText
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, MAX_TEXT_FIELD_LENGTH);
};

export const safeJsonParse = (input, fallback) => {
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
};

export const safeStorageGetJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return safeJsonParse(raw, fallback);
  } catch {
    return fallback;
  }
};

export const safeStorageSetJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/security errors in private mode or restricted environments.
  }
};

export const safeStorageSetText = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore quota/security errors in private mode or restricted environments.
  }
};

export const createId = (prefix = 'id') => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
};

export const normalizeCard = (card, index = 0) => {
  const safeCard = card && typeof card === 'object' ? card : {};
  return {
    id: typeof safeCard.id === 'string' && safeCard.id ? safeCard.id : createId('card'),
    originalNumber: sanitize(String(safeCard.originalNumber ?? (index + 1))),
    kanji: sanitize(safeCard.kanji || '?'),
    kana: sanitize(safeCard.kana || ''),
    romaji: sanitize(safeCard.romaji || ''),
    english: sanitize(safeCard.english || 'No definition'),
    level: sanitize(safeCard.level || 'Uncategorized'),
  };
};

export const normalizeDecks = (rawDecks) => {
  if (!Array.isArray(rawDecks)) return [];

  return rawDecks
    .slice(0, 200)
    .map((deck, deckIndex) => {
      if (!deck || typeof deck !== 'object') return null;
      const cards = Array.isArray(deck.cards) ? deck.cards.slice(0, MAX_IMPORT_CARDS).map((card, cardIndex) => normalizeCard(card, cardIndex)) : [];
      return {
        id: typeof deck.id === 'string' && deck.id ? deck.id : createId('deck'),
        name: sanitize(deck.name || `Deck ${deckIndex + 1}`),
        cards,
        createdAt: Number.isFinite(deck.createdAt) ? deck.createdAt : Date.now(),
        color: typeof deck.color === 'string' ? deck.color : 'bg-indigo-600'
      };
    })
    .filter(Boolean);
};

export const normalizeProgressMap = (rawProgress) => {
  if (!rawProgress || typeof rawProgress !== 'object') return {};

  return Object.entries(rawProgress).reduce((acc, [deckId, progress]) => {
    if (!progress || typeof progress !== 'object') return acc;
    acc[deckId] = Object.entries(progress).reduce((deckAcc, [cardId, stats]) => {
      if (!stats || typeof stats !== 'object') return deckAcc;
      deckAcc[cardId] = {
        interval: Number.isFinite(stats.interval) ? stats.interval : 0,
        ease: Number.isFinite(stats.ease) ? stats.ease : 2.5,
        status: typeof stats.status === 'string' ? stats.status : 'new',
        dueDate: Number.isFinite(stats.dueDate) ? stats.dueDate : 0,
        lastReviewed: Number.isFinite(stats.lastReviewed) ? stats.lastReviewed : 0,
        lastRating: Number.isFinite(stats.lastRating) ? stats.lastRating : null,
        reviews: Number.isFinite(stats.reviews) ? stats.reviews : 0,
      };
      return deckAcc;
    }, {});
    return acc;
  }, {});
};

export const normalizeDeckSettings = (rawSettings) => {
  if (!rawSettings || typeof rawSettings !== 'object') return {};

  return Object.entries(rawSettings).reduce((acc, [deckId, settings]) => {
    const safeSettings = settings && typeof settings === 'object' ? settings : {};
    acc[deckId] = {
      dailyNew: Number.isFinite(safeSettings.dailyNew) ? Math.max(0, Math.min(100, safeSettings.dailyNew)) : 10,
      hideRomaji: Boolean(safeSettings.hideRomaji),
      autoPlay: Boolean(safeSettings.autoPlay),
    };
    return acc;
  }, {});
};

export const normalizeUserStats = (rawStats) => {
  const stats = rawStats && typeof rawStats === 'object' ? rawStats : DEFAULT_USER_STATS;
  return {
    streak: Number.isFinite(stats.streak) ? Math.max(0, stats.streak) : 0,
    lastStudyDate: typeof stats.lastStudyDate === 'string' || stats.lastStudyDate === null ? stats.lastStudyDate : null,
    dailyReviews: Number.isFinite(stats.dailyReviews) ? Math.max(0, stats.dailyReviews) : 0,
    lastReviewDate: typeof stats.lastReviewDate === 'string' || stats.lastReviewDate === null ? stats.lastReviewDate : null,
  };
};

export const normalizeActiveSession = (rawSession) => {
  if (!rawSession || typeof rawSession !== 'object') return null;
  if (!Array.isArray(rawSession.queue) || typeof rawSession.deckId !== 'string') return null;

  const queue = rawSession.queue.slice(0, MAX_IMPORT_CARDS).map((card, index) => normalizeCard(card, index));
  return {
    deckId: rawSession.deckId,
    queue,
    currentIndex: Number.isFinite(rawSession.currentIndex) ? Math.max(0, Math.min(queue.length - 1, rawSession.currentIndex)) : 0,
    stats: {
      again: Number.isFinite(rawSession.stats?.again) ? rawSession.stats.again : 0,
      hard: Number.isFinite(rawSession.stats?.hard) ? rawSession.stats.hard : 0,
      good: Number.isFinite(rawSession.stats?.good) ? rawSession.stats.good : 0,
      easy: Number.isFinite(rawSession.stats?.easy) ? rawSession.stats.easy : 0,
    },
    history: Array.isArray(rawSession.history) ? rawSession.history.slice(0, MAX_IMPORT_CARDS) : [],
    timestamp: Number.isFinite(rawSession.timestamp) ? rawSession.timestamp : Date.now(),
    reverseMode: Boolean(rawSession.reverseMode),
  };
};

export const isAllowedImportFile = (file) => {
  if (!file) return false;
  const ext = file.name.toLowerCase().split('.').pop();
  return ext === 'csv' || ext === 'json';
};

export const escapeCsvValue = (value) => {
  const text = String(value ?? '').replace(/"/g, '""');
  const trimmed = text.trimStart();
  const firstChar = trimmed.charAt(0);
  const formulaPrefixed = ['=', '+', '-', '@'].includes(firstChar) ? `'${text}` : text;
  return `"${formulaPrefixed}"`;
};

export const parseCSV = (text) => {
  const cleanText = String(text || '').replace(/^\uFEFF/, '');
  const rows = cleanText.split(/\r?\n/).map(row => row.trim()).filter(r => r);
  if (rows.length < 2) return [];

  const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  
  return rows.slice(1, MAX_IMPORT_CARDS + 1).map((row, index) => {
    const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    const card = { id: createId('csv') };
    
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

    return normalizeCard({
      id: card.id,
      originalNumber: card.originalNumber || (index + 1).toString(),
      kanji: card.kanji || '?',
      kana: card.kana || '', 
      romaji: card.romaji || '',
      english: card.english || 'No definition',
      level: card.level || 'Uncategorized'
    }, index);
  });
};

export const exportToCSV = (deck) => {
  if (!deck || !deck.cards) return;
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF#,Kanji,Kana,Romaji,English,Level\n"; 
  deck.cards.forEach(card => {
    const row = [
      escapeCsvValue(card.originalNumber),
      escapeCsvValue(card.kanji),
      escapeCsvValue(card.kana),
      escapeCsvValue(card.romaji),
      escapeCsvValue(card.english),
      escapeCsvValue(card.level)
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
