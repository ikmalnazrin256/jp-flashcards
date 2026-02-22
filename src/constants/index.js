export const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
export const DAILY_GOAL_TARGET = 30; // Cards per day
export const MAX_IMPORT_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_CARDS = 3000;
export const MAX_TEXT_FIELD_LENGTH = 240;

export const STORAGE_KEYS = {
  decks: 'jp_flashcards_decks',
  progress: 'jp_flashcards_progress_global',
  settings: 'jp_flashcards_settings_global',
  activeSession: 'jp_flashcards_active_session',
  darkMode: 'jp_flashcards_darkmode',
  userStats: 'jp_flashcards_user_stats',
};

export const DEFAULT_USER_STATS = {
  streak: 0,
  lastStudyDate: null,
  dailyReviews: 0,
  lastReviewDate: null
};

export const DEFAULT_CARDS = [
  { id: 'def-1', originalNumber: '1', kanji: '私', kana: 'わたし', romaji: 'watashi', english: 'I / Me', level: 'N5' },
  { id: 'def-2', originalNumber: '2', kanji: '猫', kana: 'ねこ', romaji: 'neko', english: 'Cat', level: 'N5' },
  { id: 'def-3', originalNumber: '3', kanji: '犬', kana: 'いぬ', romaji: 'inu', english: 'Dog', level: 'N5' },
  { id: 'def-4', originalNumber: '4', kanji: '食べる', kana: 'たべる', romaji: 'taberu', english: 'To eat', level: 'N5' },
  { id: 'def-5', originalNumber: '5', kanji: '見る', kana: 'みる', romaji: 'miru', english: 'To see / To watch', level: 'N5' },
  { id: 'def-6', originalNumber: '6', kanji: '本', kana: 'ほん', romaji: 'hon', english: 'Book', level: 'N5' },
];

export const DEFAULT_DECK = {
  id: 'default-deck',
  name: 'Starter Deck (N5)',
  cards: DEFAULT_CARDS,
  createdAt: Date.now(),
  color: 'bg-indigo-600'
};

export const COLOR_OPTIONS = [
    { name: 'Indigo', value: 'bg-indigo-600' },
    { name: 'Blue', value: 'bg-blue-600' },
    { name: 'Green', value: 'bg-emerald-600' },
    { name: 'Red', value: 'bg-rose-600' },
    { name: 'Orange', value: 'bg-orange-500' },
    { name: 'Purple', value: 'bg-purple-600' },
    { name: 'Pink', value: 'bg-pink-600' },
    { name: 'Slate', value: 'bg-slate-600' },
];
