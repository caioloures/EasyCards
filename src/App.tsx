import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  RotateCcw, 
  Shuffle, 
  Undo, 
  ChevronRight, 
  ChevronDown,
  ChevronUp, 
  Check, 
  X, 
  LogOut, 
  FolderOpen, 
  BookOpen, 
  Brain, 
  Download, 
  HelpCircle, 
  RefreshCw, 
  Database,
  Award,
  Layers,
  Sparkles,
  Info,
  Home,
  Menu,
  Volume2,
  Loader2,
  Mic,
  Search,
  Upload,
  Cloud
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

import generatedDecks from './flashcards_generated.json';

// ==========================================
// PRESET STATIC COMPATIBLE VOCABULARY FILES 
// ==========================================
interface FlashcardItem {
  portuguese: string;
  english: string;
  portugueseExample?: string;
  englishExample?: string;
  meaning?: string;

  example1?: string;
  example2?: string;
  translationMeaning?: string;
  translationE1?: string;
  translationE2?: string;

  // New fields for quiz logic
  question?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  explanation?: string;
  rule?: string;
}

interface Deck {
  id: string;
  name: string;
  color: string;
  cards: FlashcardItem[];
  isCustom?: boolean;
}

const CONSTANT_PRESET_DECKS: Deck[] = generatedDecks as Deck[];

// Aesthetic Colors requested by the user
const DECK_COLORS = [
  '#D088B5', '#F49939', '#4FBEC9', '#FFCD46', '#5E75AE', '#5E4797', '#F3B8D6', 
  '#FF6569', '#FF5FA9', '#3C59C2', '#039547', '#FFBC5D', '#7389F7', '#1A946F', 
  '#A7DEF7', '#35C4FE', '#46B29D', '#8C3C77', '#EF4770', '#EE964D', '#6692FE', 
  '#625BF8', '#9C89B5', '#454A6F'
];

// ==========================================
// CUSTOM HOOKS FOR POWERFUL RESPONSIBILITY ISOLATION
// ==========================================

function useDeckProgress() {
  const [progressData, setProgressDataState] = useState<{ [deckId: string]: { [cardIndexId: number]: 'learned' | 'review' } }>(() => {
    const saved = localStorage.getItem('easycards_progress_tracker');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return {};
  });

  const [lastUnfinishedFlashcardDeckId, setLastUnfinishedFlashcardDeckIdState] = useState<string | null>(() => {
    return localStorage.getItem('easycards_last_unfinished_flashcard');
  });

  const [lastUnfinishedQuizDeckId, setLastUnfinishedQuizDeckIdState] = useState<string | null>(() => {
    return localStorage.getItem('easycards_last_unfinished_quiz');
  });

  const [lastQuizProgress, setLastQuizProgressState] = useState<{ correct: number, total: number } | null>(() => {
    const saved = localStorage.getItem('easycards_last_quiz_progress');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return null;
  });

  const [lastUnfinishedGuessDeckId, setLastUnfinishedGuessDeckIdState] = useState<string | null>(() => {
    return localStorage.getItem('easycards_last_unfinished_guess');
  });

  const [lastGuessProgress, setLastGuessProgressState] = useState<{ correct: number, total: number } | null>(() => {
    const saved = localStorage.getItem('easycards_last_guess_progress');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return null;
  });

  const setProgressData = (newValue: any) => {
    if (typeof newValue === 'function') {
      setProgressDataState(prev => {
        const resolved = newValue(prev);
        localStorage.setItem('easycards_progress_tracker', JSON.stringify(resolved));
        return resolved;
      });
    } else {
      setProgressDataState(newValue);
      localStorage.setItem('easycards_progress_tracker', JSON.stringify(newValue));
    }
  };

  const setLastUnfinishedFlashcardDeckId = (deckId: string | null) => {
    setLastUnfinishedFlashcardDeckIdState(deckId);
    if (deckId) {
      localStorage.setItem('easycards_last_unfinished_flashcard', deckId);
    } else {
      localStorage.removeItem('easycards_last_unfinished_flashcard');
    }
  };

  const setLastUnfinishedQuizDeckId = (deckId: string | null) => {
    setLastUnfinishedQuizDeckIdState(deckId);
    if (deckId) {
      localStorage.setItem('easycards_last_unfinished_quiz', deckId);
    } else {
      localStorage.removeItem('easycards_last_unfinished_quiz');
    }
  };

  const setLastQuizProgress = (newValue: any) => {
    if (typeof newValue === 'function') {
      setLastQuizProgressState(prev => {
        const resolved = newValue(prev);
        if (resolved) {
          localStorage.setItem('easycards_last_quiz_progress', JSON.stringify(resolved));
        } else {
          localStorage.removeItem('easycards_last_quiz_progress');
        }
        return resolved;
      });
    } else {
      setLastQuizProgressState(newValue);
      if (newValue) {
        localStorage.setItem('easycards_last_quiz_progress', JSON.stringify(newValue));
      } else {
        localStorage.removeItem('easycards_last_quiz_progress');
      }
    }
  };

  const setLastUnfinishedGuessDeckId = (deckId: string | null) => {
    setLastUnfinishedGuessDeckIdState(deckId);
    if (deckId) {
      localStorage.setItem('easycards_last_unfinished_guess', deckId);
    } else {
      localStorage.removeItem('easycards_last_unfinished_guess');
    }
  };

  const setLastGuessProgress = (newValue: any) => {
    if (typeof newValue === 'function') {
      setLastGuessProgressState(prev => {
        const resolved = newValue(prev);
        if (resolved) {
          localStorage.setItem('easycards_last_guess_progress', JSON.stringify(resolved));
        } else {
          localStorage.removeItem('easycards_last_guess_progress');
        }
        return resolved;
      });
    } else {
      setLastGuessProgressState(newValue);
      if (newValue) {
        localStorage.setItem('easycards_last_guess_progress', JSON.stringify(newValue));
      } else {
        localStorage.removeItem('easycards_last_guess_progress');
      }
    }
  };

  return {
    progressData,
    setProgressData,
    lastUnfinishedFlashcardDeckId,
    setLastUnfinishedFlashcardDeckId,
    lastUnfinishedQuizDeckId,
    setLastUnfinishedQuizDeckId,
    lastQuizProgress,
    setLastQuizProgress,
    lastUnfinishedGuessDeckId,
    setLastUnfinishedGuessDeckId,
    lastGuessProgress,
    setLastGuessProgress
  };
}

function useFlashcardEngine() {
  const [cardHistoryStack, setCardHistoryStack] = useState<number[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [invertPTEN, setInvertPTEN] = useState<boolean>(false);
  const [isRandomized, setIsRandomized] = useState<boolean>(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  return {
    cardHistoryStack,
    setCardHistoryStack,
    currentCardIndex,
    setCurrentCardIndex,
    isCardFlipped,
    setIsCardFlipped,
    invertPTEN,
    setInvertPTEN,
    isRandomized,
    setIsRandomized,
    shuffledIndices,
    setShuffledIndices
  };
}

function useQuizEngine() {
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<{
    prompt: string; options: string[]; correctAnswer: string; originalCardIndex: number; explanation?: string;
  }[]>([]);
  const [currentQuizQIndex, setCurrentQuizQIndex] = useState<number>(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  return {
    activeQuizQuestions,
    setActiveQuizQuestions,
    currentQuizQIndex,
    setCurrentQuizQIndex,
    selectedQuizOption,
    setSelectedQuizOption,
    quizScore,
    setQuizScore,
    quizFinished,
    setQuizFinished
  };
}

function useGuessEngine() {
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [guessInput, setGuessInput] = useState('');
  const [guessFeedback, setGuessFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [guessHintsUsedCount, setGuessHintsUsedCount] = useState(0);
  const [guessShowCorrectWord, setGuessShowCorrectWord] = useState(false);
  const [guessScore, setGuessScore] = useState(0);
  const [activeGuessQuestions, setActiveGuessQuestions] = useState<FlashcardItem[]>([]);
  const [guessFinished, setGuessFinished] = useState(false);

  return {
    currentGuessIndex,
    setCurrentGuessIndex,
    guessInput,
    setGuessInput,
    guessFeedback,
    setGuessFeedback,
    guessHintsUsedCount,
    setGuessHintsUsedCount,
    guessShowCorrectWord,
    setGuessShowCorrectWord,
    guessScore,
    setGuessScore,
    activeGuessQuestions,
    setActiveGuessQuestions,
    guessFinished,
    setGuessFinished
  };
}

export default function App() {


  // ==========================================
  // STATE MANAGEMENT USING REFACTORED CUSTOM HOOKS
  // ==========================================

  // Authentication State
  const [sessionUser, setSessionUser] = useState<string | null>(() => {
    return localStorage.getItem('easycards_user_session');
  });
  const [sessionName, setSessionName] = useState<string | null>(() => {
    return localStorage.getItem('easycards_user_name') || localStorage.getItem('easycards_user_session');
  });
  const [avatarSeed, setAvatarSeed] = useState<string>(() => {
    return localStorage.getItem('easycards_user_avatar') || localStorage.getItem('easycards_user_name') || 'Student';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [currentScreen, setCurrentScreen] = useState<string>(() => {
    const hasUser = localStorage.getItem('easycards_user_session');
    return hasUser ? 'home' : 'login';
  });

  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Search filter query for decks
  const [deckSearchQuery, setDeckSearchQuery] = useState('');

  // Google Drive & File Import State
  const [importingError, setImportingError] = useState<string | null>(null);
  const [importingSuccess, setImportingSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // GitHub Sync States
  const [isGithubSyncing, setIsGithubSyncing] = useState<boolean>(false);
  const [isSyncingQuiz, setIsSyncingQuiz] = useState<boolean>(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [githubSyncMessage, setGithubSyncMessage] = useState<string | null>(null);
  const [githubSyncError, setGithubSyncError] = useState<string | null>(null);
  const [quizSyncMessage, setQuizSyncMessage] = useState<string | null>(null);
  const [quizSyncError, setQuizSyncError] = useState<string | null>(null);

  // Reset confirmation balloon state
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const [selectedFlashcardFolder, setSelectedFlashcardFolder] = useState<string | null>(null);
  const [selectedQuizFolder, setSelectedQuizFolder] = useState<string | null>(null);
  const [selectedGuessFolder, setSelectedGuessFolder] = useState<string | null>(null);

  interface SetMapping {
    section: string;
    folder: string;
    fileName: string;
  }

  const FALLBACK_SET_MAPPINGS: SetMapping[] = [
    { section: 'flashcards', folder: 'Oxford Dictionary', fileName: 'Oxford 5000 Words - General.csv' },
    { section: 'quiz', folder: 'Prepositions', fileName: 'Quiz.csv' }
  ];

  const [setMappings, setSetMappings] = useState<SetMapping[]>(FALLBACK_SET_MAPPINGS);

  useEffect(() => {
    setDeckSearchQuery('');
    // Folders are now managed directly by navigation functions — no auto-reset here
  }, [currentScreen]);

  const getDeckFolder = (deck: Deck, section: 'flashcards' | 'quiz'): string => {
    let filename = '';
    if (section === 'flashcards' && deck.id.startsWith('github_fc_')) {
      filename = deck.id.substring('github_fc_'.length);
    } else if (section === 'quiz' && deck.id.startsWith('github_quiz_')) {
      filename = deck.id.substring('github_quiz_'.length);
    }

    if (filename) {
      const match = setMappings.find(m => m.section === section && m.fileName.toLowerCase() === filename.toLowerCase());
      if (match) return match.folder;
      return section === 'flashcards' ? 'Oxford Dictionary' : 'Prepositions';
    }
    
    if (deck.isCustom) return 'Custom Uploads';
    return section === 'flashcards' ? 'Oxford Dictionary' : 'Prepositions';
  };

  // Play pronunciation on flashcard using Merriam Webster
  const [playState, setPlayState] = useState<{ [word: string]: 'idle' | 'loading' | 'playing' | 'error' }>({});

  const playPronunciation = async (rawWord: string, e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    const word = rawWord.trim().replace(/^to\s+/i, '').replace(/[^a-zA-Z\s\-]/g, '').split(',')[0].trim().toLowerCase();
    if (!word) return;
    if (playState[word] === 'loading' || playState[word] === 'playing') return;

    setPlayState(prev => ({ ...prev, [word]: 'loading' }));

    // Safety timeout of 5 seconds
    const safetyTimeout = setTimeout(() => {
      setPlayState(prev => ({ ...prev, [word]: 'idle' }));
    }, 5000);

    const clearSafetyTimeout = () => clearTimeout(safetyTimeout);

    try {
      const audioUrl = `/api/tts?word=${encodeURIComponent(word)}`;
      const audio = new Audio(audioUrl);
      setPlayState(prev => ({ ...prev, [word]: 'playing' }));
      audio.onended = () => {
        clearSafetyTimeout();
        setPlayState(prev => ({ ...prev, [word]: 'idle' }));
      };
      audio.onerror = () => {
        clearSafetyTimeout();
        speakTTSFallback(rawWord, word);
      };
      await audio.play().catch(() => {
        clearSafetyTimeout();
        speakTTSFallback(rawWord, word);
      });
    } catch (err) {
      clearSafetyTimeout();
      speakTTSFallback(rawWord, word);
    }
  };

  const speakTTSFallback = (originalWord: string, cleanedWord: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(originalWord);
        utterance.lang = 'en-US';
        
        // Safety timeout for SpeechSynthesis fallback (sometimes events can fail)
        const ttsTimeout = setTimeout(() => {
          setPlayState(prev => ({ ...prev, [cleanedWord]: 'idle' }));
        }, 5000);

        utterance.onstart = () => {
          setPlayState(prev => ({ ...prev, [cleanedWord]: 'playing' }));
        };
        utterance.onend = () => {
          clearTimeout(ttsTimeout);
          setPlayState(prev => ({ ...prev, [cleanedWord]: 'idle' }));
        };
        utterance.onerror = () => {
          clearTimeout(ttsTimeout);
          setPlayState(prev => ({ ...prev, [cleanedWord]: 'idle' }));
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayState(prev => ({ ...prev, [cleanedWord]: 'error' }));
        setTimeout(() => setPlayState(prev => ({ ...prev, [cleanedWord]: 'idle' })), 1000);
      }
    } catch (err) {
      setPlayState(prev => ({ ...prev, [cleanedWord]: 'error' }));
      setTimeout(() => setPlayState(prev => ({ ...prev, [cleanedWord]: 'idle' })), 1000);
    }
  };

  // Decks state (Presets & Custom)
  const [allDecks, setAllDecks] = useState<Deck[]>(() => {
    const colorsSaved = localStorage.getItem('easycards_deck_colors');
    let colorOverrides: { [deckId: string]: string } = {};
    if (colorsSaved) { try { colorOverrides = JSON.parse(colorsSaved); } catch (e) {} }
    const customSaved = localStorage.getItem('easycards_custom_decks');
    let customDecks: Deck[] = [];
    if (customSaved) { try { customDecks = JSON.parse(customSaved); } catch (e) {} }
    const joinedDecks = [...CONSTANT_PRESET_DECKS, ...customDecks];
    return joinedDecks.map(d => colorOverrides[d.id] ? { ...d, color: colorOverrides[d.id] } : d);
  });

  // Parse and sync set.txt dynamically (Run only once on mount to avoid fetch loops)
  useEffect(() => {
    const fetchSetMappings = async () => {
      try {
        const url = 'https://raw.githubusercontent.com/caioloures/flashcards/main/set.txt';
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          const lines = text.split(/\r?\n/);
          const parsed: SetMapping[] = [];
          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            const parts = cleanLine.split('/');
            if (parts.length >= 3) {
              parsed.push({
                section: parts[0].trim(),
                folder: parts[1].trim(),
                fileName: parts.slice(2).join('/').trim()
              });
            }
          }
          if (parsed.length > 0) {
            setSetMappings(parsed);
          }
        }
      } catch (err) {
        console.warn('Could not load set.txt, using fallbacks.', err);
      }
    };
    fetchSetMappings();
  }, []);

  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  // Initialize modular hooks for robust separation of concerns
  const {
    progressData,
    setProgressData,
    lastUnfinishedFlashcardDeckId,
    setLastUnfinishedFlashcardDeckId,
    lastUnfinishedQuizDeckId,
    setLastUnfinishedQuizDeckId,
    lastQuizProgress,
    setLastQuizProgress,
    lastUnfinishedGuessDeckId,
    setLastUnfinishedGuessDeckId,
    lastGuessProgress,
    setLastGuessProgress
  } = useDeckProgress();

  const {
    cardHistoryStack,
    setCardHistoryStack,
    currentCardIndex,
    setCurrentCardIndex,
    isCardFlipped,
    setIsCardFlipped,
    invertPTEN,
    setInvertPTEN,
    isRandomized,
    setIsRandomized,
    shuffledIndices,
    setShuffledIndices
  } = useFlashcardEngine();

  const {
    activeQuizQuestions,
    setActiveQuizQuestions,
    currentQuizQIndex,
    setCurrentQuizQIndex,
    selectedQuizOption,
    setSelectedQuizOption,
    quizScore,
    setQuizScore,
    quizFinished,
    setQuizFinished
  } = useQuizEngine();

  const {
    currentGuessIndex,
    setCurrentGuessIndex,
    guessInput,
    setGuessInput,
    guessFeedback,
    setGuessFeedback,
    guessHintsUsedCount,
    setGuessHintsUsedCount,
    guessShowCorrectWord,
    setGuessShowCorrectWord,
    guessScore,
    setGuessScore,
    activeGuessQuestions,
    setActiveGuessQuestions,
    guessFinished,
    setGuessFinished
  } = useGuessEngine();

  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartTimestampRef = useRef<number>(0);
  const dragOffsetRef = useRef<number>(0);
  const hasTriggeredSwipeGesture = useRef<boolean>(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);

  const keepFlashcardFolderRef = useRef<string | null>(null); // kept for legacy compatibility
  const [swipeFeedback, setSwipeFeedback] = useState<'none' | 'left' | 'right'>('none');

  const [colorPickerDeckId, setColorPickerDeckId] = useState<string | null>(null);

  // Folder colors states
  const [folderColors, setFolderColors] = useState<{ [folderKey: string]: string }>(() => {
    const saved = localStorage.getItem('easycards_folder_colors');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });
  const [colorPickerFolderKey, setColorPickerFolderKey] = useState<string | null>(null);

  const handleUpdateFolderColor = (folderKey: string, newColor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderColors(prev => {
      const updated = { ...prev, [folderKey]: newColor };
      localStorage.setItem('easycards_folder_colors', JSON.stringify(updated));
      return updated;
    });
    setColorPickerFolderKey(null);
  };

  const [showAvatarPreset, setShowAvatarPreset] = useState(false);

  // Cloud backup and sync states
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('easycards_last_cloud_sync_time');
  });
  const [autoCloudSync, setAutoCloudSync] = useState<boolean>(() => {
    return localStorage.getItem('easycards_auto_cloud_sync') === 'true';
  });

  // ==========================================
  // CENTRALIZED DECK PERSISTENCE CONTROLLERS
  // ==========================================
  const persistDeckState = (deckId: string, state: any) => {
    try {
      const existingStr = localStorage.getItem('easycards_deck_state_' + deckId);
      let existing = {};
      if (existingStr) {
        try { existing = JSON.parse(existingStr); } catch (e) {}
      }
      const updated = { ...existing, ...state };
      localStorage.setItem('easycards_deck_state_' + deckId, JSON.stringify(updated));
    } catch (e) {
      console.error("Error writing to localStorage via persistDeckState", e);
    }
  };

  const restoreDeckState = (deckId: string) => {
    try {
      let state: any = {};
      const savedStr = localStorage.getItem('easycards_deck_state_' + deckId);
      if (savedStr) {
        try {
          state = JSON.parse(savedStr);
        } catch (e) {}
      }
      // Safe fallback/merge: check and merge old or separate individual keys
      const flashSaved = localStorage.getItem('easycards_flash_state_' + deckId);
      if (flashSaved && !state.flashState) {
        try { state.flashState = JSON.parse(flashSaved); } catch (e) {}
      }
      const quizSaved = localStorage.getItem('easycards_quiz_state_' + deckId);
      if (quizSaved && !state.quizState) {
        try { state.quizState = JSON.parse(quizSaved); } catch (e) {}
      }
      const guessSaved = localStorage.getItem('easycards_guess_state_' + deckId);
      if (guessSaved && !state.guessState) {
        try { state.guessState = JSON.parse(guessSaved); } catch (e) {}
      }
      return state;
    } catch (e) {
      console.error("Error restoring deck state", e);
      return null;
    }
  };

  // Explicit progress saving helpers to prevent async state race conditions
  const saveFlashcardProgress = (deckId: string, index: number, indices: number[], historyList: number[]) => {
    const flashState = {
      currentCardIndex: index,
      shuffledIndices: indices,
      history: historyList
    };
    persistDeckState(deckId, { flashState });
    
    // backwards compatibility write
    localStorage.setItem('easycards_flash_state_' + deckId, JSON.stringify(flashState));
    setLastUnfinishedFlashcardDeckId(deckId);
  };

  const saveQuizProgress = (
    deckId: string,
    questions: any[],
    index: number,
    option: string | null,
    score: number,
    finished: boolean
  ) => {
    if (finished) {
      persistDeckState(deckId, { quizState: null });
      localStorage.removeItem('easycards_quiz_state_' + deckId);
      localStorage.removeItem('easycards_quiz_started_' + deckId);
      setLastUnfinishedQuizDeckId(null);
      setLastQuizProgress(null);
      localStorage.setItem('easycards_quiz_completed_' + deckId, 'true');
      localStorage.setItem('easycards_quiz_final_score_' + deckId, String(score));
    } else {
      // Compress questions to save massive amounts of space (only store originalCardIndex and options)
      const compressedQuestions = questions.map((q: any) => {
        if (q.i !== undefined) return q; // already light format
        return {
          i: q.originalCardIndex,
          o: q.options
        };
      });

      const quizState = {
        activeQuizQuestions: compressedQuestions,
        currentQuizQIndex: index,
        selectedQuizOption: option,
        quizScore: score,
        quizFinished: false
      };
      persistDeckState(deckId, { quizState });
      localStorage.setItem('easycards_quiz_state_' + deckId, JSON.stringify(quizState));
      setLastUnfinishedQuizDeckId(deckId);
      setLastQuizProgress({ correct: score, total: questions.length });
    }
  };

  const saveGuessProgress = (
    deckId: string,
    questions: any[],
    index: number,
    input: string,
    feedback: string,
    hintsCount: number,
    showWord: boolean,
    score: number,
    finished: boolean
  ) => {
    if (finished) {
      persistDeckState(deckId, { guessState: null });
      localStorage.removeItem('easycards_guess_state_' + deckId);
      setLastUnfinishedGuessDeckId(null);
      setLastGuessProgress(null);
    } else {
      // Compress questions to only store card indices in the deck
      const currentDeck = allDecks.find(d => d.id === deckId);
      const compressedQuestions = questions.map((card: any) => {
        if (typeof card === 'number') return card;
        if (currentDeck) {
          const idx = currentDeck.cards.findIndex(c => c.portuguese === card.portuguese && c.english === card.english);
          if (idx !== -1) return idx;
        }
        return card;
      });

      const guessState = {
        activeGuessQuestions: compressedQuestions,
        currentGuessIndex: index,
        guessInput: input,
        guessFeedback: feedback,
        guessHintsUsedCount: hintsCount,
        guessShowCorrectWord: showWord,
        guessScore: score,
        guessFinished: false
      };
      persistDeckState(deckId, { guessState });
      localStorage.setItem('easycards_guess_state_' + deckId, JSON.stringify(guessState));
      setLastUnfinishedGuessDeckId(deckId);
      setLastGuessProgress({ correct: score, total: questions.length });
    }
  };

  // Sync autoCloudSync preferences & trigger automatic cloud uploads when progress/colors update
  useEffect(() => {
    localStorage.setItem('easycards_auto_cloud_sync', autoCloudSync ? 'true' : 'false');
  }, [autoCloudSync]);

  useEffect(() => {
    if (autoCloudSync && sessionUser) {
      const delayDebounceFn = setTimeout(() => {
        handleUploadBackupToCloud(true);
      }, 1500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [progressData, folderColors, autoCloudSync, sessionUser]);

  // ==========================================
  // AUTHENTICATION & CLOUD BACKUP LOGIC
  // ==========================================
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getFullBackupPayload = () => {
    const customSaved = localStorage.getItem('easycards_custom_decks');
    let customDecksObj = [];
    if (customSaved) { try { customDecksObj = JSON.parse(customSaved); } catch (e) {} }

    // Optimization: Exclude large GitHub-synced decks from the backup file payload,
    // since they are pulled dynamically from GitHub on startup anyway!
    const filteredCustomDecks = customDecksObj.filter((deck: any) => 
      deck && deck.id && !deck.id.startsWith('github_fc_') && !deck.id.startsWith('github_quiz_')
    );

    const colorsSaved = localStorage.getItem('easycards_deck_colors');
    let deckColorsObj = {};
    if (colorsSaved) { try { deckColorsObj = JSON.parse(colorsSaved); } catch (e) {} }

    return {
      username: sessionUser,
      name: sessionName,
      avatarSeed: avatarSeed,
      progressData: progressData,
      customDecks: filteredCustomDecks,
      deckColors: deckColorsObj,
      folderColors: folderColors,
      lastFlashcardDeckId: lastUnfinishedFlashcardDeckId,
      lastQuizDeckId: lastUnfinishedQuizDeckId,
      lastQuizProgress,
      lastGuessDeckId: lastUnfinishedGuessDeckId,
      lastGuessProgress,
      device: navigator.userAgent
    };
  };

  const handleUploadBackupToCloud = async (silent = false) => {
    if (!sessionUser) return;
    if (!silent) {
      setIsCloudSyncing(true);
      setCloudSyncMessage('Saving your progress to the cloud...');
      setCloudSyncError(null);
    }
    try {
      const currentUser = auth.currentUser;
      let idToken = "";
      if (currentUser) {
        idToken = await currentUser.getIdToken();
      }

      const payload = getFullBackupPayload();
      const res = await fetch(`/api/backup/${encodeURIComponent(sessionUser)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        const saveTime = new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
        setLastCloudSyncTime(saveTime);
        localStorage.setItem('easycards_last_cloud_sync_time', saveTime);
        if (!silent) {
          setCloudSyncMessage(`Success! Saved to backups/${sessionUser}.json at ${saveTime}`);
          setTimeout(() => setCloudSyncMessage(null), 4500);
        }
      } else {
        const errData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        if (!silent) {
          setCloudSyncError(errData.error || 'Failed to save progress on the cloud.');
        }
      }
    } catch (err) {
      console.error('Cloud backup error:', err);
      if (!silent) {
        setCloudSyncError('Could not reach backup server.');
      }
    } finally {
      if (!silent) {
        setIsCloudSyncing(false);
      }
    }
  };

  const handleLoadBackupFromCloud = async (targetUser = sessionUser, silent = false) => {
    const userToFetch = targetUser;
    if (!userToFetch) return false;
    
    if (!silent) {
      setIsCloudSyncing(true);
      setCloudSyncMessage('Loading backup from the cloud...');
      setCloudSyncError(null);
    }
    
    try {
      const currentUser = auth.currentUser;
      let idToken = "";
      if (currentUser) {
        idToken = await currentUser.getIdToken();
      }

      const res = await fetch(`/api/backup/${encodeURIComponent(userToFetch)}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const backup = await res.json();
        
        // Restore all data in localStorage & React states
        if (backup.username) {
          localStorage.setItem('easycards_user_session', backup.username);
          setSessionUser(backup.username);
        }
        if (backup.name) {
          localStorage.setItem('easycards_user_name', backup.name);
          setSessionName(backup.name);
        }
        if (backup.avatarSeed) {
          localStorage.setItem('easycards_user_avatar', backup.avatarSeed);
          setAvatarSeed(backup.avatarSeed);
        }
        if (backup.progressData) {
          localStorage.setItem('easycards_progress_tracker', JSON.stringify(backup.progressData));
          setProgressData(backup.progressData);
        } else {
          localStorage.setItem('easycards_progress_tracker', '{}');
          setProgressData({});
        }
        if (backup.folderColors) {
          localStorage.setItem('easycards_folder_colors', JSON.stringify(backup.folderColors));
          setFolderColors(backup.folderColors);
        } else {
          localStorage.setItem('easycards_folder_colors', '{}');
          setFolderColors({});
        }
        if (backup.deckColors) {
          localStorage.setItem('easycards_deck_colors', JSON.stringify(backup.deckColors));
        } else {
          localStorage.removeItem('easycards_deck_colors');
        }
        if (backup.customDecks) {
          localStorage.setItem('easycards_custom_decks', JSON.stringify(backup.customDecks));
        } else {
          localStorage.removeItem('easycards_custom_decks');
        }
        
        if (backup.lastFlashcardDeckId) {
          localStorage.setItem('easycards_last_unfinished_flashcard', backup.lastFlashcardDeckId);
          setLastUnfinishedFlashcardDeckId(backup.lastFlashcardDeckId);
        } else {
          localStorage.removeItem('easycards_last_unfinished_flashcard');
          setLastUnfinishedFlashcardDeckId(null);
        }
        if (backup.lastQuizDeckId) {
          localStorage.setItem('easycards_last_unfinished_quiz', backup.lastQuizDeckId);
          setLastUnfinishedQuizDeckId(backup.lastQuizDeckId);
        } else {
          localStorage.removeItem('easycards_last_unfinished_quiz');
          setLastUnfinishedQuizDeckId(null);
        }
        if (backup.lastQuizProgress) {
          localStorage.setItem('easycards_last_quiz_progress', JSON.stringify(backup.lastQuizProgress));
          setLastQuizProgress(backup.lastQuizProgress);
        } else {
          localStorage.removeItem('easycards_last_quiz_progress');
          setLastQuizProgress(null);
        }
        if (backup.lastGuessDeckId) {
          localStorage.setItem('easycards_last_unfinished_guess', backup.lastGuessDeckId);
          setLastUnfinishedGuessDeckId(backup.lastGuessDeckId);
        } else {
          localStorage.removeItem('easycards_last_unfinished_guess');
          setLastUnfinishedGuessDeckId(null);
        }
        if (backup.lastGuessProgress) {
          localStorage.setItem('easycards_last_guess_progress', JSON.stringify(backup.lastGuessProgress));
          setLastGuessProgress(backup.lastGuessProgress);
        } else {
          localStorage.removeItem('easycards_last_guess_progress');
          setLastGuessProgress(null);
        }

        // Re-calculate allDecks
        const colorOverrides = backup.deckColors || {};
        const customDecks = backup.customDecks || [];
        const joinedDecks = [...CONSTANT_PRESET_DECKS, ...customDecks];
        setAllDecks(joinedDecks.map(d => colorOverrides[d.id] ? { ...d, color: colorOverrides[d.id] } : d));

        const saveTime = new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
        setLastCloudSyncTime(saveTime);
        localStorage.setItem('easycards_last_cloud_sync_time', saveTime);
        
        if (!silent) {
          setCloudSyncMessage('Done! Your profile and progress have been restored successfully.');
          setTimeout(() => setCloudSyncMessage(null), 4500);
        }
        return true;
      } else {
        if (!silent) {
          setCloudSyncError('Could not find cloud backup for this username.');
        }
        return false;
      }
    } catch (err) {
      console.error('Error fetching cloud backup:', err);
      if (!silent) {
        setCloudSyncError('Failed to load backup.');
      }
      return false;
    } finally {
      if (!silent) {
        setIsCloudSyncing(false);
      }
    }
  };

  const handleDownloadFullBackup = () => {
    const payload = getFullBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `easycards-backup-${sessionUser || 'user'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFullBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (!backup || (!backup.progressData && !backup.username)) {
          alert('Format of backup file is invalid.');
          return;
        }
        
        if (window.confirm('Are you sure you want to restore this local JSON backup file? It will replace all currently saved sessions, progress, custom colors, and decks.')) {
          if (backup.username) {
            localStorage.setItem('easycards_user_session', backup.username);
            setSessionUser(backup.username);
          }
          if (backup.name) {
            localStorage.setItem('easycards_user_name', backup.name);
            setSessionName(backup.name);
          }
          if (backup.avatarSeed) {
            localStorage.setItem('easycards_user_avatar', backup.avatarSeed);
            setAvatarSeed(backup.avatarSeed);
          }
          if (backup.progressData) {
            localStorage.setItem('easycards_progress_tracker', JSON.stringify(backup.progressData));
            setProgressData(backup.progressData);
          } else {
            localStorage.setItem('easycards_progress_tracker', '{}');
            setProgressData({});
          }
          if (backup.folderColors) {
            localStorage.setItem('easycards_folder_colors', JSON.stringify(backup.folderColors));
            setFolderColors(backup.folderColors);
          } else {
            localStorage.setItem('easycards_folder_colors', '{}');
            setFolderColors({});
          }
          if (backup.deckColors) {
            localStorage.setItem('easycards_deck_colors', JSON.stringify(backup.deckColors));
          } else {
            localStorage.removeItem('easycards_deck_colors');
          }
          if (backup.customDecks) {
            localStorage.setItem('easycards_custom_decks', JSON.stringify(backup.customDecks));
          } else {
            localStorage.removeItem('easycards_custom_decks');
          }
          
          if (backup.lastFlashcardDeckId) {
            localStorage.setItem('easycards_last_unfinished_flashcard', backup.lastFlashcardDeckId);
            setLastUnfinishedFlashcardDeckId(backup.lastFlashcardDeckId);
          } else {
            localStorage.removeItem('easycards_last_unfinished_flashcard');
            setLastUnfinishedFlashcardDeckId(null);
          }
          if (backup.lastQuizDeckId) {
            localStorage.setItem('easycards_last_unfinished_quiz', backup.lastQuizDeckId);
            setLastUnfinishedQuizDeckId(backup.lastQuizDeckId);
          } else {
            localStorage.removeItem('easycards_last_unfinished_quiz');
            setLastUnfinishedQuizDeckId(null);
          }
          if (backup.lastQuizProgress) {
            localStorage.setItem('easycards_last_quiz_progress', JSON.stringify(backup.lastQuizProgress));
            setLastQuizProgress(backup.lastQuizProgress);
          } else {
            localStorage.removeItem('easycards_last_quiz_progress');
            setLastQuizProgress(null);
          }
          if (backup.lastGuessDeckId) {
            localStorage.setItem('easycards_last_unfinished_guess', backup.lastGuessDeckId);
            setLastUnfinishedGuessDeckId(backup.lastGuessDeckId);
          } else {
            localStorage.removeItem('easycards_last_unfinished_guess');
            setLastUnfinishedGuessDeckId(null);
          }
          if (backup.lastGuessProgress) {
            localStorage.setItem('easycards_last_guess_progress', JSON.stringify(backup.lastGuessProgress));
            setLastGuessProgress(backup.lastGuessProgress);
          } else {
            localStorage.removeItem('easycards_last_guess_progress');
            setLastGuessProgress(null);
          }

          const colorOverrides = backup.deckColors || {};
          const customDecks = backup.customDecks || [];
          const joinedDecks = [...CONSTANT_PRESET_DECKS, ...customDecks];
          setAllDecks(joinedDecks.map(d => colorOverrides[d.id] ? { ...d, color: colorOverrides[d.id] } : d));

          alert('Success! Restored all settings and progress successfully.');
          navigateTo('home');
        }
      } catch (err) {
        alert('Could not parse the backup file. Please ensure it is a valid backup JSON.');
      }
    };
    reader.readAsText(file);
    // Clear value to allow re-upload
    e.target.value = '';
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      setLoginError('Could not initialize login provider. Please check configuration.');
      return;
    }
    setLoginError('Opening Google login secure prompt...');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!user) {
        setLoginError('Login process failed. No user profile returned.');
        return;
      }
      
      // Get first name from display name
      const cleanName = user.displayName ? user.displayName.trim() : (user.email ? user.email.split('@')[0] : 'Student');
      const firstName = cleanName.split(/\s+/)[0];
      
      // Clean, filesystem-safe identifier based on Google email or ID
      const cleanUser = user.email ? user.email.toLowerCase().replace(/[^a-z0-9_-]/g, "_") : `user_${user.uid.slice(0, 12)}`;
      
      const avatarPhoto = user.photoURL || firstName;
      
      setLoginError('Verifying backup progress in the cloud...');
      
      // Check if there is an existing backup on the server
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/backup/${encodeURIComponent(cleanUser)}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        if (res.ok) {
          const backup = await res.json();
          const autoRestore = window.confirm(
            `Found a cloud backup for ${user.email} saved at ${backup.lastSavedAt ? new Date(backup.lastSavedAt).toLocaleString() : 'unknown date'}.\n\nDo you want to RESTORE all your progress and settings?`
          );
          if (autoRestore) {
            // Restore credentials and data
            setSessionUser(cleanUser);
            setSessionName(backup.name || firstName);
            setAvatarSeed(backup.avatarSeed || avatarPhoto);
            
            localStorage.setItem('easycards_user_session', cleanUser);
            localStorage.setItem('easycards_user_name', backup.name || firstName);
            localStorage.setItem('easycards_user_avatar', backup.avatarSeed || avatarPhoto);
            
            if (backup.progressData) {
              localStorage.setItem('easycards_progress_tracker', JSON.stringify(backup.progressData));
              setProgressData(backup.progressData);
            } else {
              localStorage.setItem('easycards_progress_tracker', '{}');
              setProgressData({});
            }
            if (backup.folderColors) {
              localStorage.setItem('easycards_folder_colors', JSON.stringify(backup.folderColors));
              setFolderColors(backup.folderColors);
            } else {
              localStorage.setItem('easycards_folder_colors', '{}');
              setFolderColors({});
            }
            if (backup.deckColors) {
              localStorage.setItem('easycards_deck_colors', JSON.stringify(backup.deckColors));
            } else {
              localStorage.removeItem('easycards_deck_colors');
            }
            if (backup.customDecks) {
              localStorage.setItem('easycards_custom_decks', JSON.stringify(backup.customDecks));
            } else {
              localStorage.removeItem('easycards_custom_decks');
            }
            
            if (backup.lastFlashcardDeckId) {
              localStorage.setItem('easycards_last_unfinished_flashcard', backup.lastFlashcardDeckId);
              setLastUnfinishedFlashcardDeckId(backup.lastFlashcardDeckId);
            } else {
              localStorage.removeItem('easycards_last_unfinished_flashcard');
              setLastUnfinishedFlashcardDeckId(null);
            }
            if (backup.lastQuizDeckId) {
              localStorage.setItem('easycards_last_unfinished_quiz', backup.lastQuizDeckId);
              setLastUnfinishedQuizDeckId(backup.lastQuizDeckId);
            } else {
              localStorage.removeItem('easycards_last_unfinished_quiz');
              setLastUnfinishedQuizDeckId(null);
            }
            if (backup.lastQuizProgress) {
              localStorage.setItem('easycards_last_quiz_progress', JSON.stringify(backup.lastQuizProgress));
              setLastQuizProgress(backup.lastQuizProgress);
            } else {
              localStorage.removeItem('easycards_last_quiz_progress');
              setLastQuizProgress(null);
            }
            if (backup.lastGuessDeckId) {
              localStorage.setItem('easycards_last_unfinished_guess', backup.lastGuessDeckId);
              setLastUnfinishedGuessDeckId(backup.lastGuessDeckId);
            } else {
              localStorage.removeItem('easycards_last_unfinished_guess');
              setLastUnfinishedGuessDeckId(null);
            }
            if (backup.lastGuessProgress) {
              localStorage.setItem('easycards_last_guess_progress', JSON.stringify(backup.lastGuessProgress));
              setLastGuessProgress(backup.lastGuessProgress);
            } else {
              localStorage.removeItem('easycards_last_guess_progress');
              setLastGuessProgress(null);
            }

            const colorOverrides = backup.deckColors || {};
            const customDecks = backup.customDecks || [];
            const joinedDecks = [...CONSTANT_PRESET_DECKS, ...customDecks];
            setAllDecks(joinedDecks.map(d => colorOverrides[d.id] ? { ...d, color: colorOverrides[d.id] } : d));
            
            setLoginError(null);
            navigateTo('home');
            return;
          }
        }
      } catch (err) {
        console.warn("Connection or lookup issue during login, running locally", err);
      }

      // If no restore or rejected, register as a new session
      setSessionUser(cleanUser);
      setSessionName(firstName);
      setAvatarSeed(avatarPhoto);
      
      localStorage.setItem('easycards_user_session', cleanUser);
      localStorage.setItem('easycards_user_name', firstName);
      localStorage.setItem('easycards_user_avatar', avatarPhoto);
      setLoginError(null);
      navigateTo('home');
    } catch (err: any) {
      console.error("Login popup error:", err);
      setLoginError(err.message || 'Google Sign-In failed or was cancelled.');
    }
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (e) {
      console.error("Firebase sign out error:", e);
    }
    localStorage.removeItem('easycards_user_session');
    localStorage.removeItem('easycards_user_name');
    localStorage.removeItem('easycards_user_avatar');
    setSessionUser(null);
    setSessionName(null);
    setAvatarSeed('Student');
    setCurrentScreen('login');
  };

  // ==========================================
  // CENTRALIZED NAVIGATION — garante reset correto de folders
  // ==========================================
  const navigateTo = (screen: string) => {
    // Reseta folders ao sair das seções correspondentes
    if (screen !== 'flashcard_list' && screen !== 'flashcard_game') {
      setSelectedFlashcardFolder(null);
    }
    if (screen !== 'quiz_list' && screen !== 'quiz_game') {
      setSelectedQuizFolder(null);
    }
    if (screen !== 'guess_list' && screen !== 'guess_game') {
      setSelectedGuessFolder(null);
    }
    setCurrentScreen(screen);
  };

  const resetGameState = () => {
    setIsCardFlipped(false);
    setCardHistoryStack([]);
    
    // Quiz resets
    setActiveQuizQuestions([]);
    setCurrentQuizQIndex(0);
    setSelectedQuizOption(null);
    setQuizScore(0);
    setQuizFinished(false);

    // Guess resets
    setCurrentGuessIndex(0);
    setGuessInput('');
    setGuessFeedback('idle');
    setGuessHintsUsedCount(0);
    setGuessShowCorrectWord(false);
    setGuessScore(0);
    setActiveGuessQuestions([]);
    setGuessFinished(false);
  };

  // ==========================================
  // FLASHCARD SHUFFLERS & RE-ROUTING HELPERS
  // ==========================================
  const startFlashcardGame = (deck: Deck, forceRestart = false) => {
    resetGameState();
    setSelectedDeck(deck);
    setSelectedFlashcardFolder(getDeckFolder(deck, 'flashcards'));

    let finalIndices: number[] = [];
    let finalIndex = 0;
    let loadedHistory: number[] = [];

    const deckState = restoreDeckState(deck.id);
    const savedFlash = deckState?.flashState;
    const progressList = progressData[deck.id] || {};

    if (savedFlash && !forceRestart) {
      if (Array.isArray(savedFlash.shuffledIndices) && savedFlash.shuffledIndices.length === deck.cards.length) {
        finalIndices = savedFlash.shuffledIndices;
        finalIndex = typeof savedFlash.currentCardIndex === 'number' ? savedFlash.currentCardIndex : 0;
        if (finalIndex >= deck.cards.length || finalIndex < 0) finalIndex = 0;
        if (Array.isArray(savedFlash.history)) {
          loadedHistory = savedFlash.history;
        }
      }
    }

    if (finalIndices.length === 0) {
      const indices = Array.from({ length: deck.cards.length }).map((_, i) => i);
      finalIndices = isRandomized ? indices.sort(() => Math.random() - 0.5) : indices;
      
      // Find the first unanswered index
      let idx = 0;
      for (let i = 0; i < finalIndices.length; i++) {
        if (!progressList[finalIndices[i]]) {
          idx = i;
          break;
        }
      }
      finalIndex = idx;
    }

    // Safety Constraint
    finalIndex = Math.max(0, Math.min(finalIndex, deck.cards.length - 1));

    setShuffledIndices(finalIndices);
    setCurrentCardIndex(finalIndex);
    setCardHistoryStack(loadedHistory);
    saveFlashcardProgress(deck.id, finalIndex, finalIndices, loadedHistory);
    setLastUnfinishedFlashcardDeckId(deck.id);
    setCurrentScreen('flashcard_game');
  };

  const getActiveCardRealIndex = (): number => {
    if (shuffledIndices.length === 0 || currentCardIndex >= shuffledIndices.length) return 0;
    return shuffledIndices[currentCardIndex];
  };

  const getActiveCard = (): FlashcardItem | null => {
    if (!selectedDeck) return null;
    const idx = getActiveCardRealIndex();
    return selectedDeck.cards[idx] || null;
  };

  // ==========================================
  // CARD SWIPING & DRAGGING LOGIC
  // ==========================================
  const [isDraggingCard, setIsDraggingCard] = useState(false);
 
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartTimestampRef.current = Date.now();
    dragOffsetRef.current = 0;
    hasTriggeredSwipeGesture.current = false;
    setSwipeFeedback('none');
    setIsDraggingCard(false);
  };
 
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null || dragStartYRef.current === null || hasTriggeredSwipeGesture.current) return;
    const diffX = e.clientX - dragStartXRef.current;
    const diffY = e.clientY - dragStartYRef.current;
    
    // Check if user is scrolling vertically
    // If vertical movement is much larger than horizontal, cancel horizontal drag immediately
    if (!isDraggingCard && Math.abs(diffY) > 15 && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
      dragStartXRef.current = null;
      dragStartYRef.current = null;
      if (cardRef.current) {
        cardRef.current.style.transform = '';
        cardRef.current.style.borderColor = '';
      }
      return;
    }
    
    // Only establish dragging state once horizontal displacement is noticeable (e.g., > 8px)
    if (!isDraggingCard && Math.abs(diffX) > 8 && Math.abs(diffX) > Math.abs(diffY)) {
      setIsDraggingCard(true);
    }
    
    if (isDraggingCard) {
      dragOffsetRef.current = diffX;
      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.04}deg)`;
        
        // Dynamic border color depending on drag direction
        if (diffX > 25) {
          cardRef.current.style.borderColor = '#10B981'; // emerald green
        } else if (diffX < -25) {
          cardRef.current.style.borderColor = '#FF7A00'; // orange
        } else {
          cardRef.current.style.borderColor = '#E5E7EB';
        }
      }
      
      if (diffX > 25) {
        setSwipeFeedback('right');
      } else if (diffX < -25) {
        setSwipeFeedback('left');
      } else {
        setSwipeFeedback('none');
      }
      
      // If user drags extremely far, trigger early
      if (diffX > 160) {
        hasTriggeredSwipeGesture.current = true;
        dragStartXRef.current = null;
        dragStartYRef.current = null;
        setIsDraggingCard(false);
        triggerSwipeAction('know');
      } else if (diffX < -160) {
        hasTriggeredSwipeGesture.current = true;
        dragStartXRef.current = null;
        dragStartYRef.current = null;
        setIsDraggingCard(false);
        triggerSwipeAction('review');
      }
    }
  };
 
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null || dragStartYRef.current === null) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    
    const diffX = e.clientX - dragStartXRef.current;
    const diffY = e.clientY - dragStartYRef.current;
    const elapsed = Date.now() - dragStartTimestampRef.current;
    
    const wasTriggered = hasTriggeredSwipeGesture.current;
    dragStartXRef.current = null;
    dragStartYRef.current = null;
    setIsDraggingCard(false);
    
    if (!wasTriggered) {
      if (cardRef.current) {
        cardRef.current.style.transform = '';
        cardRef.current.style.borderColor = '';
      }
      setSwipeFeedback('none');
      
      // Real swipe threshold to trigger swipe and card removal
      const SWIPE_THRESHOLD_X = 80;
      
      if (diffX >= SWIPE_THRESHOLD_X) {
        hasTriggeredSwipeGesture.current = true;
        triggerSwipeAction('know');
      } else if (diffX <= -SWIPE_THRESHOLD_X) {
        hasTriggeredSwipeGesture.current = true;
        triggerSwipeAction('review');
      } else {
        // Did the user tap?
        // Tap is defined as negligible movement (e.g. within 10px) and fast release (e.g., < 350ms)
        if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && elapsed < 350) {
          setIsCardFlipped(prev => !prev);
        }
      }
    } else {
      setSwipeFeedback('none');
    }
  };

  const triggerSwipeAction = (decision: 'know' | 'review') => {
    if (!selectedDeck) return;
    const realIdx = getActiveCardRealIndex();
    setProgressData(prev => ({
      ...prev,
      [selectedDeck.id]: { ...(prev[selectedDeck.id] || {}), [realIdx]: decision === 'know' ? 'learned' : 'review' }
    }));
    const nextHistory = [...cardHistoryStack, currentCardIndex];
    setCardHistoryStack(nextHistory);
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.18s ease-in-out';
      cardRef.current.style.transform = `translateX(${decision === 'know' ? 400 : -400}px) rotate(${decision === 'know' ? 12 : -12}deg)`;
    }
    setSwipeFeedback(decision === 'know' ? 'right' : 'left');
    setTimeout(() => {
      if (currentCardIndex + 1 < selectedDeck.cards.length) {
        const nextIdx = currentCardIndex + 1;
        setCurrentCardIndex(nextIdx);
        setIsCardFlipped(false);
        saveFlashcardProgress(selectedDeck.id, nextIdx, shuffledIndices, nextHistory);
      } else {
        localStorage.removeItem('easycards_flash_state_' + selectedDeck.id);
        if (lastUnfinishedFlashcardDeckId === selectedDeck.id) setLastUnfinishedFlashcardDeckId(null);
        alert('Well done! You have reviewed all the cards in this deck. Try a quiz now to evaluate your learning!');
        navigateTo('home');
      }
      if (cardRef.current) { cardRef.current.style.transition = ''; cardRef.current.style.transform = ''; }
      setSwipeFeedback('none');
    }, 180);
  };

  const handleUndoLastAction = () => {
    if (cardHistoryStack.length === 0 || !selectedDeck) return;
    const lastIndex = cardHistoryStack[cardHistoryStack.length - 1];
    const nextHistory = cardHistoryStack.slice(0, -1);
    setCardHistoryStack(nextHistory);
    setCurrentCardIndex(lastIndex);
    setIsCardFlipped(false);
    saveFlashcardProgress(selectedDeck.id, lastIndex, shuffledIndices, nextHistory);
    const targetRealIdx = shuffledIndices[lastIndex];
    setProgressData(prev => {
      const copy = { ...prev };
      if (copy[selectedDeck.id]) {
        const deckCopy = { ...copy[selectedDeck.id] };
        delete deckCopy[targetRealIdx];
        copy[selectedDeck.id] = deckCopy;
      }
      return copy;
    });
  };

  const getDeckStats = (deck: Deck) => {
    const totalWords = deck.cards.length;
    const progressObj = progressData[deck.id] || {};
    let learnedCount = 0;
    let reviewCount = 0;
    for (let i = 0; i < totalWords; i++) {
      const status = progressObj[i];
      if (status === 'learned') {
        learnedCount++;
      } else if (status === 'review') {
        reviewCount++;
      }
    }
    const notStartedCount = totalWords - learnedCount - reviewCount;
    return { 
      total: totalWords, 
      notStarted: notStartedCount,
      inProgress: reviewCount,
      completed: learnedCount,
      stillLearning: totalWords - learnedCount, 
      learned: learnedCount 
    };
  };

  const clearAllAppProgress = () => {
    localStorage.removeItem('easycards_custom_decks');
    localStorage.removeItem('easycards_deck_colors');
    setAllDecks(CONSTANT_PRESET_DECKS);
    setProgressData({});
    setLastUnfinishedFlashcardDeckId(null);
    setLastUnfinishedQuizDeckId(null);
    setLastQuizProgress(null);
    setLastUnfinishedGuessDeckId(null);
    setLastGuessProgress(null);
    localStorage.removeItem('easycards_last_unfinished_flashcard');
    localStorage.removeItem('easycards_last_unfinished_quiz');
    localStorage.removeItem('easycards_last_quiz_progress');
    localStorage.removeItem('easycards_last_unfinished_guess');
    localStorage.removeItem('easycards_last_guess_progress');

    // Clear all dynamic session progress keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('easycards_quiz_') || key.startsWith('easycards_guess_') || key.startsWith('easycards_flash_') || key.startsWith('easycards_learn_'))) {
        localStorage.removeItem(key);
      }
    }

    setShowResetConfirm(false);
    setResetFeedback('Progress, games in-progress, and decks have been reset! Re-sync from GitHub to reload your sets.');
    setTimeout(() => setResetFeedback(null), 4500);
  };

  const handleToggleColorPicker = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setColorPickerDeckId(prev => prev === deckId ? null : deckId);
  };

  const handleUpdateDeckColor = (deckId: string, newColor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAllDecks(prev => {
      const updated = prev.map(d => d.id === deckId ? { ...d, color: newColor } : d);
      localStorage.setItem('easycards_custom_decks', JSON.stringify(updated.filter(d => d.isCustom)));
      localStorage.setItem('easycards_deck_colors', JSON.stringify(updated.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.color }), {})));
      return updated;
    });
    setColorPickerDeckId(null);
  };

  const handleDownloadLearnedWords = () => {
    const list: any[] = [];
    allDecks.forEach(deck => {
      const deckProgress = progressData[deck.id];
      if (deckProgress) {
        Object.entries(deckProgress).forEach(([cardIndex, state]) => {
          if (state === 'learned') {
            const card = deck.cards[Number(cardIndex)];
            if (card) list.push({ deck: deck.name, portuguese: card.portuguese, english: card.english, portugueseExample: card.portugueseExample || '', englishExample: card.englishExample || '' });
          }
        });
      }
    });
    if (list.length === 0) { alert('You have not marked any words as learned yet.'); return; }
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `easycards-learned-words-${sessionUser || 'user'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // VOCABULARY FILE IMPORTERS & PARSERS
  // ==========================================
  const parseCSV = (text: string): FlashcardItem[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Detect header row or use default indices
    const headerLine = lines[0].toLowerCase();
    // Split by comma or semicolon
    let delimiter = ',';
    if (headerLine.includes(';')) delimiter = ';';
    
    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ""));
    
    const findIdx = (queries: string[]) => {
      // 1. Try exact matches first
      const exactIndex = headers.findIndex(cell => {
        const val = cell.toLowerCase().trim();
        return queries.some(q => val === q.toLowerCase().trim());
      });
      if (exactIndex !== -1) return exactIndex;

      // 2. Fallback to includes
      return headers.findIndex(cell => {
        const val = cell.toLowerCase().trim();
        return queries.some(q => val.includes(q.toLowerCase().trim()));
      });
    };

    // Map columns
    let ptIndex = findIdx(['translation', 'portugues', 'português', 'pt']);
    let enIndex = findIdx(['word', 'english', 'ingles', 'inglês', 'en', 'vocab', 'term']);
    let meaningIndex = findIdx(['meaning', 'significado', 'definition', 'definicao', 'explicação']);
    let translationMeaningIdx = findIdx(['translation meaning', 'translation_meaning', 'translationmeaning', 'significado_pt', 'definicao_pt', 'definição_pt']);
    let example1Idx = findIdx(['example 1', 'example1', 'english example', 'exemplo_en']);
    let example2Idx = findIdx(['example 2', 'example2']);
    let translationE1Idx = findIdx(['translation e1', 'translatione1', 'portuguese example', 'exemplo_pt']);
    let translationE2Idx = findIdx(['translation e2', 'translatione2']);

    // New specific Quiz columns mapping
    let questionIdx = findIdx(['question', 'pergunta']);
    let option1Idx = findIdx(['option 1', 'option1', 'resposta certa', 'resposta_certa']);
    let option2Idx = findIdx(['option 2', 'option2']);
    let option3Idx = findIdx(['option 3', 'option3']);
    let option4Idx = findIdx(['option 4', 'option4']);
    let explanationIdx = findIdx(['explanation', 'rule', 'explanation/rule', 'explicação', 'regra']);

    // Fallbacks for compatibility
    let ptExIndex = findIdx(['portuguese example', 'exemplo_pt', 'example_pt', 'exemplo']);
    let enExIndex = findIdx(['english example', 'exemplo_en', 'example_en', 'example']);

    if (ptIndex === -1 && questionIdx !== -1) ptIndex = questionIdx;
    if (enIndex === -1 && option1Idx !== -1) enIndex = option1Idx;

    if (ptIndex === -1) ptIndex = 0;
    if (enIndex === -1) enIndex = 1;

    const items: FlashcardItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let parts: string[] = [];
      let currentPart = '';
      let insideQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          insideQuotes = !insideQuotes;
        } else if (char === delimiter && !insideQuotes) {
          parts.push(currentPart.trim().replace(/^["']|["']$/g, ""));
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      parts.push(currentPart.trim().replace(/^["']|["']$/g, ""));

      if (parts.length > Math.max(ptIndex, enIndex)) {
        const ptWord = parts[ptIndex]?.trim() || "";
        const enWord = parts[enIndex]?.trim() || "";
        if (ptWord || enWord) {
          const ex1Val = example1Idx !== -1 ? parts[example1Idx]?.trim() : undefined;
          const ex2Val = example2Idx !== -1 ? parts[example2Idx]?.trim() : undefined;
          const transE1Val = translationE1Idx !== -1 ? parts[translationE1Idx]?.trim() : undefined;
          const transE2Val = translationE2Idx !== -1 ? parts[translationE2Idx]?.trim() : undefined;

          // Quiz specific column values
          const questionValue = questionIdx !== -1 ? parts[questionIdx]?.trim() : undefined;
          const opt1Value = option1Idx !== -1 ? parts[option1Idx]?.trim() : undefined;
          const opt2Value = option2Idx !== -1 ? parts[option2Idx]?.trim() : undefined;
          const opt3Value = option3Idx !== -1 ? parts[option3Idx]?.trim() : undefined;
          const opt4Value = option4Idx !== -1 ? parts[option4Idx]?.trim() : undefined;
          const explValue = explanationIdx !== -1 ? parts[explanationIdx]?.trim() : undefined;

          // Compatibility fields fallbacks
          const ptExample = transE1Val || (ptExIndex !== -1 ? parts[ptExIndex]?.trim() : undefined);
          const enExample = ex1Val || (enExIndex !== -1 ? parts[enExIndex]?.trim() : undefined);

          items.push({
            portuguese: questionValue || ptWord,
            english: opt1Value || enWord,
            portugueseExample: ptExample,
            englishExample: enExample,
            meaning: meaningIndex !== -1 ? parts[meaningIndex]?.trim() : undefined,
            translationMeaning: translationMeaningIdx !== -1 ? parts[translationMeaningIdx]?.trim() : undefined,
            example1: ex1Val || enExample,
            example2: ex2Val,
            translationE1: transE1Val || ptExample,
            translationE2: transE2Val,

            question: questionValue,
            option1: opt1Value,
            option2: opt2Value,
            option3: opt3Value,
            option4: opt4Value,
            explanation: explValue
          });
        }
      }
    }
    return items;
  };

  const parseJSON = (text: string): FlashcardItem[] => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          portuguese: item.portuguese || item.translation || item.portugues || item.pt || "",
          english: item.english || item.word || item.ingles || item.en || "",
          meaning: item.meaning || item.significado || item.definicao,
          translationMeaning: item.translationMeaning || item.translation_meaning,
          example1: item.example1 || item.englishExample || item.example || item.exemplo_en,
          example2: item.example2,
          translationE1: item.translationE1 || item.portugueseExample || item.exemplo || item.exemplo_pt,
          translationE2: item.translationE2,
          portugueseExample: item.portugueseExample || item.exemplo || item.exemplo_pt,
          englishExample: item.englishExample || item.example || item.exemplo_en
        })).filter(item => item.portuguese && item.english);
      } else if (parsed && Array.isArray(parsed.cards)) {
        return parsed.cards.map((item: any) => ({
          portuguese: item.portuguese || item.translation || item.portugues || item.pt || "",
          english: item.english || item.word || item.ingles || item.en || "",
          meaning: item.meaning || item.significado || item.definicao,
          translationMeaning: item.translationMeaning || item.translation_meaning,
          example1: item.example1 || item.englishExample || item.example || item.exemplo_en,
          example2: item.example2,
          translationE1: item.translationE1 || item.portugueseExample || item.exemplo || item.exemplo_pt,
          translationE2: item.translationE2,
          portugueseExample: item.portugueseExample || item.exemplo || item.exemplo_pt,
          englishExample: item.englishExample || item.example || item.exemplo_en
        })).filter((item: any) => item.portuguese && item.english);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  const handleImportFiles = async (files: FileList) => {
    setImportingError(null);
    setImportingSuccess(null);
    let loadedCount = 0;
    let addedDecks: Deck[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isCSV = file.name.endsWith('.csv');
      const isJSON = file.name.endsWith('.json');
      
      if (!isCSV && !isJSON) {
        continue;
      }

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            let parsedCards: FlashcardItem[] = [];
            if (isCSV) {
              parsedCards = parseCSV(content);
            } else if (isJSON) {
              parsedCards = parseJSON(content);
            }

            if (parsedCards.length > 0) {
              const cleanedName = file.name
                .replace(/\.[^/.]+$/, "") // strip extension
                .replace(/[_\-]/g, " ")     // replace underscores/dashes with spaces
                .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize words
              
              const randomColor = DECK_COLORS[Math.floor(Math.random() * DECK_COLORS.length)];
              
              const newDeck: Deck = {
                id: `custom_deck_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: cleanedName,
                color: randomColor,
                cards: parsedCards,
                isCustom: true
              };
              addedDecks.push(newDeck);
              loadedCount += parsedCards.length;
            }
          }
          resolve();
        };
        reader.onerror = () => {
          resolve();
        };
        reader.readAsText(file);
      });
    }

    if (addedDecks.length > 0) {
      setAllDecks(prev => {
        const customSaved = localStorage.getItem('easycards_custom_decks');
        let currentCustom: Deck[] = [];
        if (customSaved) {
          try { currentCustom = JSON.parse(customSaved); } catch (e) {}
        }
        
        const updatedCustom = [...currentCustom, ...addedDecks];
        localStorage.setItem('easycards_custom_decks', JSON.stringify(updatedCustom));
        
        const joined = [...CONSTANT_PRESET_DECKS, ...updatedCustom];
        const colorsSaved = localStorage.getItem('easycards_deck_colors');
        let colorOverrides: { [deckId: string]: string } = {};
        if (colorsSaved) { try { colorOverrides = JSON.parse(colorsSaved); } catch (e) {} }
        return joined.map(d => colorOverrides[d.id] ? { ...d, color: colorOverrides[d.id] } : d);
      });
      setImportingSuccess(`Success! Imported ${addedDecks.length} set(s) with a total of ${loadedCount} words.`);
    } else {
      setImportingError("No compatible vocabulary files detected. Make sure to upload valid .csv or .json files.");
    }
  };

  const GITHUB_REPO = 'caioloures/flashcards';

  const syncFolderFromGitHub = async (
    folder: string,
    idPrefix: string,
    setLoading: (v: boolean) => void,
    setMsg: (v: string | null) => void,
    setErr: (v: string | null) => void,
    silent = false
  ) => {
    if (silent) setIsAutoSyncing(true);
    else { setLoading(true); setMsg(null); setErr(null); }

    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${folder}`;
      const listRes = await fetch(apiUrl, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
      if (!listRes.ok) throw new Error(`Cannot access GitHub repository (status ${listRes.status}).`);

      const files: { name: string; download_url: string; type: string }[] = await listRes.json();
      const csvFiles = files.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.csv'));

      if (csvFiles.length === 0) {
        if (!silent) setErr(`No .csv files found in the "${folder}" folder.`);
        return;
      }

      const addedDecks: Deck[] = [];
      let totalCards = 0;

      for (let i = 0; i < csvFiles.length; i++) {
        const file = csvFiles[i];
        const rawRes = await fetch(file.download_url);
        if (!rawRes.ok) { console.warn(`Failed to download ${file.name}, skipping.`); continue; }
        const content = await rawRes.text();
        const parsedCards = parseCSV(content);

        if (parsedCards.length > 0) {
          const cleanedName = file.name
            .replace(/\.csv$/i, '')
            .replace(/[_\-]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());

          addedDecks.push({
            id: `${idPrefix}${file.name}`,
            name: cleanedName,
            color: DECK_COLORS[i % DECK_COLORS.length],
            cards: parsedCards,
            isCustom: true
          });
          totalCards += parsedCards.length;
        }
      }

      if (addedDecks.length === 0) {
        if (!silent) setErr('CSV files found but could not be processed. Check the format.');
        return;
      }

      setAllDecks(prev => {
        const customSaved = localStorage.getItem('easycards_custom_decks');
        let currentCustom: Deck[] = [];
        try { if (customSaved) currentCustom = JSON.parse(customSaved); } catch (e) {}
        // Remove decks of this folder prefix AND clean up legacy `github_` prefix (old format)
        const nonThisFolder = currentCustom.filter(d =>
          !d.id.startsWith(idPrefix) &&
          !(d.id.startsWith('github_') && !d.id.startsWith('github_fc_') && !d.id.startsWith('github_quiz_'))
        );
        const updatedCustom = [...nonThisFolder, ...addedDecks];
        localStorage.setItem('easycards_custom_decks', JSON.stringify(updatedCustom));
        const joined = [...CONSTANT_PRESET_DECKS, ...updatedCustom];
        const colorsSaved = localStorage.getItem('easycards_deck_colors');
        let colorOverrides: { [id: string]: string } = {};
        try { if (colorsSaved) colorOverrides = JSON.parse(colorsSaved); } catch (e) {}
        return joined.map(d => colorOverrides[d.id] ? { ...d, color: colorOverrides[d.id] } : d);
      });

      if (!silent) setMsg(`✅ ${addedDecks.length} set(s) synced — ${totalCards} cards imported from GitHub.`);
    } catch (err: any) {
      console.error('GitHub sync error:', err);
      if (!silent) setErr(err.message || 'Unexpected error while syncing from GitHub.');
    } finally {
      if (silent) setIsAutoSyncing(false);
      else setLoading(false);
    }
  };

  const syncDecksFromGitHub = (silent = false) =>
    syncFolderFromGitHub('flashcards', 'github_fc_', setIsGithubSyncing, setGithubSyncMessage, setGithubSyncError, silent);

  const syncQuizDecksFromGitHub = () =>
    syncFolderFromGitHub('quiz', 'github_quiz_', setIsSyncingQuiz, setQuizSyncMessage, setQuizSyncError, false);

  // Auto-sync from GitHub on login (both folders)
  useEffect(() => {
    if (sessionUser) {
      syncDecksFromGitHub(true);
      syncFolderFromGitHub('quiz', 'github_quiz_', setIsSyncingQuiz, setQuizSyncMessage, setQuizSyncError, true);
    }
  }, [sessionUser]);

  // ==========================================
  // QUIZ GENERATOR & CORE CONTROLLER
  // ==========================================
  const startQuizGame = (deck: Deck, forceRestart = false) => {
    if (deck.cards.length === 0) { alert('This set of cards is empty.'); return; }
    resetGameState();
    setSelectedDeck(deck);
    setSelectedQuizFolder(getDeckFolder(deck, 'quiz'));

    const deckState = restoreDeckState(deck.id);
    const savedQuiz = deckState?.quizState;

    if (savedQuiz && !forceRestart && !savedQuiz.quizFinished && savedQuiz.activeQuizQuestions && savedQuiz.activeQuizQuestions.length > 0) {
      const decompressed = savedQuiz.activeQuizQuestions.map((q: any) => {
        if (q.prompt !== undefined) {
          return q;
        }
        const originalIndex = q.i;
        const card = deck.cards[originalIndex];
        if (!card) return null;
        const questionPrompt = card.question || card.portuguese || card.portugueseExample || `Translate: "${card.portuguese}"`;
        const correctText = card.option1 || card.english;
        return {
          prompt: questionPrompt,
          options: q.o,
          correctAnswer: correctText,
          originalCardIndex: originalIndex,
          explanation: card.explanation || card.rule || ''
        };
      }).filter(Boolean);

      setActiveQuizQuestions(decompressed);
      setCurrentQuizQIndex(savedQuiz.currentQuizQIndex);
      setSelectedQuizOption(savedQuiz.selectedQuizOption);
      setQuizScore(savedQuiz.quizScore);
      setQuizFinished(savedQuiz.quizFinished);
      setLastUnfinishedQuizDeckId(deck.id);
      setCurrentScreen('quiz_game');
      return;
    }

    setLastUnfinishedQuizDeckId(deck.id);
    localStorage.removeItem('easycards_quiz_completed_' + deck.id);
    localStorage.removeItem('easycards_quiz_final_score_' + deck.id);
    localStorage.setItem('easycards_quiz_started_' + deck.id, 'true');
    const shuffledDecks = [...deck.cards].sort(() => Math.random() - 0.5);
    const generated = shuffledDecks.map((card) => {
      const originalIndex = deck.cards.findIndex(c => c.portuguese === card.portuguese && c.english === card.english);
      
      const questionPrompt = card.question || card.portuguese || card.portugueseExample || `Translate: "${card.portuguese}"`;
      const correctText = card.option1 || card.english;
      
      let finalOptions: string[] = [];
      if (card.option1) {
        finalOptions.push(card.option1);
        if (card.option2) finalOptions.push(card.option2);
        if (card.option3) finalOptions.push(card.option3);
        if (card.option4) finalOptions.push(card.option4);
      } else {
        finalOptions.push(correctText);
        const optionPool = deck.cards.filter(c => c.english !== correctText).map(c => c.english).sort(() => Math.random() - 0.5);
        for (const wrong of optionPool) { if (finalOptions.length < 4 && !finalOptions.includes(wrong) && wrong !== '') finalOptions.push(wrong); }
        while (finalOptions.length < 4) {
          const fallbacks = ['Apple', 'Water', 'Book', 'Computer', 'To learn', 'To speak', 'Airport'];
          const item = fallbacks[Math.floor(Math.random() * fallbacks.length)];
          if (!finalOptions.includes(item)) finalOptions.push(item);
        }
      }

      // Always shuffle options randomly
      const shuffledOptions = [...finalOptions].sort(() => Math.random() - 0.5);

      return { 
        prompt: questionPrompt, 
        options: shuffledOptions, 
        correctAnswer: correctText, 
        originalCardIndex: originalIndex,
        explanation: card.explanation || card.rule || ''
      };
    });
    setActiveQuizQuestions(generated);
    setCurrentQuizQIndex(0);
    setSelectedQuizOption(null);
    setQuizScore(0);
    setQuizFinished(false);
    saveQuizProgress(deck.id, generated, 0, null, 0, false);
    setCurrentScreen('quiz_game');
  };

  const handleSelectQuizAnswer = (option: string) => {
    if (selectedQuizOption !== null || !selectedDeck) return;
    setSelectedQuizOption(option);
    const correct = activeQuizQuestions[currentQuizQIndex].correctAnswer === option;
    const nextScore = quizScore + (correct ? 1 : 0);
    if (correct) setQuizScore(nextScore);
    const currentCorrect = nextScore;
    setLastQuizProgress({ correct: currentCorrect, total: activeQuizQuestions.length });
    localStorage.setItem('easycards_last_quiz_progress', JSON.stringify({ correct: currentCorrect, total: activeQuizQuestions.length }));
    saveQuizProgress(selectedDeck.id, activeQuizQuestions, currentQuizQIndex, option, nextScore, false);
  };

  const handleNextQuizQuestion = () => {
    if (!selectedDeck) return;
    if (currentQuizQIndex + 1 < activeQuizQuestions.length) { 
      const nextIndex = currentQuizQIndex + 1;
      setCurrentQuizQIndex(nextIndex); 
      setSelectedQuizOption(null); 
      saveQuizProgress(selectedDeck.id, activeQuizQuestions, nextIndex, null, quizScore, false);
    } else { 
      setQuizFinished(true); 
      if (lastUnfinishedQuizDeckId === selectedDeck.id) setLastUnfinishedQuizDeckId(null); 
      saveQuizProgress(selectedDeck.id, activeQuizQuestions, currentQuizQIndex, selectedQuizOption, quizScore, true);
    }
  };

  // ==========================================
  // GUESS GAME CORE CONTROLLERS
  // ==========================================
  const startGuessGame = (deck: Deck, forceRestart = false) => {
    if (deck.cards.length === 0) { alert('This set of cards is empty.'); return; }
    resetGameState();
    setSelectedDeck(deck);
    setSelectedGuessFolder(getDeckFolder(deck, 'flashcards'));

    const deckState = restoreDeckState(deck.id);
    const savedGuess = deckState?.guessState;

    if (savedGuess && !forceRestart && !savedGuess.guessFinished && savedGuess.activeGuessQuestions && savedGuess.activeGuessQuestions.length > 0) {
      const decompressed = savedGuess.activeGuessQuestions.map((item: any) => {
        if (typeof item === 'object' && item !== null && item.portuguese !== undefined) {
          return item;
        }
        const idx = typeof item === 'number' ? item : (item.i !== undefined ? item.i : 0);
        return deck.cards[idx];
      }).filter(Boolean);

      setActiveGuessQuestions(decompressed);
      setCurrentGuessIndex(savedGuess.currentGuessIndex);
      setGuessInput(savedGuess.guessInput);
      setGuessFeedback(savedGuess.guessFeedback);
      setGuessHintsUsedCount(savedGuess.guessHintsUsedCount);
      setGuessShowCorrectWord(savedGuess.guessShowCorrectWord);
      setGuessScore(savedGuess.guessScore);
      setGuessFinished(savedGuess.guessFinished);
      setLastUnfinishedGuessDeckId(deck.id);
      setLastGuessProgress({ correct: savedGuess.guessScore, total: decompressed.length });
      setCurrentScreen('guess_game');
      return;
    }

    localStorage.removeItem('easycards_learn_completed_' + deck.id);
    const selected = [...deck.cards].sort(() => Math.random() - 0.5);
    setActiveGuessQuestions(selected);
    setCurrentGuessIndex(0);
    setGuessInput('');
    setGuessFeedback('idle');
    setGuessHintsUsedCount(0);
    setGuessShowCorrectWord(false);
    setGuessScore(0);
    setGuessFinished(false);
    setLastUnfinishedGuessDeckId(deck.id);
    setLastGuessProgress({ correct: 0, total: selected.length });
    saveGuessProgress(deck.id, selected, 0, '', 'idle', 0, false, 0, false);
    setCurrentScreen('guess_game');
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guessFeedback === 'correct' || guessShowCorrectWord || !selectedDeck) return;
    const currentCard = activeGuessQuestions[currentGuessIndex];
    if (!currentCard) return;
    const userGuess = guessInput.trim().toLowerCase().replace(/^to\s+/i, '');
    const correctWord = currentCard.english.trim().toLowerCase().replace(/^to\s+/i, '');
    const synonyms = correctWord.split(',').map(s => s.trim());
    const isMatched = synonyms.some(syn => syn === userGuess) || userGuess === correctWord;
    
    let nextScore = guessScore;
    let nextFeedback = 'wrong';
    if (isMatched) {
      nextFeedback = 'correct';
      nextScore = guessScore + 1;
      setGuessFeedback('correct');
      setGuessScore(nextScore);
      setLastGuessProgress(prev => prev ? { ...prev, correct: prev.correct + 1 } : null);
    } else {
      setGuessFeedback('wrong');
    }
    saveGuessProgress(selectedDeck.id, activeGuessQuestions, currentGuessIndex, guessInput, nextFeedback, guessHintsUsedCount, guessShowCorrectWord, nextScore, false);
  };

  const handleGuessHint = () => {
    if (!selectedDeck) return;
    const currentCard = activeGuessQuestions[currentGuessIndex];
    if (!currentCard) return;
    const maxLetters = currentCard.english.replace(/[^a-zA-Z]/g, '').length;
    let nextHints = guessHintsUsedCount;
    if (guessHintsUsedCount < maxLetters) {
      nextHints = guessHintsUsedCount + 1;
      setGuessHintsUsedCount(nextHints);
    }
    saveGuessProgress(selectedDeck.id, activeGuessQuestions, currentGuessIndex, guessInput, guessFeedback, nextHints, guessShowCorrectWord, guessScore, false);
  };

  const handleNextGuessQuestion = () => {
    if (!selectedDeck) return;
    if (currentGuessIndex + 1 < activeGuessQuestions.length) {
      const nextIndex = currentGuessIndex + 1;
      setCurrentGuessIndex(nextIndex);
      setGuessInput(''); 
      setGuessFeedback('idle'); 
      setGuessHintsUsedCount(0); 
      setGuessShowCorrectWord(false);
      saveGuessProgress(selectedDeck.id, activeGuessQuestions, nextIndex, '', 'idle', 0, false, guessScore, false);
    } else {
      setGuessFinished(true);
      setLastUnfinishedGuessDeckId(null);
      setLastGuessProgress(null);
      saveGuessProgress(selectedDeck.id, activeGuessQuestions, currentGuessIndex, guessInput, guessFeedback, guessHintsUsedCount, guessShowCorrectWord, guessScore, true);
    }
  };

  const getGuessWordClue = (word: string, revealedCount: number): string => {
    if (guessShowCorrectWord) return word;
    const trimmed = word.trim();
    let clue = ''; let lettersCounted = 0;
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (/[a-zA-Z]/.test(char)) { if (lettersCounted < revealedCount) { clue += char; lettersCounted++; } else clue += '_'; }
      else clue += char;
    }
    return clue.split('').join(' ');
  };

  return (
    <div id="easycards-web-pwa" className="min-h-screen bg-white text-[#1a1a1a] font-sans antialiased flex flex-col justify-between relative overscroll-y-contain">
      
      {/* Safe area top bar — 30px solid white, no fade */}
      <div className="fixed top-0 left-0 right-0 h-[30px] z-[60] pointer-events-none bg-white" />

      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-3 pb-6 flex flex-col justify-start mt-[50px]">
        
        {/* ==========================================
            SCREEN: LOGIN
           ========================================== */}
        {currentScreen === 'login' && (
          <div id="login-screen-view" className="bg-white py-6 flex flex-col items-center justify-center font-sans space-y-6">
            {/* Round Corner Icon */}
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xs border border-slate-100 flex items-center justify-center bg-white transition-transform hover:scale-105 duration-300">
              <img 
                src="https://raw.githubusercontent.com/caioloures/flashcards/main/Icon-512x512.png" 
                alt="EasyCards App Icon Logo" 
                className="w-full h-full object-cover rounded-3xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/caioloures/flashcards/main/Icon-512x512.png";
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-full space-y-5 px-2 text-center">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-650 rounded-xl text-xs font-semibold leading-relaxed text-center">{loginError}</div>
              )}
              <div className="text-center pb-2">
                <h1 className="text-2xl font-black text-[#2f59eb] tracking-tight font-gotham">EasyCards</h1>
                <p className="text-gray-400 text-xs mt-1 font-medium">Connect your Google account to start studying</p>
              </div>
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 bg-white border border-gray-250 hover:border-gray-450 hover:bg-slate-50/50 text-gray-700 rounded-2xl font-bold text-sm flex items-center justify-center transition-all shadow-3xs active:scale-95 cursor-pointer mt-4"
              >
                <svg className="w-4.5 h-4.5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: HOME PAGE
           ========================================== */}
        {currentScreen === 'home' && (
          <div id="home-screen-view" className="space-y-5">

            {/* Welcome block — improved with Google Sans Flex aesthetics */}
            {(() => {
              let totalSets = 0;
              let completedSets = 0;
              let inProgressSets = 0;
              let notStartedSets = 0;

              // Only count vocabulary decks (excluding quiz items) as sets
              const vocabDecks = allDecks.filter(deck => !deck.id.startsWith('github_quiz_'));
              totalSets = vocabDecks.length;

              vocabDecks.forEach(deck => {
                // 1. Flashcards Status
                const stats = getDeckStats(deck);
                const totalVal = stats.total;
                const learnedVal = stats.completed;
                const notReviewedVal = stats.notStarted;
                
                if (totalVal > 0) {
                  if (learnedVal === totalVal) {
                    completedSets++;
                  } else if (notReviewedVal === totalVal) {
                    notStartedSets++;
                  } else {
                    inProgressSets++;
                  }
                }

                // 2. Quiz Status
                const quizCompleted = localStorage.getItem('easycards_quiz_completed_' + deck.id) === 'true';
                const quizInProgress = localStorage.getItem('easycards_quiz_state_' + deck.id) !== null || localStorage.getItem('easycards_quiz_started_' + deck.id) === 'true';
                if (quizCompleted) {
                  completedSets++;
                } else if (quizInProgress) {
                  inProgressSets++;
                } else {
                  notStartedSets++;
                }

                // 3. Learn (Guess) Status
                const learnCompleted = localStorage.getItem('easycards_learn_completed_' + deck.id) === 'true';
                const learnInProgress = localStorage.getItem('easycards_guess_state_' + deck.id) !== null;
                if (learnCompleted) {
                  completedSets++;
                } else if (learnInProgress) {
                  inProgressSets++;
                } else {
                  notStartedSets++;
                }
              });

              totalSets = completedSets + inProgressSets + notStartedSets;

              return (
                <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xs flex flex-row items-center justify-between gap-3 w-full" style={{ fontFamily: 'var(--font-googlesans)' }}>
                  {/* Left part: Avatar, Welcome back, Username */}
                  <div className="flex items-center space-x-2 min-w-0 max-w-[42%] flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                      <img 
                        src={avatarSeed.startsWith('http') ? avatarSeed : `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${encodeURIComponent(avatarSeed)}`}
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight leading-none">Welcome back</p>
                      <h4 className="text-[13.5px] font-extrabold text-gray-900 truncate mt-0.5 tracking-tight leading-tight">{sessionName || sessionUser}</h4>
                    </div>
                  </div>

                  {/* Right part: Card stats layout */}
                  <div className="flex-1 grid grid-cols-3 gap-1.5 px-0.5 text-center min-w-0">
                    <div className="bg-[#E6F9F0] rounded-xl py-1 px-1.5 min-w-0 flex flex-col justify-center items-center shadow-3xs">
                      <span className="text-[12.5px] font-black text-[#0EB880] block tracking-tight leading-none font-googlesans">{completedSets}</span>
                      <p className="text-[7.2px] font-bold text-[#0A875D] uppercase mt-0.5 leading-none">Completed</p>
                    </div>
                    <div className="bg-[#FFF4E6] rounded-xl py-1 px-1.5 min-w-0 flex flex-col justify-center items-center shadow-3xs">
                      <span className="text-[12.5px] font-black text-[#FF9200] block tracking-tight leading-none font-googlesans">{inProgressSets}</span>
                      <p className="text-[7.2px] font-bold text-[#C66F00] uppercase mt-0.5 leading-tight text-center">
                        In<br/>Progress
                      </p>
                    </div>
                    <div className="bg-[#FFEBEB] rounded-xl py-1 px-1.5 min-w-0 flex flex-col justify-center items-center shadow-3xs">
                      <span className="text-[12.5px] font-black text-[#E03131] block tracking-tight leading-none font-googlesans">{notStartedSets}</span>
                      <p className="text-[7.2px] font-bold text-[#C92A2A] uppercase mt-0.5 leading-tight text-center">
                        Not<br/>Started
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 gap-4 font-sans">
              <button onClick={() => navigateTo('flashcard_list')}
                className="w-full bg-[#FFA022] rounded-2xl p-6 hover:scale-[1.01] transition-all shadow-md hover:shadow-lg flex flex-row items-center justify-between cursor-pointer text-left border-0 relative overflow-hidden group pb-7">
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 transition-all duration-300 group-hover:bg-white/10" />
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full" />
                <div className="space-y-2.5 max-w-[72%] z-10">
                  <div className="inline-flex items-center space-x-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white">
                    <BookOpen className="w-3.5 h-3.5" /><span>Flashcards</span>
                  </div>
                  <h3 className="text-2xl font-black font-gotham text-white tracking-tight leading-none">Flashcards</h3>
                  <p className="text-xs text-white/90 leading-relaxed font-sans font-medium">Study with self-paced interactive cards. Swipe right when you master the word, and left to review.</p>
                </div>
                <div className="relative w-24 h-16 mr-1 mt-2 select-none z-10 flex items-center justify-center">
                  <div className="absolute w-14 h-11 bg-white/30 border border-white/40 rounded-lg shadow-sm rotate-12 translate-x-4 translate-y-1.5" />
                  <div className="absolute w-14 h-11 bg-white/50 border border-white/70 rounded-lg shadow-sm -rotate-6 translate-x-2 -translate-y-1" />
                  <div className="absolute w-14 h-11 bg-white border border-white/90 rounded-lg shadow-md flex items-center justify-center">
                    <span className="text-[10px] font-black font-mono text-[#FFA022] tracking-tight">RUN</span>
                  </div>
                </div>
              </button>

              <button onClick={() => navigateTo('quiz_list')}
                className="w-full bg-[#0EB880] rounded-2xl p-6 hover:scale-[1.01] transition-all shadow-md hover:shadow-lg flex flex-row items-center justify-between cursor-pointer text-left border-0 relative overflow-hidden group pb-7">
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 -skew-x-12 transition-all duration-300 group-hover:bg-white/10" />
                <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/5 rounded-full" />
                <div className="space-y-2.5 max-w-[72%] z-10">
                  <div className="inline-flex items-center space-x-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white">
                    <Award className="w-3.5 h-3.5" /><span>Practice Exercises</span>
                  </div>
                  <h3 className="text-2xl font-black font-gotham text-white tracking-tight leading-none">Quiz & Games</h3>
                  <p className="text-xs text-white/90 leading-relaxed font-sans font-medium">Reinforce your retention with instant 10-question test sheets compiled directly from your decks.</p>
                </div>
                <div className="relative w-24 h-16 mr-1 mt-2 select-none z-10 flex items-center justify-center">
                  <div className="absolute w-12 h-14 bg-white rounded-lg shadow-md p-1.5 flex flex-col justify-between">
                    <div className="space-y-1"><div className="w-4 h-1 bg-gray-200 rounded" /><div className="w-8 h-1 bg-gray-100 rounded" /></div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-[#0EB880] flex items-center justify-center"><Check className="w-2 h-2 text-white stroke-[3.5px]" /></div>
                      <div className="w-4 h-1 bg-[#0EB880] rounded" />
                    </div>
                  </div>
                </div>
              </button>

              <button onClick={() => navigateTo('guess_list')}
                className="w-full bg-[#8B5CF6] rounded-2xl p-6 hover:scale-[1.01] transition-all shadow-md hover:shadow-lg flex flex-row items-center justify-between cursor-pointer text-left border-0 relative overflow-hidden group pb-7">
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 transition-all duration-300 group-hover:bg-white/10" />
                <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/5 rounded-full" />
                <div className="space-y-2.5 max-w-[72%] z-10">
                  <div className="inline-flex items-center space-x-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white">
                    <Brain className="w-3.5 h-3.5" /><span>Learn</span>
                  </div>
                  <h3 className="text-2xl font-black font-gotham text-white tracking-tight leading-none">Learn</h3>
                  <p className="text-xs text-white/90 leading-relaxed font-sans font-medium">Test your memory by translating Portuguese words. Reveal letter clues when you get stuck.</p>
                </div>
                <div className="relative w-24 h-16 mr-1 mt-2 select-none z-10 flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center font-black text-[#8B5CF6] text-xl font-sans">
                    <Brain className="w-6 h-6 text-[#8B5CF6]" />
                  </div>
                </div>
              </button>
            </div>

            <div className="p-4.5 bg-white border border-gray-200 rounded-2xl space-y-3.5 shadow-3xs">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-gotham">Your Unfinished Studies</h4>
              {lastUnfinishedFlashcardDeckId ? (() => {
                const dec = allDecks.find(d => d.id === lastUnfinishedFlashcardDeckId);
                if (!dec) return null;
                const stats = getDeckStats(dec);
                const percent = stats.total > 0 ? (stats.learned / stats.total) * 100 : 0;
                return (
                  <div className="p-3.5 border border-gray-200 rounded-xl space-y-2.5 bg-slate-50/20 hover:bg-slate-50/50 transition-all shadow-3xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-850 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full inline-block mr-2" style={{ backgroundColor: dec.color }} />{dec.name} (Flashcards)
                      </span>
                      <span className="text-gray-400 font-medium font-mono text-[11px]">{stats.learned} / {stats.total} learned</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-300" style={{ width: `${percent}%`, backgroundColor: '#70EC7C' }} />
                    </div>
                    <button onClick={() => startFlashcardGame(dec)} className="text-[11px] font-bold text-black hover:underline flex items-center cursor-pointer pt-1">Resume deck study card &rarr;</button>
                  </div>
                );
              })() : <p className="text-xs text-gray-400 italic">No pending unfinished flashcard session.</p>}

              {lastUnfinishedQuizDeckId ? (() => {
                const dec = allDecks.find(d => d.id === lastUnfinishedQuizDeckId);
                if (!dec) return null;
                const answered = lastQuizProgress ? lastQuizProgress.correct : 0;
                const totalQ = lastQuizProgress ? lastQuizProgress.total : 10;
                return (
                  <div className="p-3.5 border border-gray-200 rounded-xl space-y-2.5 bg-slate-50/20 hover:bg-slate-50/50 transition-all shadow-3xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-850 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full inline-block mr-2 bg-[#0EB880]" />{dec.name} Quiz Practice
                      </span>
                      <span className="text-gray-500 font-semibold font-mono text-[11px]">{answered} / {totalQ} correct</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-300" style={{ width: `${(answered / totalQ) * 100}%`, backgroundColor: '#70EC7C' }} />
                    </div>
                    <button onClick={() => startQuizGame(dec)} className="text-[11px] font-bold text-black hover:underline flex items-center cursor-pointer pt-1">Resume Quiz exercises &rarr;</button>
                  </div>
                );
              })() : <p className="text-xs text-gray-400 italic mt-2 border-t border-gray-100/60 pt-2.5">No pending unfinished quiz practice.</p>}

              {lastUnfinishedGuessDeckId ? (() => {
                const dec = allDecks.find(d => d.id === lastUnfinishedGuessDeckId);
                if (!dec) return null;
                const answered = lastGuessProgress ? lastGuessProgress.correct : 0;
                const totalQ = lastGuessProgress ? lastGuessProgress.total : 10;
                return (
                  <div className="p-3.5 border border-gray-200 rounded-xl space-y-2.5 bg-slate-50/20 hover:bg-slate-50/50 transition-all shadow-3xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-850 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full inline-block mr-2 bg-[#8B5CF6]" />{dec.name} Learn Practice
                      </span>
                      <span className="text-gray-500 font-semibold font-mono text-[11px]">{answered} / {totalQ} correct</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-300" style={{ width: `${(answered / totalQ) * 100}%`, backgroundColor: '#8B5CF6' }} />
                    </div>
                    <button onClick={() => startGuessGame(dec)} className="text-[11px] font-bold text-black hover:underline flex items-center cursor-pointer pt-1">Resume Learn exercises &rarr;</button>
                  </div>
                );
              })() : <p className="text-xs text-gray-400 italic mt-2 border-t border-gray-100/60 pt-2.5">No pending unfinished Learn session.</p>}
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: FLASHCARD DECK SELECTOR LIST
           ========================================== */}
        {currentScreen === 'flashcard_list' && (
          <div id="flashcard-list-view" className="space-y-5">
            {/* Sticky Header Container */}
            <div className="sticky top-[30px] bg-white z-20 pb-3 space-y-4 border-b border-gray-100/60">
              <div className="flex justify-between items-center h-[50px] pb-1">
                <button 
                  onClick={() => {
                    if (selectedFlashcardFolder) {
                      setSelectedFlashcardFolder(null);
                    } else {
                      navigateTo('home');
                    }
                  }} 
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 shadow-sm hover:border-black"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <h3 className="text-lg font-black font-googlesans text-[#FFA022]">Flashcards</h3>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-wider">Select to Practice</span>
                </div>
                <button
                  onClick={() => syncDecksFromGitHub(false)}
                  disabled={isGithubSyncing}
                  title="Sync flashcards from GitHub"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 shadow-sm hover:border-black disabled:opacity-40"
                >
                  {isGithubSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative mt-[30px]">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400"><Search className="w-4 h-4" /></span>
                <input type="text" value={deckSearchQuery} onChange={(e) => setDeckSearchQuery(e.target.value)} placeholder="Search vocabulary sets..."
                  className="w-full bg-slate-50 border border-gray-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-black transition-all" />
                {deckSearchQuery && (
                  <button type="button" onClick={() => setDeckSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-black border-0 bg-transparent cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-normal pl-0.5 font-sans">Tap any folder below to browse, then tap any card to play!</p>
            </div>

            {githubSyncMessage && (
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-bold animate-fadeIn">
                {githubSyncMessage}
              </div>
            )}
            {githubSyncError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] font-bold animate-fadeIn">
                ⚠️ {githubSyncError}
              </div>
            )}

            <div className="space-y-3.5 pt-1">
              {(() => {
                const flashcardDecks = allDecks.filter(deck => !deck.id.startsWith('github_quiz_'));
                const filteredDecks = flashcardDecks.filter(deck => deck.name.toLowerCase().includes(deckSearchQuery.toLowerCase()));

                if (selectedFlashcardFolder === null) {
                  // Folder selection mode
                  const uniqueFolders = Array.from(new Set(filteredDecks.map(deck => getDeckFolder(deck, 'flashcards'))));

                  if (uniqueFolders.length === 0) {
                    return isAutoSyncing ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin text-[#FFA022]" />
                        <p className="text-xs font-semibold">Loading decks from GitHub...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center py-8 px-4 space-y-3 bg-slate-50 border border-dashed border-gray-200 rounded-2xl">
                        <p className="text-xs font-bold text-gray-500">No folders found.</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Add <span className="font-mono text-gray-600">.csv</span> files to the{' '}
                          <span className="font-mono text-gray-600">flashcards/</span> folder on GitHub, then tap the sync button above.
                        </p>
                        <a href="https://github.com/caioloures/flashcards/tree/main/flashcards" target="_blank" rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#2F59EB] hover:underline">
                          Open repository &rarr;
                        </a>
                      </div>
                    );
                  }

                  return uniqueFolders.map((folderName) => {
                    const decksInFolder = filteredDecks.filter(deck => getDeckFolder(deck, 'flashcards') === folderName);
                    const totalTerms = decksInFolder.reduce((acc, d) => acc + d.cards.length, 0);
                    const folderKey = 'fc_' + folderName;
                    const folderColor = folderColors[folderKey] || '#FFA022';

                    return (
                      <div key={folderName} className="relative block">
                        <button
                          onClick={() => setSelectedFlashcardFolder(folderName)}
                          className="group w-full text-left rounded-2xl p-5 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden flex items-center space-x-4 min-h-[92px] shadow-3xs text-white"
                          style={{ backgroundColor: folderColor }}
                        >
                          <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10 pointer-events-none transition-all duration-300 group-hover:scale-110" />
                          <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-white/15 pointer-events-none" />
                          
                          <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-white/25 relative z-10">
                            <FolderOpen className="w-5 h-5 opacity-95" />
                          </div>

                          <div className="flex-1 min-w-0 relative z-10">
                            <h4 className="text-base font-extrabold text-white truncate tracking-tight font-gotham">
                              {folderName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 font-googlesans text-[10px]">
                              <span className="font-extrabold px-1.5 py-0.5 bg-black/15 text-white rounded-md">
                                {decksInFolder.length} {decksInFolder.length === 1 ? 'set' : 'sets'}
                              </span>
                              <span className="font-semibold px-1.5 py-0.5 bg-white/15 text-white/90 rounded-md">
                                {totalTerms} terms
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Folder Color Picker */}
                        <div className="absolute top-4 right-4 z-20">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setColorPickerFolderKey(prev => prev === folderKey ? null : folderKey);
                            }} 
                            className="p-1 px-1.5 rounded-md bg-white/15 hover:bg-white/25 active:scale-90 text-white transition-all cursor-pointer border-0"
                            title="Change folder color"
                          >
                            <Menu className="w-3.5 h-3.5" />
                          </button>
                          {colorPickerFolderKey === folderKey && (
                            <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl p-2.5 shadow-xl grid grid-cols-6 gap-1.5 z-30 w-52">
                              {DECK_COLORS.map((color) => (
                                <button 
                                  key={color} 
                                  onClick={(e) => handleUpdateFolderColor(folderKey, color, e)}
                                  className="w-6 h-6 rounded-full border border-white cursor-pointer hover:scale-110 active:scale-95 transition-all"
                                  style={{ backgroundColor: color }} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                } else {
                  // Sub-list: Show decks inside selected folder
                  const decksToShow = filteredDecks.filter(deck => getDeckFolder(deck, 'flashcards') === selectedFlashcardFolder);

                  if (decksToShow.length === 0) {
                    return (
                      <div className="text-center py-8 bg-slate-50 border border-dashed border-gray-200 rounded-2xl">
                        <p className="text-xs font-bold text-gray-500">No sets found in this folder matching your search.</p>
                      </div>
                    );
                  }

                  return decksToShow.map((deck) => {
                    const stats = getDeckStats(deck);
                    const totalVal = stats.total;
                    const learnedVal = stats.completed;
                    const learningVal = stats.inProgress;
                    const notReviewedVal = stats.notStarted;

                    let setStatusText = "Not Started";
                    let statusColor = "#EF4444";
                    if (totalVal > 0) {
                      if (learnedVal === totalVal) {
                        setStatusText = "Completed";
                        statusColor = "#10B981";
                      } else if (notReviewedVal === totalVal) {
                        setStatusText = "Not Started";
                        statusColor = "#EF4444";
                      } else {
                        setStatusText = "In Progress";
                        statusColor = "#F59E0B";
                      }
                    }

                    return (
                      <div key={deck.id} className="relative block">
                        <div onClick={() => startFlashcardGame(deck)}
                          className="group w-full text-left rounded-2xl p-5 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-start min-h-[100px] shadow-3xs text-white"
                          style={{ backgroundColor: deck.color }}>
                          
                          <div className="absolute -right-6 top-0 bottom-0 w-[35%] bg-white/5 -skew-x-12 pointer-events-none transition-all duration-300 group-hover:w-[38%]" />
                          <div className="absolute -right-3 top-0 bottom-0 w-[20%] bg-white/7 -skew-x-12 pointer-events-none" />
                          
                          <div className="relative z-10 space-y-2.5 w-full">
                            <div className="flex items-start gap-2.5">
                              {/* Color picker icon inside the layout on the left */}
                              <div className="relative z-25 mt-1 flex-shrink-0">
                                <button onClick={(e) => handleToggleColorPicker(deck.id, e)} className="p-1 px-1.5 rounded-md bg-white/12 hover:bg-white/25 active:scale-90 text-white transition-all cursor-pointer border-0" title="Change set color">
                                  <Menu className="w-3.5 h-3.5" />
                                </button>
                                {colorPickerDeckId === deck.id && (
                                  <div className="absolute left-0 top-7 bg-white border border-gray-200 rounded-xl p-2.5 shadow-xl grid grid-cols-6 gap-1.5 z-35 w-52">
                                    {DECK_COLORS.map((color) => (
                                      <button key={color} onClick={(e) => handleUpdateDeckColor(deck.id, color, e)}
                                        className="w-6 h-6 rounded-full border border-white cursor-pointer hover:scale-110 active:scale-95 transition-all"
                                        style={{ backgroundColor: color }} />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight font-gotham break-words">{deck.name}</h4>
                                  <span 
                                    className="inline-flex items-center text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 bg-white shadow-3xs"
                                    style={{ color: statusColor }}
                                  >
                                    <span>{setStatusText}</span>
                                    <span className="w-1.5 h-1.5 rounded-full ml-1.5" style={{ backgroundColor: statusColor }} />
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1.5 pt-1 font-googlesans text-[11px] text-white">
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{totalVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">Total</span>
                              </div>
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{learnedVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">Learned</span>
                              </div>
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{learningVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">Learning</span>
                              </div>
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{notReviewedVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">New</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                }
              })()}
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: QUIZ DECK SELECTOR LIST
           ========================================== */}
        {currentScreen === 'quiz_list' && (
          <div id="quiz-list-view" className="space-y-5">
            {/* Sticky Header Container */}
            <div className="sticky top-[30px] bg-white z-20 pb-3 space-y-4 border-b border-gray-100/60">
              <div className="flex justify-between items-center h-[50px] pb-1">
                <button 
                  onClick={() => {
                    if (selectedQuizFolder) {
                      setSelectedQuizFolder(null);
                    } else {
                      navigateTo('home');
                    }
                  }} 
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 shadow-sm hover:border-black"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <h3 className="text-lg font-black font-googlesans text-[#0EB880]">Quiz</h3>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-wider">Select to Train</span>
                </div>
                <button
                  onClick={syncQuizDecksFromGitHub}
                  disabled={isSyncingQuiz}
                  title="Sync quiz sets from GitHub"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 shadow-sm hover:border-black disabled:opacity-40"
                >
                  {isSyncingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative mt-[30px]">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400"><Search className="w-4 h-4" /></span>
                <input type="text" value={deckSearchQuery} onChange={(e) => setDeckSearchQuery(e.target.value)} placeholder="Search vocabulary sets..."
                  className="w-full bg-slate-50 border border-gray-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-[#1a1a1a] placeholder-gray-400 focus:outline-hidden focus:border-black transition-all" />
                {deckSearchQuery && (
                  <button type="button" onClick={() => setDeckSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-black border-0 bg-transparent cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-normal pl-0.5">Practice exercises will test your vocabulary mastery by generating translation quizzes for all words in the workbook.</p>
            </div>

            {quizSyncMessage && (
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-bold animate-fadeIn">
                {quizSyncMessage}
              </div>
            )}
            {quizSyncError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] font-bold animate-fadeIn">
                ⚠️ {quizSyncError}
              </div>
            )}

            <div className="space-y-3.5 pt-1">
              {(() => {
                const isQuizDeck = (deck: Deck) => deck.id.startsWith('github_quiz_');
                const quizDecks = allDecks.some(isQuizDeck) ? allDecks.filter(isQuizDeck) : allDecks;
                const filteredQuizDecks = quizDecks.filter(deck => deck.name.toLowerCase().includes(deckSearchQuery.toLowerCase()));

                if (selectedQuizFolder === null) {
                  // Folder selection mode
                  const uniqueFolders = Array.from(new Set(filteredQuizDecks.map(deck => getDeckFolder(deck, 'quiz'))));

                  if (uniqueFolders.length === 0) {
                    return isSyncingQuiz ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin text-[#0EB880]" />
                        <p className="text-xs font-semibold">Loading decks from GitHub...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center py-8 px-4 space-y-3 bg-slate-50 border border-dashed border-gray-200 rounded-2xl">
                        <p className="text-xs font-bold text-gray-500">No folders found.</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Add <span className="font-mono text-gray-600">.csv</span> files to the{' '}
                          <span className="font-mono text-gray-600">quiz/</span> folder on GitHub, then tap the sync button above.
                        </p>
                        <a href="https://github.com/caioloures/flashcards/tree/main/quiz" target="_blank" rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#2F59EB] hover:underline">
                          Open repository &rarr;
                        </a>
                      </div>
                    );
                  }

                  return uniqueFolders.map((folderName) => {
                    const decksInFolder = filteredQuizDecks.filter(deck => getDeckFolder(deck, 'quiz') === folderName);
                    const totalTerms = decksInFolder.reduce((acc, d) => acc + d.cards.length, 0);
                    const folderKey = 'quiz_' + folderName;
                    const folderColor = folderColors[folderKey] || '#0EB880';

                    return (
                      <div key={folderName} className="relative block">
                        <button
                          onClick={() => setSelectedQuizFolder(folderName)}
                          className="group w-full text-left rounded-2xl p-5 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden flex items-center space-x-4 min-h-[92px] shadow-3xs text-white"
                          style={{ backgroundColor: folderColor }}
                        >
                          <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10 pointer-events-none transition-all duration-300 group-hover:scale-110" />
                          <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-white/15 pointer-events-none" />

                          <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-white/25 relative z-10">
                            <FolderOpen className="w-5 h-5 opacity-95" />
                          </div>

                          <div className="flex-1 min-w-0 relative z-10">
                            <h4 className="text-base font-extrabold text-white truncate tracking-tight font-gotham">
                              {folderName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 font-googlesans text-[10px]">
                              <span className="font-extrabold px-1.5 py-0.5 bg-black/15 text-white rounded-md">
                                {decksInFolder.length} {decksInFolder.length === 1 ? 'set' : 'sets'}
                              </span>
                              <span className="font-semibold px-1.5 py-0.5 bg-white/15 text-white/90 rounded-md">
                                {totalTerms} terms
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Folder Color Picker */}
                        <div className="absolute top-4 right-4 z-20">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setColorPickerFolderKey(prev => prev === folderKey ? null : folderKey);
                            }} 
                            className="p-1 px-1.5 rounded-md bg-white/15 hover:bg-white/25 active:scale-90 text-white transition-all cursor-pointer border-0"
                            title="Change folder color"
                          >
                            <Menu className="w-3.5 h-3.5" />
                          </button>
                          {colorPickerFolderKey === folderKey && (
                            <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl p-2.5 shadow-xl grid grid-cols-6 gap-1.5 z-30 w-52">
                              {DECK_COLORS.map((color) => (
                                <button 
                                  key={color} 
                                  onClick={(e) => handleUpdateFolderColor(folderKey, color, e)}
                                  className="w-6 h-6 rounded-full border border-white cursor-pointer hover:scale-110 active:scale-95 transition-all"
                                  style={{ backgroundColor: color }} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                } else {
                  // Sub-list: Show quiz decks inside selected folder
                  const quizDecksToShow = filteredQuizDecks.filter(deck => getDeckFolder(deck, 'quiz') === selectedQuizFolder);

                  if (quizDecksToShow.length === 0) {
                    return (
                      <div className="text-center py-8 bg-slate-50 border border-dashed border-gray-200 rounded-2xl">
                        <p className="text-xs font-bold text-gray-500">No sets found in this folder matching your search.</p>
                      </div>
                    );
                  }

                  return quizDecksToShow.map((deck) => {
                    const quizStateSaved = localStorage.getItem('easycards_quiz_state_' + deck.id);
                    let qState: any = null;
                    if (quizStateSaved) {
                      try {
                        qState = JSON.parse(quizStateSaved);
                      } catch (e) {}
                    }

                    const quizCompleted = localStorage.getItem('easycards_quiz_completed_' + deck.id) === 'true';
                    const quizStarted = localStorage.getItem('easycards_quiz_started_' + deck.id) === 'true';

                    let setStatusText = "Not Started";
                    let statusColor = "#EF4444";
                    let totalVal = deck.cards.length;
                    let correctVal = 0;
                    let incorrectVal = 0;
                    let newQuestionsVal = totalVal;

                    if (quizCompleted) {
                      setStatusText = "Completed";
                      statusColor = "#10B981";
                      const savedFinalScoreStr = localStorage.getItem('easycards_quiz_final_score_' + deck.id);
                      correctVal = savedFinalScoreStr ? Number(savedFinalScoreStr) : totalVal;
                      incorrectVal = totalVal - correctVal;
                      newQuestionsVal = 0;
                    } else if (qState || quizStarted) {
                      setStatusText = "In Progress";
                      statusColor = "#F59E0B";
                      const questionsCount = (qState && qState.activeQuizQuestions) ? qState.activeQuizQuestions.length : totalVal;
                      totalVal = questionsCount;
                      
                      const currentIndex = (qState && qState.currentQuizQIndex) || 0;
                      const isCurrentAnswered = qState ? qState.selectedQuizOption !== null : false;
                      const answeredCount = currentIndex + (isCurrentAnswered ? 1 : 0);
                      
                      correctVal = qState ? (qState.quizScore || 0) : 0;
                      incorrectVal = answeredCount - correctVal;
                      newQuestionsVal = totalVal - answeredCount;
                    } else {
                      setStatusText = "Not Started";
                      statusColor = "#EF4444";
                      correctVal = 0;
                      incorrectVal = 0;
                      newQuestionsVal = totalVal;
                    }

                    return (
                      <div key={deck.id} className="relative block">
                        <div onClick={() => startQuizGame(deck)}
                          className="group w-full text-left rounded-2xl p-5 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-start min-h-[100px] shadow-3xs text-white"
                          style={{ backgroundColor: deck.color }}>
                          
                          <div className="absolute -right-6 top-0 bottom-0 w-[35%] bg-white/5 -skew-x-12 pointer-events-none transition-all duration-300 group-hover:w-[38%]" />
                          <div className="absolute -right-3 top-0 bottom-0 w-[20%] bg-white/7 -skew-x-12 pointer-events-none" />
                          
                          <div className="relative z-10 space-y-2.5 w-full">
                            <div className="flex items-start gap-2.5">
                              {/* Color picker icon inside the layout on the left */}
                              <div className="relative z-25 mt-1 flex-shrink-0">
                                <button onClick={(e) => handleToggleColorPicker(deck.id, e)} className="p-1 px-1.5 rounded-md bg-white/12 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer border-0" title="Change set color">
                                  <Menu className="w-3.5 h-3.5" />
                                </button>
                                {colorPickerDeckId === deck.id && (
                                  <div className="absolute left-0 top-7 bg-white border border-gray-200 rounded-xl p-2.5 shadow-xl grid grid-cols-6 gap-1.5 z-35 w-52">
                                    {DECK_COLORS.map((color) => (
                                      <button key={color} onClick={(e) => handleUpdateDeckColor(deck.id, color, e)}
                                        className="w-6 h-6 rounded-full border border-white cursor-pointer hover:scale-110 active:scale-95 transition-all"
                                        style={{ backgroundColor: color }} />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight font-gotham break-words">{deck.name}</h4>
                                  <span 
                                    className="inline-flex items-center text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 bg-white shadow-3xs"
                                    style={{ color: statusColor }}
                                  >
                                    <span>{setStatusText}</span>
                                    <span className="w-1.5 h-1.5 rounded-full ml-1.5" style={{ backgroundColor: statusColor }} />
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1.5 pt-1 font-googlesans text-[11px] text-white">
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{totalVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">Total</span>
                              </div>
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{correctVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">Correct</span>
                              </div>
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{incorrectVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">Incorrect</span>
                              </div>
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{newQuestionsVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">New</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                }
              })()}
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: FLASHCARDS INTERACTIVE SWIPING GAME
           ========================================== */}
        {currentScreen === 'flashcard_game' && selectedDeck && (
          <div id="flashcards-game-view" className="flex-1 flex flex-col justify-between space-y-5 min-h-[580px] h-[calc(100vh-120px)] max-h-[730px] w-full max-w-sm mx-auto select-none py-1">
            {/* Standardized White Header Bar */}
            <div className="flex items-center justify-between bg-white h-[50px] px-4 rounded-2xl shadow-3xs animate-fadeIn">
              <div className="flex items-center space-x-3 truncate">
                <button 
                  onClick={() => {
                    setSelectedFlashcardFolder(getDeckFolder(selectedDeck, 'flashcards'));
                    navigateTo('flashcard_list');
                  }}
                  className="w-9 h-9 rounded-full bg-slate-50 border border-gray-150 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 hover:text-black hover:border-black flex-shrink-0"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="truncate text-left">
                  <span className="text-[9px] font-bold text-[#FF7A00] uppercase tracking-wider block leading-none">Flashcards</span>
                  <h3 className="text-sm font-extrabold text-gray-900 truncate leading-tight mt-0.5">{selectedDeck.name}</h3>
                </div>
              </div>
            </div>

            {/* Option Toggles on the same row as Voltar Anterior Button */}
            <div className="flex items-center justify-between w-full min-h-[38px] px-1 mt-[30px]">
              <div className="flex-shrink-0">
                <button 
                  onClick={handleUndoLastAction} 
                  disabled={cardHistoryStack.length === 0}
                  className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold uppercase transition-all flex items-center space-x-1 ${
                    cardHistoryStack.length > 0 
                      ? 'bg-white text-black border-gray-300 hover:border-black active:scale-95 cursor-pointer shadow-3xs' 
                      : 'bg-gray-50/50 text-gray-300 border-gray-200 cursor-not-allowed opacity-40'
                  }`}
                  title="Voltar para a palavra anterior"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Anterior</span>
                </button>
              </div>

              <span className="text-gray-400 font-mono text-[11px] font-semibold text-center select-none">
                Card {currentCardIndex + 1}/{selectedDeck.cards.length}
              </span>

              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button 
                  onClick={() => setIsRandomized(prev => {
                    const newVal = !prev;
                    const indices = Array.from({ length: selectedDeck.cards.length }).map((_, i) => i);
                    const resolved = newVal ? indices.sort(() => Math.random() - 0.5) : indices;
                    setShuffledIndices(resolved);
                    setCurrentCardIndex(0);
                    setIsCardFlipped(false);
                    setCardHistoryStack([]);
                    saveFlashcardProgress(selectedDeck.id, 0, resolved, []);
                    return newVal;
                  })}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    isRandomized 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-black'
                  }`}
                  title="Randomize Cards"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => { setInvertPTEN(prev => !prev); setIsCardFlipped(false); }}
                  className="px-2.5 h-8 rounded-lg border border-gray-200 bg-white hover:border-black text-gray-800 text-[10px] font-black tracking-widest transition-all cursor-pointer flex items-center justify-center font-gotham"
                  title="Invert Language Flow"
                >
                  {invertPTEN ? "EN-PT" : "PT-EN"}
                </button>
              </div>
            </div>

            {(() => {
              const cardItem = getActiveCard();
              if (!cardItem) return <div className="text-center py-6"><p className="text-xs text-gray-400">Word item not found in deck.</p></div>;

              const frontText = invertPTEN ? cardItem.english : cardItem.portuguese;
              const backText = invertPTEN ? cardItem.portuguese : cardItem.english;
              const backMeaningText = cardItem.meaning || cardItem.englishExample || cardItem.portugueseExample || "";
              const cardBgColor = !isCardFlipped ? '#fbfbfc' : selectedDeck.color;
              
              const baseShadow = 'shadow-[0_20px_40px_-8px_rgba(0,0,0,0.11),0_4px_14px_-4px_rgba(0,0,0,0.04)] border border-slate-100/70';
              let shadowClass = `${baseShadow} ${!isCardFlipped ? 'bg-white' : ''}`;
              let badgeLabel = '';
              if (swipeFeedback === 'left') { 
                shadowClass = `shadow-[0_25px_50px_-12px_rgba(239,68,68,0.3)] ring-4 ring-red-500/15 border-red-200 ${!isCardFlipped ? 'bg-white' : ''}`; 
                badgeLabel = 'REVIEW (STILL LEARNING)'; 
              } else if (swipeFeedback === 'right') { 
                shadowClass = `shadow-[0_25px_50px_-12px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/15 border-emerald-200 ${!isCardFlipped ? 'bg-white' : ''}`; 
                badgeLabel = 'KNOW (MASTERED)'; 
              }

              return (
                <div className="flex-grow flex flex-col justify-between space-y-4 w-full h-full">
                  {/* Card com largura igual e altura responsiva adaptável */}
                  <div
                    id="flashcard-swipeable-element"
                    ref={cardRef}
                    className={`w-full max-w-[320px] flex-grow flex flex-col justify-center items-center min-h-[170px] max-h-[370px] mx-auto rounded-3xl cursor-grab active:cursor-grabbing relative select-none overflow-hidden touch-none border border-gray-200/80 ${shadowClass}`}
                    style={{ 
                      backgroundColor: cardBgColor,
                      transition: isDraggingCard ? 'none' : 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms, border-color 150ms, box-shadow 150ms'
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {/* Badge de swipe */}
                    {badgeLabel && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/20 px-3 py-1 rounded-full text-[12px] font-black text-white tracking-wider z-50">
                        {badgeLabel}
                      </div>
                    )}

                    {/* Botão de pronúncia */}
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); playPronunciation(cardItem.english, e); }}
                      className={`absolute top-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white shadow-sm hover:scale-105 active:scale-95 border cursor-pointer border-gray-200/60 ${
                        playState[cardItem.english.trim().toLowerCase().replace(/^to\s+/i, '')] === 'playing' ? 'text-[#2f59eb] bg-blue-50 border-[#2f59eb] animate-pulse ring-2 ring-blue-100'
                        : playState[cardItem.english.trim().toLowerCase().replace(/^to\s+/i, '')] === 'loading' ? 'text-amber-600 bg-amber-50 border-amber-300'
                        : 'text-gray-700 hover:text-black'}`}>
                      {playState[cardItem.english.trim().toLowerCase().replace(/^to\s+/i, '')] === 'loading'
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Conteúdo clicável — perfeitamente centralizado verticalmente */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer outline-none w-full h-full px-6"
                    >
                      {(() => {
                        const isShowingEnglishSide = (!isCardFlipped && invertPTEN) || (isCardFlipped && !invertPTEN);
                        const isWhiteBackground = !isCardFlipped;
                        const textColor = isWhiteBackground ? 'text-[#1a1a1a]' : 'text-white';
                        const subTextColor = isWhiteBackground ? 'text-gray-550' : 'text-white/90';

                        if (isShowingEnglishSide) {
                          // English Side Info
                          const displayWord = cardItem.english || '';
                          const displayEx1 = cardItem.example1 || cardItem.englishExample || '';
                          const displayEx2 = cardItem.example2 || '';

                          return (
                            <div className="select-none pointer-events-none flex flex-col items-center w-full animate-fadeIn text-center space-y-2">
                              {/* Word */}
                              <h2 className={`font-quicksand text-[28px] font-bold ${textColor} tracking-tight leading-tight`}>
                                {displayWord}
                              </h2>

                              {/* Separator line when examples exist */}
                              {(displayEx1 || displayEx2) && (
                                <div className={`w-16 h-[1.5px] ${isWhiteBackground ? 'bg-gray-200' : 'bg-white/35'} rounded-full my-2`} />
                              )}

                              {/* Example 1 */}
                              {displayEx1 && (
                                <p className={`text-[14.5px] ${subTextColor} font-medium font-sans leading-relaxed max-w-[90%] italic pt-1`}>
                                  {displayEx1}
                                </p>
                              )}

                              {/* Example 2 */}
                              {displayEx2 && (
                                <p className={`text-[14.5px] ${subTextColor} font-medium font-sans leading-relaxed max-w-[90%] italic mt-1`}>
                                  {displayEx2}
                                </p>
                              )}
                            </div>
                          );
                        } else {
                          // Portuguese Side Info
                          const displayWord = cardItem.portuguese || '';
                          const displayEx1 = cardItem.translationE1 || cardItem.portugueseExample || '';
                          const displayEx2 = cardItem.translationE2 || '';

                          return (
                            <div className="select-none pointer-events-none flex flex-col items-center w-full animate-fadeIn text-center space-y-2">
                              {/* Translation */}
                              <h2 className={`font-quicksand text-[28px] font-bold ${textColor} tracking-tight leading-tight`}>
                                {displayWord}
                              </h2>

                              {/* Separator line when examples exist */}
                              {(displayEx1 || displayEx2) && (
                                <div className={`w-16 h-[1.5px] ${isWhiteBackground ? 'bg-gray-200' : 'bg-white/35'} rounded-full my-2`} />
                              )}

                              {/* Translation E1 */}
                              {displayEx1 && (
                                <p className={`text-[14.5px] ${subTextColor} font-medium font-sans leading-relaxed max-w-[90%] italic pt-1`}>
                                  {displayEx1}
                                </p>
                              )}

                              {/* Translation E2 */}
                              {displayEx2 && (
                                <p className={`text-[14.5px] ${subTextColor} font-medium font-sans leading-relaxed max-w-[90%] italic mt-1`}>
                                  {displayEx2}
                                </p>
                              )}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2 pt-1 font-sans max-w-full w-full flex-shrink-0 px-2">
                    <button onClick={() => triggerSwipeAction('review')}
                      className="bg-transparent hover:bg-black/5 text-[#FF7A00] rounded-2xl border border-[#FF7A00] transition-all flex flex-col items-center justify-center p-3 active:scale-95 cursor-pointer space-y-0.5">
                      <div className="flex items-center text-xs font-bold uppercase tracking-wide"><X className="w-5 h-5 mr-1 text-[#FF7A00]" /><span>still learning</span></div>
                      <span className="text-[14px] font-extrabold font-mono text-[#FF7A00]">{getDeckStats(selectedDeck).stillLearning}</span>
                    </button>
                    <button onClick={() => triggerSwipeAction('know')}
                      className="bg-transparent hover:bg-black/5 text-[#10B981] rounded-2xl border border-[#10B981] transition-all flex flex-col items-center justify-center p-3 active:scale-95 cursor-pointer space-y-0.5">
                      <div className="flex items-center text-xs font-bold uppercase tracking-wide"><Check className="w-5 h-5 mr-1 text-[#10B981]" /><span>i know this one</span></div>
                      <span className="text-[14px] font-extrabold font-mono text-[#10B981]">{getDeckStats(selectedDeck).learned}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==========================================
            SCREEN: QUIZ ACTIVE GAME AREA 
           ========================================== */}
        {currentScreen === 'quiz_game' && selectedDeck && (
          <div id="quiz-exercise-active-view" className="flex-1 flex flex-col justify-between space-y-5 min-h-[580px] h-[calc(100vh-120px)] max-h-[730px] w-full max-w-sm mx-auto select-none py-1">
            {/* Standardized White Header Bar */}
            <div className="flex items-center justify-between bg-white h-[50px] px-4 rounded-2xl shadow-3xs animate-fadeIn">
              <div className="flex items-center space-x-3 truncate">
                <button 
                  onClick={() => {
                    setSelectedQuizFolder(getDeckFolder(selectedDeck, 'quiz'));
                    navigateTo('quiz_list');
                  }}
                  className="w-9 h-9 rounded-full bg-slate-50 border border-gray-150 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 hover:text-black hover:border-black flex-shrink-0"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="truncate text-left">
                  <span className="text-[9px] font-bold text-[#10B981] uppercase tracking-wider block leading-none">Quiz Practice</span>
                  <h3 className="text-sm font-extrabold text-gray-900 truncate leading-tight mt-0.5">{selectedDeck.name}</h3>
                </div>
              </div>
              <div className="text-right text-xs font-bold font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg flex-shrink-0">
                Score: <span className="font-extrabold text-emerald-600">{quizScore}</span>/{activeQuizQuestions.length}
              </div>
            </div>

            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2 mt-[30px]">
              <div className="h-full transition-all duration-300" style={{ width: `${((currentQuizQIndex + (selectedQuizOption !== null ? 1 : 0)) / activeQuizQuestions.length) * 100}%`, backgroundColor: '#70EC7C' }} />
            </div>

            {!quizFinished && activeQuizQuestions.length > 0 ? (() => {
              const currentQuestion = activeQuizQuestions[currentQuizQIndex];
              const wasAnswered = selectedQuizOption !== null;
              return (
                <div className="flex-grow flex flex-col justify-between space-y-4 w-full h-full">
                  <div className="w-full max-w-[320px] flex-grow flex flex-col justify-center items-center min-h-[140px] max-h-[220px] mx-auto bg-white rounded-3xl p-6 text-center shadow-[0_20px_40px_-8px_rgba(0,0,0,0.11),0_4px_14px_-4px_rgba(0,0,0,0.04)] border border-slate-100/70 select-none transition-all duration-200">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">Question {currentQuizQIndex + 1} of {activeQuizQuestions.length}</span>
                    <h3 className="text-[20px] font-bold text-black leading-tight" style={{ fontFamily: 'var(--font-quicksand)' }}>{currentQuestion.prompt}</h3>
                  </div>

                  {/* Explanation / Rule directly beneath the question card and above the options */}
                  {wasAnswered && currentQuestion.explanation && (
                    <div className="w-full max-w-[320px] mx-auto bg-blue-50 border border-blue-150 rounded-xl p-3 text-sm text-blue-800 font-medium leading-relaxed font-sans text-justify animate-fadeIn">
                      {currentQuestion.explanation}
                    </div>
                  )}

                  <div className="space-y-2.5 font-sans max-w-[320px] mx-auto w-full flex-shrink-0">
                    {currentQuestion.options.map((option, idx) => {
                      const isOptionSelected = selectedQuizOption === option;
                      const isCorrectOption = option === currentQuestion.correctAnswer;
                      let optionStyle = "bg-white border-gray-200 hover:border-gray-400 text-gray-850";
                      if (wasAnswered) {
                        if (isCorrectOption) optionStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold";
                        else if (isOptionSelected) optionStyle = "bg-red-50 border-red-400 text-red-950 font-semibold";
                        else optionStyle = "bg-gray-100/60 border-transparent text-gray-400 opacity-60";
                      }
                      return (
                        <button key={idx} onClick={() => handleSelectQuizAnswer(option)} disabled={wasAnswered}
                          className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all text-sm sm:text-base flex items-center justify-between font-semibold ${!wasAnswered ? 'active:scale-99 hover:shadow-2xs cursor-pointer' : ''} ${optionStyle}`}>
                          <span>{option}</span>
                          {wasAnswered && (isCorrectOption ? <Check className="w-4.5 h-4.5 text-emerald-500 stroke-[3]" /> : isOptionSelected ? <X className="w-4.5 h-4.5 text-red-500 stroke-[3]" /> : null)}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-col items-center pt-1.5 space-y-2.5 max-w-[320px] mx-auto w-full flex-shrink-0">
                    {wasAnswered && (
                      <div className="text-xs text-center font-medium leading-relaxed italic">
                        {selectedQuizOption === currentQuestion.correctAnswer
                          ? <span className="text-emerald-500 font-bold">Excellent! Correct choice! 🎉</span>
                          : <span className="text-red-500 font-bold">Correct was: "{currentQuestion.correctAnswer}"</span>}
                      </div>
                    )}

                    <button onClick={handleNextQuizQuestion} disabled={!wasAnswered}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm text-center flex items-center justify-center transition-all ${wasAnswered ? 'bg-black text-white hover:bg-slate-900 cursor-pointer shadow-sm active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent'}`}>
                      <span>{currentQuizQIndex === activeQuizQuestions.length - 1 ? 'Finish Exercise' : 'Next Question'}</span>
                    </button>
                  </div>
                </div>
              );
            })() : (
              <div className="w-full max-w-[320px] flex-grow flex flex-col justify-center items-center min-h-[300px] max-h-[500px] mx-auto bg-white rounded-3xl p-6 text-center space-y-5 shadow-[0_20px_40px_-8px_rgba(0,0,0,0.11),0_4px_14px_-4px_rgba(0,0,0,0.04)] border border-slate-100/70 animate-fadeIn mt-[30px]">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100"><Award className="w-6 h-6 text-emerald-500" /></div>
                <div className="space-y-1"><h3 className="text-xl font-extrabold text-black tracking-tight">Quiz Completed!</h3><p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Results Summary</p></div>
                <div className="bg-slate-50 py-4 px-5 rounded-2xl w-full border border-gray-200 border-dashed space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Your final score</span>
                  <p className="text-2xl font-black text-gray-900 font-mono">{quizScore} / {activeQuizQuestions.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-bold">{((quizScore / activeQuizQuestions.length) * 100).toFixed(0)}% accuracy rate</p>
                </div>
                <div className="w-full space-y-2">
                  <button onClick={() => startQuizGame(selectedDeck)} className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm tracking-wide shadow-sm hover:bg-slate-900 transition-all active:scale-95 cursor-pointer border-0">
                    Try Again
                  </button>
                  <button onClick={() => navigateTo('home')} className="w-full py-2.5 text-slate-500 border border-gray-200 hover:border-gray-300 rounded-xl font-bold text-xs transition-all cursor-pointer bg-transparent">
                    Back to Homepage
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            SCREEN: GUESS DECK SELECTOR LIST
           ========================================== */}
        {currentScreen === 'guess_list' && (
          <div id="guess-list-view" className="space-y-5">
            {/* Sticky Header Container */}
            <div className="sticky top-[30px] bg-white z-20 pb-3 space-y-4 border-b border-gray-100/60">
              <div className="flex justify-between items-center h-[50px] pb-1">
                <button 
                  onClick={() => {
                    if (selectedGuessFolder) {
                      setSelectedGuessFolder(null);
                    } else {
                      navigateTo('home');
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 shadow-sm hover:border-black"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <h3 className="text-lg font-black font-googlesans text-[#8B5CF6]">Learn</h3>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-wider">Select a Vocabulary Set</span>
                </div>

                <button
                  onClick={() => syncDecksFromGitHub(false)}
                  disabled={isGithubSyncing}
                  title="Sync from GitHub"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 shadow-sm hover:border-black disabled:opacity-40"
                >
                  {isGithubSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              </div>

              {/* Integrated Search Bar */}
              <div className="relative mt-[30px]">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text"
                  value={deckSearchQuery}
                  onChange={(e) => setDeckSearchQuery(e.target.value)}
                  placeholder="Search vocabulary sets..."
                  className="w-full bg-slate-50 border border-gray-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-[#1a1a1a] placeholder-gray-400 focus:outline-hidden focus:border-black transition-all"
                />
                {deckSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDeckSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-black border-0 bg-transparent cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-normal pl-0.5">
                Select a book of vocabulary terms. You will be prompted to translate words and learn. Use clues if you need direction!
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {(() => {
                const flashcardDecks = allDecks.filter(deck => !deck.id.startsWith('github_quiz_'));
                const filteredDecks = flashcardDecks.filter(deck => deck.name.toLowerCase().includes(deckSearchQuery.toLowerCase()));

                if (selectedGuessFolder === null) {
                  // Folder selection mode
                  const uniqueFolders = Array.from(new Set(filteredDecks.map(deck => getDeckFolder(deck, 'flashcards'))));

                  if (uniqueFolders.length === 0) {
                    return isAutoSyncing ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" />
                        <p className="text-xs font-semibold">Loading decks from GitHub...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center py-8 px-4 space-y-3 bg-slate-50 border border-dashed border-gray-200 rounded-2xl">
                        <p className="text-xs font-bold text-gray-500">No folders found.</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Add <span className="font-mono text-gray-600">.csv</span> files to the{' '}
                          <span className="font-mono text-gray-600">flashcards/</span> folder on GitHub, then tap the sync button above.
                        </p>
                        <a href="https://github.com/caioloures/flashcards/tree/main/flashcards" target="_blank" rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#2F59EB] hover:underline">
                          Open repository &rarr;
                        </a>
                      </div>
                    );
                  }

                  return uniqueFolders.map((folderName) => {
                    const decksInFolder = filteredDecks.filter(deck => getDeckFolder(deck, 'flashcards') === folderName);
                    const totalTerms = decksInFolder.reduce((acc, d) => acc + d.cards.length, 0);
                    const folderKey = 'guess_' + folderName;
                    const folderColor = folderColors[folderKey] || '#8B5CF6';

                    return (
                      <div key={folderName} className="relative block">
                        <button
                          onClick={() => setSelectedGuessFolder(folderName)}
                          className="group w-full text-left rounded-2xl p-5 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden flex items-center space-x-4 min-h-[92px] shadow-3xs text-white"
                          style={{ backgroundColor: folderColor }}
                        >
                          <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10 pointer-events-none transition-all duration-300 group-hover:scale-110" />
                          <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-white/15 pointer-events-none" />

                          <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-white/25 relative z-10">
                            <FolderOpen className="w-5 h-5 opacity-95" />
                          </div>

                          <div className="flex-1 min-w-0 relative z-10">
                            <h4 className="text-base font-extrabold text-white truncate tracking-tight font-gotham">
                              {folderName}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 font-googlesans text-[10px]">
                              <span className="font-extrabold px-1.5 py-0.5 bg-black/15 text-white rounded-md">
                                {decksInFolder.length} {decksInFolder.length === 1 ? 'set' : 'sets'}
                              </span>
                              <span className="font-semibold px-1.5 py-0.5 bg-white/15 text-white/90 rounded-md">
                                {totalTerms} terms
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Folder Color Picker */}
                        <div className="absolute top-4 right-4 z-20">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setColorPickerFolderKey(prev => prev === folderKey ? null : folderKey);
                            }} 
                            className="p-1 px-1.5 rounded-md bg-white/15 hover:bg-white/25 active:scale-90 text-white transition-all cursor-pointer border-0"
                            title="Change folder color"
                          >
                            <Menu className="w-3.5 h-3.5" />
                          </button>
                          {colorPickerFolderKey === folderKey && (
                            <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl p-2.5 shadow-xl grid grid-cols-6 gap-1.5 z-30 w-52">
                              {DECK_COLORS.map((color) => (
                                <button 
                                  key={color} 
                                  onClick={(e) => handleUpdateFolderColor(folderKey, color, e)}
                                  className="w-6 h-6 rounded-full border border-white cursor-pointer hover:scale-110 active:scale-95 transition-all"
                                  style={{ backgroundColor: color }} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                } else {
                  // Sub-list: Show guess decks inside selected folder
                  const guessDecksToShow = filteredDecks.filter(deck => getDeckFolder(deck, 'flashcards') === selectedGuessFolder);

                  if (guessDecksToShow.length === 0) {
                    return (
                      <div className="text-center py-8 bg-slate-50 border border-dashed border-gray-200 rounded-2xl">
                        <p className="text-xs font-bold text-gray-500">No sets found in this folder matching your search.</p>
                      </div>
                    );
                  }

                  return guessDecksToShow.map((deck) => {
                    const stats = getDeckStats(deck);
                    const totalVal = stats.total;
                    const learnedVal = stats.completed;
                    const learningVal = stats.inProgress;
                    const notReviewedVal = stats.notStarted;

                    let setStatusText = "Not Started";
                    let statusColor = "#EF4444";
                    if (totalVal > 0) {
                      if (learnedVal === totalVal) {
                        setStatusText = "Completed";
                        statusColor = "#10B981";
                      } else if (notReviewedVal === totalVal) {
                        setStatusText = "Not Started";
                        statusColor = "#EF4444";
                      } else {
                        setStatusText = "In Progress";
                        statusColor = "#F59E0B";
                      }
                    }

                    return (
                      <div key={deck.id} className="relative block">
                        <div onClick={() => startGuessGame(deck)}
                          className="group w-full text-left rounded-2xl p-5 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-start min-h-[100px] shadow-3xs text-white"
                          style={{ backgroundColor: deck.color }}>
                          
                          <div className="absolute -right-6 top-0 bottom-0 w-[35%] bg-white/5 -skew-x-12 pointer-events-none transition-all duration-300 group-hover:w-[38%]" />
                          <div className="absolute -right-3 top-0 bottom-0 w-[20%] bg-white/7 -skew-x-12 pointer-events-none" />
                          
                          <div className="relative z-10 space-y-2.5 w-full">
                            <div className="flex items-start gap-2.5">
                              {/* Color picker icon inside the layout on the left */}
                              <div className="relative z-25 mt-1 flex-shrink-0">
                                <button onClick={(e) => handleToggleColorPicker(deck.id, e)} className="p-1 px-1.5 rounded-md bg-white/12 hover:bg-white/25 active:scale-90 text-white transition-all cursor-pointer border-0" title="Change set color">
                                  <Menu className="w-3.5 h-3.5" />
                                </button>
                                {colorPickerDeckId === deck.id && (
                                  <div className="absolute left-0 top-7 bg-white border border-gray-200 rounded-xl p-2.5 shadow-xl grid grid-cols-6 gap-1.5 z-35 w-52">
                                    {DECK_COLORS.map((color) => (
                                      <button key={color} onClick={(e) => handleUpdateDeckColor(deck.id, color, e)}
                                        className="w-6 h-6 rounded-full border border-white cursor-pointer hover:scale-110 active:scale-95 transition-all"
                                        style={{ backgroundColor: color }} />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight font-gotham break-words">{deck.name}</h4>
                                  <span 
                                    className="inline-flex items-center text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 bg-white shadow-3xs"
                                    style={{ color: statusColor }}
                                  >
                                    <span>{setStatusText}</span>
                                    <span className="w-1.5 h-1.5 rounded-full ml-1.5" style={{ backgroundColor: statusColor }} />
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1.5 pt-1 font-googlesans text-[11px] text-white">
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{totalVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">Total</span>
                              </div>
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{learnedVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">Learned</span>
                              </div>
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{learningVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">Learning</span>
                              </div>
                              <div className="px-2 py-1.5 bg-white/8 rounded-md text-center border border-white/5">
                                <span className="block font-black text-[13px] leading-none mb-0.5">{notReviewedVal}</span>
                                <span className="text-[9px] opacity-80 uppercase leading-none">New</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                }
              })()}
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: GUESS ACTIVE GAME
           ========================================== */}
        {currentScreen === 'guess_game' && selectedDeck && activeGuessQuestions.length > 0 && (
          <div id="guess-game-view" className="flex-1 flex flex-col justify-between space-y-5 min-h-[580px] h-[calc(100vh-120px)] max-h-[730px] w-full max-w-sm mx-auto select-none py-1">
            {/* Standardized White Header Bar */}
            <div className="flex items-center justify-between bg-white h-[50px] px-4 rounded-2xl shadow-3xs animate-fadeIn select-none">
              <div className="flex items-center space-x-3 truncate">
                <button 
                  onClick={() => {
                    setSelectedGuessFolder(getDeckFolder(selectedDeck, 'flashcards'));
                    navigateTo('guess_list');
                  }}
                  className="w-9 h-9 rounded-full bg-slate-50 border border-gray-150 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 hover:text-black hover:border-black flex-shrink-0"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="truncate text-left">
                  <span className="text-[9px] font-bold text-[#8B5CF6] uppercase tracking-wider block leading-none">Learn</span>
                  <h3 className="text-sm font-extrabold text-gray-900 truncate leading-tight mt-0.5">{selectedDeck.name}</h3>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-purple-50 border border-purple-100 rounded-lg text-[10px] font-bold text-[#8B5CF6] font-mono flex-shrink-0">
                {currentGuessIndex + 1}/{activeGuessQuestions.length}
              </div>
            </div>

            {!guessFinished ? (
              <div className="flex-grow flex flex-col justify-between space-y-4 w-full h-full mt-[30px]">
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ width: `${((currentGuessIndex + 1)/ activeGuessQuestions.length) * 100}%`, backgroundColor: '#70EC7C' }}
                  />
                </div>

                <div className="w-full max-w-[320px] flex-grow flex flex-col justify-center items-center min-h-[120px] max-h-[195px] mx-auto bg-white rounded-3xl p-5 text-center shadow-[0_20px_40px_-8px_rgba(0,0,0,0.11),0_4px_14px_-4px_rgba(0,0,0,0.04)] border border-slate-100/70 select-none animate-fadeIn transition-all duration-200 space-y-3">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-extrabold block">TRANSLATE THE WORD:</span>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-normal font-sans">
                    {activeGuessQuestions[currentGuessIndex].portuguese}
                  </h3>
                  
                  {activeGuessQuestions[currentGuessIndex].portugueseExample && (
                    <p className="text-xs text-gray-400 italic max-w-xs mx-auto text-center leading-relaxed line-clamp-2">
                      "{activeGuessQuestions[currentGuessIndex].portugueseExample}"
                    </p>
                  )}
                </div>

                <div className="space-y-4 max-w-[320px] mx-auto w-full flex-shrink-0">
                  <div className="text-center space-y-0.5 bg-purple-50/50 border border-purple-100/50 rounded-2xl py-2 px-3">
                    <span className="text-[9px] uppercase font-bold text-[#8B5CF6] tracking-wider block">CLUE / English Word Structure:</span>
                    <p className="text-sm font-black tracking-widest text-[#5e4797] font-mono select-none">
                      {getGuessWordClue(activeGuessQuestions[currentGuessIndex].english, guessHintsUsedCount)}
                    </p>
                  </div>

                  <form onSubmit={handleGuessSubmit} className="space-y-3 w-full animate-fadeIn">
                    <div className="relative">
                      <input 
                        type="text"
                        value={guessInput}
                        onChange={(e) => {
                          setGuessInput(e.target.value);
                          if (guessFeedback === 'wrong') {
                            setGuessFeedback('idle');
                          }
                        }}
                        placeholder="Type English translation..."
                        disabled={guessFeedback === 'correct' || guessShowCorrectWord}
                        className={`w-full bg-slate-50 border rounded-xl p-4 text-sm transition-all text-center focus:outline-none font-bold ${
                          guessFeedback === 'correct'
                            ? 'border-[#0EB880] text-[#0EB880] bg-green-50 focus:border-[#0EB880]'
                            : guessFeedback === 'wrong'
                            ? 'border-red-400 text-red-600 bg-red-50 focus:border-red-400'
                            : 'border-gray-200 focus:border-black text-[#1a1a1a]'
                        }`}
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                    </div>

                    {guessFeedback === 'correct' && (
                      <p className="text-xs font-black text-[#00c853] text-center tracking-wide animate-pulse">
                        ✓ EXCELLENT! That's correct!
                      </p>
                    )}

                    {guessFeedback === 'wrong' && (
                      <p className="text-xs font-bold text-red-500 text-center tracking-wide">
                        Try again! Review spelling or use a Hint.
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {guessFeedback === 'correct' || guessShowCorrectWord ? (
                        <button
                          type="button"
                          onClick={handleNextGuessQuestion}
                          className="col-span-2 py-4 bg-black text-white hover:bg-slate-900 rounded-xl font-bold text-sm tracking-wide transition-all shadow-sm active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer border-0"
                        >
                          <span>{currentGuessIndex + 1 === activeGuessQuestions.length ? 'Finish Game' : 'Next Question'}</span>
                          <span>&rarr;</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleGuessHint}
                            disabled={guessHintsUsedCount >= activeGuessQuestions[currentGuessIndex].english.replace(/[^a-zA-Z]/g, '').length}
                            className="py-3.5 bg-purple-100 text-[#8B5CF6] hover:bg-purple-200 disabled:opacity-40 rounded-xl font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 border-0"
                          >
                            <span>💡 Hint ({guessHintsUsedCount})</span>
                          </button>

                          <button
                            type="submit"
                            className="py-3.5 bg-black text-white hover:bg-slate-900 rounded-xl font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 border-0"
                          >
                            <span>Verify Answer</span>
                          </button>
                        </>
                      )}
                    </div>

                    {guessFeedback !== 'correct' && !guessShowCorrectWord && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setGuessShowCorrectWord(true);
                            if (selectedDeck) {
                              saveGuessProgress(selectedDeck.id, activeGuessQuestions, currentGuessIndex, guessInput, guessFeedback, guessHintsUsedCount, true, guessScore, false);
                            }
                          }}
                          className="text-[10px] font-bold text-gray-400 hover:text-gray-650 hover:underline cursor-pointer bg-transparent border-0"
                        >
                          Give up? See correct answer
                        </button>
                      </div>
                    )}

                    {guessShowCorrectWord && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1 mt-2">
                        <p className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wide">Correct Answer:</p>
                        <p className="text-sm font-black text-amber-900 font-mono select-all font-semibold">
                          {activeGuessQuestions[currentGuessIndex].english}
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[320px] flex-grow flex flex-col justify-center items-center min-h-[300px] max-h-[500px] mx-auto bg-white rounded-3xl p-6 text-center space-y-5 shadow-[0_20px_40px_-8px_rgba(0,0,0,0.11),0_4px_14px_-4px_rgba(0,0,0,0.04)] border border-slate-100/70 animate-fadeIn py-8 font-sans mt-[30px]">
                <div className="w-14 h-14 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Award className="w-7 h-7 text-[#8B5CF6]" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight font-gotham">Game Finished!</h3>
                  <p className="text-xs text-gray-400 font-medium">Excellent vocabulary translation session</p>
                </div>

                <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/15 rounded-2xl py-3.5 px-3 max-w-xs mx-auto w-full">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">YOUR RESULT</span>
                  <p className="text-3xl font-extrabold text-[#8B5CF6] tracking-tight font-mono">
                    {guessScore} / {activeGuessQuestions.length}
                  </p>
                  <p className="text-xs text-[#5e4797] mt-0.5 font-bold">
                    {((guessScore / activeGuessQuestions.length) * 100).toFixed(0)}% correctness
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <button 
                    onClick={() => startGuessGame(selectedDeck)}
                    className="w-full py-3 bg-black text-white rounded-xl font-bold text-xs tracking-wide shadow-sm hover:bg-slate-900 transition-all active:scale-95 cursor-pointer border-0"
                  >
                    Play Again
                  </button>

                  <button 
                    onClick={() => navigateTo('home')}
                    className="w-full py-2.5 text-slate-500 border border-gray-200 hover:border-gray-300 rounded-xl font-bold text-xs transition-all cursor-pointer bg-transparent"
                  >
                    Back to Homepage
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            SCREEN: USER PROFILE & SETTINGS
           ========================================== */}
        {currentScreen === 'profile' && (
          <div id="profile-screen-view" className="space-y-5 animate-fadeIn pb-12 font-sans text-center">
            
            <div className="flex justify-between items-center h-[50px] pb-1 text-left">
              <button 
                onClick={() => navigateTo('home')}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer text-gray-600 shadow-sm hover:border-gray-300 flex-none"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="text-center w-full">
                <h3 className="text-base font-extrabold text-black font-gotham">My Profile</h3>
                <span className="text-[10px] text-gray-400 font-semibold tracking-wider">Preferences</span>
              </div>

              <div className="w-10 h-10 flex-none" />
            </div>

            {resetFeedback && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-3 rounded-2xl font-bold animate-fadeIn mt-[30px]">
                {resetFeedback}
              </div>
            )}

            <div className={`bg-white border border-gray-200 hover:border-gray-300 transition-all rounded-2xl p-6 shadow-xs space-y-4 ${resetFeedback ? 'mt-4' : 'mt-[30px]'}`}>
              {/* Avatar Showcase */}
              <div className="relative w-20 h-20 mx-auto rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                <img 
                  src={avatarSeed.startsWith('http') ? avatarSeed : `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${encodeURIComponent(avatarSeed)}`}
                  alt="My Unique Notionist Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Profile Details */}
              <div>
                <span className="text-[10px] font-bold text-[#2F59EB] uppercase tracking-widest font-gotham">Active Student</span>
                <h4 className="text-xl font-black text-gray-950 font-gotham mt-0.5">{sessionName || 'Student'}</h4>
                <p className="text-xs text-gray-400/80 font-mono">@{sessionUser}</p>
              </div>

              {/* Avatar Customization Subsection */}
              <div className="border-t border-slate-100/80 pt-4 text-left space-y-3.5">
                <button
                  type="button"
                  onClick={() => setShowAvatarPreset(!showAvatarPreset)}
                  className="w-full flex items-center justify-between text-left focus:outline-hidden cursor-pointer group"
                >
                  <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5 font-gotham">Avatar Customization</h6>
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#2F59EB]">
                    <span>{showAvatarPreset ? 'Hide Options' : 'Show Options'}</span>
                    {showAvatarPreset ? <ChevronUp className="w-3.5 h-3.5 text-[#2F59EB]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#2F59EB]" />}
                  </div>
                </button>

                {showAvatarPreset && (
                  <div className="space-y-3.5 pt-1 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5 font-gotham">Avatar Character Preset</h6>
                      <button 
                        type="button"
                        onClick={() => {
                          const randomKeywords = ['Ryan', 'Luna', 'Koby', 'Skyler', 'Zane', 'Maya', 'Sienna', 'Asher', 'Clara', 'Jasper', 'Finn', 'Nico'];
                          const randomChoice = randomKeywords[Math.floor(Math.random() * randomKeywords.length)] + '_' + Math.floor(Math.random() * 900 + 100);
                          setAvatarSeed(randomChoice);
                          localStorage.setItem('easycards_user_avatar', randomChoice);
                        }}
                        className="flex items-center space-x-1.5 text-[10px] font-bold text-[#2F59EB] hover:text-blue-700 bg-transparent border-0 cursor-pointer transition-all"
                      >
                        <Sparkles className="w-3 h-3 text-[#2F59EB]" />
                        <span>Randomize</span>
                      </button>
                    </div>

                    {/* Seed Input Field */}
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={avatarSeed}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAvatarSeed(val);
                          localStorage.setItem('easycards_user_avatar', val);
                        }}
                        placeholder="Type words to morph avatar live..."
                        className="w-full bg-slate-50 border border-gray-200/80 rounded-xl py-2 px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#2F59EB] transition-all"
                      />
                      <span className="text-[9px] text-gray-400 font-medium block leading-normal pl-1">
                        Every keypress generates a unique notionist visual! Try typing your nick.
                      </span>
                    </div>

                    {/* Quick Selection Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {['Alexander', 'Isabella', 'Sienna', 'Gabriel', 'Winston', 'Macy'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setAvatarSeed(preset);
                            localStorage.setItem('easycards_user_avatar', preset);
                          }}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer transition-all ${
                            avatarSeed === preset 
                              ? 'bg-blue-50 border-[#2F59EB] text-[#2F59EB]' 
                              : 'bg-white border-gray-150 text-gray-500 hover:border-gray-250'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 text-left">
              {/* Backup & Cloud Sync Panel */}
              <div className="bg-white border border-gray-200 hover:border-gray-300 transition-all rounded-2xl p-5 shadow-xs space-y-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImportFullBackupFile} 
                  accept=".json" 
                  className="hidden" 
                />
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2F59EB] flex-none">
                    <Cloud className="w-5 h-5 text-[#2F59EB]" />
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-[#1a1a1a] font-gotham">Backup & Sync</h5>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Username: @{sessionUser}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed pl-0.5">
                  Save your settings, folder colors, customized folders, and English vocabulary study history safely to the cloud under your username.
                </p>

                {/* Auto Sync Toggle */}
                <label id="auto-sync-toggle-label" className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer select-none">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-900 font-gotham">Real-time Cloud Sync</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 font-medium">Auto-syncs after any progress update</span>
                  </div>
                  <div className="relative inline-flex items-center">
                    <input 
                      type="checkbox" 
                      checked={autoCloudSync} 
                      onChange={(e) => setAutoCloudSync(e.target.checked)} 
                      className="sr-only peer" 
                      id="auto_cloud_sync_checkbox"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </div>
                </label>

                {/* Status Messaging */}
                {isCloudSyncing && (
                  <div id="cloud-syncing-msg" className="flex items-center space-x-2 p-2.5 px-3.5 bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold rounded-xl animate-fadeIn">
                    <Loader2 className="w-4 h-4 animate-spin text-[#2F59EB]" />
                    <span>{cloudSyncMessage || 'Syncing...'}</span>
                  </div>
                )}
                {!isCloudSyncing && cloudSyncMessage && (
                  <div id="cloud-success-msg" className="flex items-center space-x-2 p-2.5 px-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{cloudSyncMessage}</span>
                  </div>
                )}
                {!isCloudSyncing && cloudSyncError && (
                  <div id="cloud-error-msg" className="flex items-center space-x-2 p-2.5 px-3.5 bg-red-50 border border-red-100 text-red-800 text-xs font-bold rounded-xl animate-fadeIn">
                    <X className="w-4 h-4 text-red-600" />
                    <span>{cloudSyncError}</span>
                  </div>
                )}

                {/* Last Sync Info */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold font-mono pl-0.5 border-t border-slate-100 pt-3">
                  <span>CLOUD DATA DISCOVERY</span>
                  <span>Last sync: {lastCloudSyncTime || 'Never'}</span>
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button 
                    id="btn-cloud-upload-manual"
                    type="button"
                    onClick={() => handleUploadBackupToCloud(false)}
                    className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl bg-black hover:bg-slate-900 text-white text-xs font-extrabold transition-all cursor-pointer border-0 shadow-3xs text-center justify-self-stretch"
                  >
                    <Cloud className="w-4 h-4 text-sky-400" />
                    <span>Backup Now</span>
                  </button>

                  <button 
                    id="btn-cloud-load-manual"
                    type="button"
                    onClick={() => handleLoadBackupFromCloud(sessionUser, false)}
                    className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-slate-800 text-xs font-extrabold transition-all cursor-pointer shadow-3xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#2F59EB]" />
                    <span>Restore Cloud</span>
                  </button>

                  <button 
                    id="btn-local-export-backup"
                    type="button"
                    onClick={handleDownloadFullBackup}
                    className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-slate-800 text-xs font-extrabold transition-all cursor-pointer shadow-3xs"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Export JSON</span>
                  </button>

                  <button 
                    id="btn-local-import-backup"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-slate-800 text-xs font-extrabold transition-all cursor-pointer shadow-3xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-500" />
                    <span>Import JSON</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={handleDownloadLearnedWords}
                className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group shadow-3xs"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-[#2F59EB]">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 group-hover:text-black transition-colors font-gotham">Export Learned Cards</h5>
                    <p className="text-[10px] text-gray-400 leading-none mt-0.5">Download learned vocabulary as JSON</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Reset Learning Progress with confirmation balloon */}
              <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-3xs overflow-hidden">
                <button 
                  onClick={() => setShowResetConfirm(prev => !prev)}
                  className="w-full p-4 flex items-center justify-between transition-all cursor-pointer group hover:border-red-200"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-150 flex items-center justify-center text-red-500 font-bold">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors font-gotham">Reset Learning Progress</h5>
                      <p className="text-[10px] text-gray-400 leading-none mt-0.5">Flush saved stats and study logs</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showResetConfirm ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </button>

                {showResetConfirm && (
                  <div className="mx-4 mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-3 animate-fadeIn">
                    <p className="text-xs font-bold text-red-800 leading-relaxed">
                      This will erase all your progress and remove imported decks. Are you sure?
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:border-gray-400 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={clearAllAppProgress}
                        className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all cursor-pointer border-0"
                      >
                        Yes, Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleLogout}
                className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group shadow-3xs"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-red-200 flex items-center justify-center text-red-500 shadow-3xs">
                    <LogOut className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-red-700 transition-colors font-gotham">Sign Out</h5>
                    <p className="text-[10px] text-red-500 mt-0.5 font-semibold">End your current session</p>
                  </div>
                </div>
                <LogOut className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        )}
      </main>

      {currentScreen !== 'login' && currentScreen !== 'flashcard_game' && currentScreen !== 'quiz_game' && currentScreen !== 'guess_game' && <div className="h-24 w-full" />}

      {currentScreen !== 'login' && currentScreen !== 'flashcard_game' && currentScreen !== 'quiz_game' && currentScreen !== 'guess_game' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-gray-200 py-2.5 px-4 rounded-full shadow-lg backdrop-blur-md flex items-center justify-between gap-2 max-w-[94%] w-[385px] font-sans animate-fadeIn">
          {/* Home Tab Accent */}
          <button 
            onClick={() => navigateTo('home')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 ${
              currentScreen === 'home' ? 'text-[#2F59EB]' : 'text-gray-400 hover:text-gray-650'
            } border-0 bg-transparent`}
            title="Homepage"
          >
            <Home className="w-5 h-5 transition-transform group-hover:scale-105" />
            <span className="text-[9px] font-bold font-gotham mt-0.5 uppercase tracking-wide">Home</span>
          </button>

          {/* Flashcard Tab Accent */}
          <button 
            onClick={() => navigateTo('flashcard_list')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${
              currentScreen === 'flashcard_list' || currentScreen === 'flashcard_game' ? 'text-[#FF7A00]' : 'text-gray-400 hover:text-gray-650'
            } border-0 bg-transparent`}
            title="Flashcards"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-bold font-gotham mt-0.5 uppercase tracking-wide">Flashcards</span>
          </button>

          {/* Quizz List Tab Accent */}
          <button 
            onClick={() => navigateTo('quiz_list')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${
              currentScreen === 'quiz_list' || currentScreen === 'quiz_game' ? 'text-[#10B981]' : 'text-gray-400 hover:text-gray-650'
            } border-0 bg-transparent`}
            title="Quiz"
          >
            <Award className="w-5 h-5" />
            <span className="text-[9px] font-bold font-gotham mt-0.5 uppercase tracking-wide">Quiz</span>
          </button>

          {/* Learn List Tab Accent */}
          <button 
            onClick={() => navigateTo('guess_list')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${
              currentScreen === 'guess_list' || currentScreen === 'guess_game' ? 'text-[#8B5CF6]' : 'text-gray-400 hover:text-gray-650'
            } border-0 bg-transparent`}
            title="Learn"
          >
            <Brain className="w-5 h-5" />
            <span className="text-[9px] font-bold font-gotham mt-0.5 uppercase tracking-wide">Learn</span>
          </button>

          {/* Profile Tab Accent */}
          <button 
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 border-0 bg-transparent animate-fadeIn"
            title="My profile"
          >
            <div className={`w-5.5 h-5.5 rounded-full overflow-hidden flex items-center justify-center transition-all shadow-3xs border ${
              currentScreen === 'profile' ? 'border-[#2F59EB] ring-2 ring-[#2F59EB]/20' : 'border-gray-350 bg-slate-50'
            }`}>
              <img 
                src={avatarSeed.startsWith('http') ? avatarSeed : `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${encodeURIComponent(avatarSeed)}`}
                alt="Mini Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className={`text-[9px] font-bold font-gotham mt-0.5 uppercase tracking-wide truncate max-w-[55px] ${
              currentScreen === 'profile' ? 'text-[#2F59EB]' : 'text-gray-400'
            }`}>{sessionName ? sessionName.trim().split(/\s+/)[0] : 'Profile'}</span>
          </button>
        </div>
      )}
    </div>
  );
}