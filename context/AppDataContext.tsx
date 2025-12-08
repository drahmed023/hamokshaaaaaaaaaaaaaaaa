import React, { createContext, useReducer, ReactNode, Dispatch, useEffect, useContext } from 'react';
import {
    AppDataState, AppDataAction,
    AppState, Action, ExamActionType,
    StudyAidsState, StudyAidsAction, StudyAidsActionType,
    StudyPlanState, StudyPlanAction, StudyPlanActionType,
    TasksState, TasksAction, TasksActionType,
    GamificationState, GamificationAction, GamificationActionType,
    ThemeState, ThemeAction, ThemeActionType, ThemeName,
    AIInteractionState, AIInteractionAction, AIInteractionActionType, AIMessage,
    MusicState, MusicAction, MusicActionType,
    SmartSettingsState, SmartSettingsAction, SmartSettingsActionType,
    PomodoroState, PomodoroAction, PomodoroActionType, TimerMode,
    BookmarksState, BookmarksAction, BookmarksActionType,
    NotesState, NotesAction, NotesActionType,
    HighlightsState, HighlightsAction, HighlightsActionType,
    UpcomingExamsState, UpcomingExamsAction, UpcomingExamsActionType
} from '../types';
import { getAchievement } from '../data/achievements';
// FIX: Import the singleton toastDispatcher from GamificationContext
import { toastDispatcher } from './GamificationContext';

// --- Individual Reducers ---

const initialExamState: AppState = { exams: [], results: [], loading: false, error: null };
const examReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case ExamActionType.ADD_EXAM: return { ...state, exams: [...state.exams, action.payload] };
    case ExamActionType.UPDATE_EXAM: return { ...state, exams: state.exams.map(exam => exam.id === action.payload.id ? action.payload : exam) };
    case ExamActionType.ADD_RESULT: {
      const currentResults = Array.isArray(state.results) ? state.results : [];
      const filteredResults = currentResults.filter(r => r.examId !== action.payload.examId);
      return { ...state, results: [...filteredResults, action.payload] };
    }
    case ExamActionType.SET_LOADING: return { ...state, loading: action.payload };
    case ExamActionType.SET_ERROR: return { ...state, error: action.payload, loading: false };
    case ExamActionType.DELETE_RESULT: {
      const resultsToDeleteFrom = Array.isArray(state.results) ? state.results : [];
      return { ...state, results: resultsToDeleteFrom.filter(r => r.examId !== action.payload) };
    }
    default: return state;
  }
};

const initialStudyAidsState: StudyAidsState = { summaries: [], flashcardDecks: [], mindMaps: [] };
const studyAidsReducer = (state: StudyAidsState, action: StudyAidsAction): StudyAidsState => {
  switch (action.type) {
    case StudyAidsActionType.ADD_SUMMARY: return { ...state, summaries: [...state.summaries, action.payload] };
    case StudyAidsActionType.UPDATE_SUMMARY: return { ...state, summaries: state.summaries.map(s => s.id === action.payload.id ? action.payload : s) };
    case StudyAidsActionType.DELETE_SUMMARY: return { ...state, summaries: state.summaries.filter(s => s.id !== action.payload) };
    case StudyAidsActionType.ADD_FLASHCARD_DECK: return { ...state, flashcardDecks: [...state.flashcardDecks, action.payload] };
    case StudyAidsActionType.UPDATE_FLASHCARD_DECK: return { ...state, flashcardDecks: state.flashcardDecks.map(d => d.id === action.payload.id ? action.payload : d) };
    case StudyAidsActionType.DELETE_FLASHCARD_DECK: return { ...state, flashcardDecks: state.flashcardDecks.filter(d => d.id !== action.payload) };
    case StudyAidsActionType.ADD_MIND_MAP: return { ...state, mindMaps: [...state.mindMaps, action.payload] };
    case StudyAidsActionType.UPDATE_MIND_MAP: return { ...state, mindMaps: state.mindMaps.map(m => m.id === action.payload.id ? action.payload : m) };
    case StudyAidsActionType.DELETE_MIND_MAP: return { ...state, mindMaps: state.mindMaps.filter(m => m.id !== action.payload) };
    default: return state;
  }
};

const initialStudyPlanState: StudyPlanState = { plans: [], activePlanId: null, loading: false, error: null };
const studyPlanReducer = (state: StudyPlanState, action: StudyPlanAction): StudyPlanState => {
  switch (action.type) {
    case StudyPlanActionType.ADD_PLAN: return { ...state, plans: [...state.plans, action.payload], loading: false, error: null };
    case StudyPlanActionType.DELETE_PLAN: return { ...state, plans: state.plans.filter(p => p.id !== action.payload), activePlanId: state.activePlanId === action.payload ? null : state.activePlanId };
    case StudyPlanActionType.SET_ACTIVE_PLAN: return { ...state, activePlanId: action.payload };
    case StudyPlanActionType.SET_LOADING: return { ...state, loading: action.payload };
    case StudyPlanActionType.SET_ERROR: return { ...state, error: action.payload, loading: false };
    default: return state;
  }
};

const initialTasksState: TasksState = { tasks: [] };
const tasksReducer = (state: TasksState, action: TasksAction): TasksState => {
  switch (action.type) {
    case TasksActionType.ADD_TASK: if (state.tasks.some(t => t.id === action.payload.id)) { return state; } return { ...state, tasks: [...state.tasks, action.payload] };
    case TasksActionType.TOGGLE_TASK: return { ...state, tasks: state.tasks.map(task => task.id === action.payload ? { ...task, completed: !task.completed } : task) };
    case TasksActionType.DELETE_TASK: return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload) };
    case TasksActionType.EDIT_TASK: return { ...state, tasks: state.tasks.map(task => task.id === action.payload.id ? { ...task, text: action.payload.text } : task) };
    case TasksActionType.SET_TASKS: return { ...state, tasks: action.payload };
    case TasksActionType.DELETE_PLAN_TASKS: return { ...state, tasks: state.tasks.filter(task => task.planId !== action.payload) };
    default: return state;
  }
};

const initialGamificationState: GamificationState = { xp: 0, level: 1, lastStudiedDate: null, streak: 0, unlockedAchievements: [] };
const getXpForLevel = (level: number) => 100 * Math.pow(2, level - 1);

const fullGamificationReducer = (state: GamificationState, action: GamificationAction): GamificationState => {
  switch (action.type) {
    case GamificationActionType.ADD_XP: {
      let newXp = state.xp + action.payload;
      let newLevel = state.level;
      let xpForNextLevel = getXpForLevel(newLevel);
      while (newXp >= xpForNextLevel) {
        newXp -= xpForNextLevel; newLevel++;
        toastDispatcher('Leveled Up!', `Congratulations! You've reached Level ${newLevel}!`);
      }
      const today = new Date().toISOString().split('T')[0];
      return { ...state, xp: newXp, level: newLevel, lastStudiedDate: today };
    }
    case GamificationActionType.CHECK_STREAK: {
        if (!state.lastStudiedDate) return { ...state, streak: 0 };
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const lastStudied = new Date(state.lastStudiedDate); lastStudied.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - lastStudied.getTime()) / (1000 * 60 * 60 * 24));
        let newStreak = diffDays === 1 ? state.streak + 1 : (diffDays === 0 ? state.streak : 0);
        if (state.lastStudiedDate === new Date().toISOString().split('T')[0]) newStreak = state.streak || 1;
        const newAchievements = new Set(state.unlockedAchievements);
        if (newStreak >= 3 && !newAchievements.has('streak_3')) { newAchievements.add('streak_3'); const ach = getAchievement('streak_3'); if (ach) toastDispatcher(`Achievement Unlocked!`, ach.name); }
        if (newStreak >= 7 && !newAchievements.has('streak_7')) { newAchievements.add('streak_7'); const ach = getAchievement('streak_7'); if (ach) toastDispatcher(`Achievement Unlocked!`, ach.name); }
        return { ...state, streak: newStreak, unlockedAchievements: Array.from(newAchievements) };
    }
    case GamificationActionType.UNLOCK_ACHIEVEMENT: {
        if (state.unlockedAchievements.includes(action.payload)) return state;
        const achievement = getAchievement(action.payload); if (achievement) toastDispatcher('Achievement Unlocked!', achievement.name);
        return { ...state, unlockedAchievements: [...state.unlockedAchievements, action.payload] };
    }
    case GamificationActionType.RESET_GAMIFICATION: return initialGamificationState;
    default: return state;
  }
};

const initialThemeState: ThemeState = { theme: 'light', accentColor: 'indigo', isAutoTheme: false, background: 'default', font: 'modern', buttonShape: 'rounded', focusMode: false, mood: 'neutral', avatarId: 'avatar1', phoneNumber: '', reduceMotion: false };
const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case ThemeActionType.TOGGLE_THEME: return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case ThemeActionType.SET_ACCENT_COLOR: return { ...state, accentColor: action.payload };
    case ThemeActionType.TOGGLE_AUTO_THEME: return { ...state, isAutoTheme: !state.isAutoTheme };
    case ThemeActionType.SET_THEME_AND_ACCENT: return { ...state, theme: action.payload.theme, accentColor: action.payload.accent, isAutoTheme: false };
    case ThemeActionType.SET_BACKGROUND: return { ...state, background: action.payload };
    case ThemeActionType.SET_FONT: return { ...state, font: action.payload };
    case ThemeActionType.SET_BUTTON_SHAPE: return { ...state, buttonShape: action.payload };
    case ThemeActionType.SET_FOCUS_MODE: return { ...state, focusMode: action.payload };
    case ThemeActionType.SET_MOOD: return { ...state, mood: action.payload };
    case ThemeActionType.SET_AVATAR_ID: return { ...state, avatarId: action.payload };
    case ThemeActionType.SET_PHONE_NUMBER: return { ...state, phoneNumber: action.payload };
    case ThemeActionType.SET_REDUCE_MOTION: return { ...state, reduceMotion: action.payload };
    default: return state;
  }
};

const defaultSystemMessage: AIMessage = { role: 'model', parts: [{text: "Hello! I'm your AI Study Companion. How can I help you today?"}] };
const initialAIInteractionState: AIInteractionState = { messages: [defaultSystemMessage], isThinking: false, isOpen: false, navigationPrompt: { isOpen: false, destination: '', message: '' }, schedulingModal: { isOpen: false, taskDescription: '', dueDate: undefined } };
const aiInteractionReducer = (state: AIInteractionState, action: AIInteractionAction): AIInteractionState => {
    switch (action.type) {
        case AIInteractionActionType.ADD_MESSAGE: return { ...state, messages: [...state.messages, action.payload] };
        case AIInteractionActionType.SET_IS_THINKING: return { ...state, isThinking: action.payload };
        case AIInteractionActionType.TOGGLE_WINDOW: return { ...state, isOpen: !state.isOpen };
        case AIInteractionActionType.CLEAR_MESSAGES: return { ...state, messages: [defaultSystemMessage] };
        case AIInteractionActionType.SHOW_NAVIGATION_PROMPT: return { ...state, navigationPrompt: { ...action.payload, isOpen: true }, isOpen: true };
        case AIInteractionActionType.SHOW_SCHEDULING_MODAL: return { ...state, schedulingModal: { ...action.payload, isOpen: true }, isOpen: true };
        case AIInteractionActionType.HIDE_INTERACTION: return { ...state, navigationPrompt: { ...state.navigationPrompt, isOpen: false }, schedulingModal: { ...state.schedulingModal, isOpen: false } };
        default: return state;
    }
};

const initialMusicState: MusicState = { currentTrackId: null, isPlaying: false, volume: 0.5 };
const musicReducer = (state: MusicState, action: MusicAction): MusicState => {
  switch (action.type) {
    case MusicActionType.SET_TRACK: return { ...state, currentTrackId: action.payload, isPlaying: state.isPlaying && !!action.payload };
    case MusicActionType.TOGGLE_PLAY: return { ...state, isPlaying: state.currentTrackId ? !state.isPlaying : false };
    case MusicActionType.SET_VOLUME: return { ...state, volume: action.payload };
    default: return state;
  }
};

const initialSmartSettingsState: SmartSettingsState = { aiPersona: 'friendly', adaptiveLearning: false, autoPlanner: false, aiVoiceTutor: false, aiVoice: 'Kore' };
const smartSettingsReducer = (state: SmartSettingsState, action: SmartSettingsAction): SmartSettingsState => {
    switch (action.type) {
        case SmartSettingsActionType.SET_AI_PERSONA: return { ...state, aiPersona: action.payload };
        case SmartSettingsActionType.SET_ADAPTIVE_LEARNING: return { ...state, adaptiveLearning: action.payload };
        case SmartSettingsActionType.SET_AUTO_PLANNER: return { ...state, autoPlanner: action.payload };
        case SmartSettingsActionType.SET_AI_VOICE_TUTOR: return { ...state, aiVoiceTutor: action.payload };
        case SmartSettingsActionType.SET_AI_VOICE: return { ...state, aiVoice: action.payload };
        case SmartSettingsActionType.SET_ALL_SETTINGS: return { ...state, ...action.payload };
        default: return state;
    }
};

const getTimeForMode = (mode: TimerMode, state: PomodoroState): number => {
    switch (mode) {
        case 'pomodoro': return state.pomodoroDuration * 60;
        case 'shortBreak': return state.shortBreakDuration * 60;
        case 'longBreak': return state.longBreakDuration * 60;
        default: return state.pomodoroDuration * 60;
    }
};
const initialPomodoroState: PomodoroState = { mode: 'pomodoro', timeLeft: 25 * 60, isActive: false, cycles: 0, showSummary: false, sessionsToday: 0, totalFocusTime: 0, sessionType: 'focus', pomodoroDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, lastSessionDate: null };
const pomodoroReducer = (state: PomodoroState, action: PomodoroAction): PomodoroState => {
    switch (action.type) {
        case PomodoroActionType.SET_MODE: return { ...state, mode: action.payload, timeLeft: getTimeForMode(action.payload, state), isActive: false };
        case PomodoroActionType.TICK: {
            if (!state.isActive) return state;
            return { ...state, timeLeft: state.timeLeft - 1, totalFocusTime: state.mode === 'pomodoro' ? state.totalFocusTime + 1 : state.totalFocusTime };
        }
        case PomodoroActionType.TOGGLE_ACTIVE: return { ...state, isActive: !state.isActive };
        case PomodoroActionType.RESET: return { ...state, timeLeft: getTimeForMode(state.mode, state), isActive: false };
        case PomodoroActionType.FINISH_SESSION: {
            if (state.mode === 'pomodoro') {
                const newCycles = state.cycles + 1; const nextMode: TimerMode = newCycles % 4 === 0 ? 'longBreak' : 'shortBreak';
                const today = new Date().toISOString().split('T')[0];
                const newSessionsToday = state.lastSessionDate === today ? state.sessionsToday + 1 : 1;
                return { ...state, isActive: false, mode: nextMode, timeLeft: getTimeForMode(nextMode, state), cycles: newCycles, sessionsToday: newSessionsToday, showSummary: true, lastSessionDate: today };
            } else {
                return { ...state, isActive: false, mode: 'pomodoro', timeLeft: getTimeForMode('pomodoro', state) };
            }
        }
        case PomodoroActionType.CLOSE_SUMMARY: return { ...state, showSummary: false };
        case PomodoroActionType.EXTEND_SESSION: return { ...state, timeLeft: state.timeLeft + action.payload };
        case PomodoroActionType.SET_SESSION_TYPE: return { ...state, sessionType: action.payload };
        case PomodoroActionType.SET_DURATIONS: {
            const newState = { ...state, pomodoroDuration: action.payload.pomodoro, shortBreakDuration: action.payload.short, longBreakDuration: action.payload.long };
            if (!state.isActive) { newState.timeLeft = getTimeForMode(state.mode, newState); }
            return newState;
        }
        default: return state;
    }
};

const initialBookmarksState: BookmarksState = { bookmarks: [] };
const bookmarksReducer = (state: BookmarksState, action: BookmarksAction): BookmarksState => {
    switch (action.type) {
        case BookmarksActionType.ADD_BOOKMARK: if (state.bookmarks.some(b => b.questionId === action.payload.questionId)) return state; return { ...state, bookmarks: [...state.bookmarks, action.payload] };
        case BookmarksActionType.REMOVE_BOOKMARK: return { ...state, bookmarks: state.bookmarks.filter(b => b.questionId !== action.payload.questionId) };
        default: return state;
    }
};

const initialNotesState: NotesState = { notes: [] };
const notesReducer = (state: NotesState, action: NotesAction): NotesState => {
    switch (action.type) {
        case NotesActionType.SET_NOTE: {
            const existingIndex = state.notes.findIndex(n => n.questionId === action.payload.questionId);
            if (existingIndex > -1) { const newNotes = [...state.notes]; newNotes[existingIndex] = action.payload; return { ...state, notes: newNotes }; }
            return { ...state, notes: [...state.notes, action.payload] };
        }
        case NotesActionType.DELETE_NOTE: return { ...state, notes: state.notes.filter(n => n.questionId !== action.payload.questionId) };
        default: return state;
    }
};

const initialHighlightsState: HighlightsState = { questionHighlights: [] };
const highlightsReducer = (state: HighlightsState, action: HighlightsAction): HighlightsState => {
    switch (action.type) {
        case HighlightsActionType.SET_HIGHLIGHTS_FOR_QUESTION: {
            const existingIndex = state.questionHighlights.findIndex(h => h.questionId === action.payload.questionId);
            if (existingIndex > -1) { const newHighlights = [...state.questionHighlights]; newHighlights[existingIndex] = action.payload; return { ...state, questionHighlights: newHighlights }; }
            return { ...state, questionHighlights: [...state.questionHighlights, action.payload] };
        }
        case HighlightsActionType.CLEAR_HIGHLIGHTS_FOR_QUESTION: return { ...state, questionHighlights: state.questionHighlights.filter(h => h.questionId !== action.payload.questionId) };
        default: return state;
    }
};

const initialUpcomingExamsState: UpcomingExamsState = { upcomingExams: [] };
const upcomingExamsReducer = (state: UpcomingExamsState, action: UpcomingExamsAction): UpcomingExamsState => {
    switch (action.type) {
        case UpcomingExamsActionType.ADD_UPCOMING_EXAM:
            return { ...state, upcomingExams: [...state.upcomingExams, action.payload] };
        case UpcomingExamsActionType.DELETE_UPCOMING_EXAM:
            return { ...state, upcomingExams: state.upcomingExams.filter(exam => exam.id !== action.payload) };
        default:
            return state;
    }
};


// --- Root Reducer & Initial State ---

const initialState: AppDataState = {
    examState: initialExamState,
    studyAidsState: initialStudyAidsState,
    studyPlanState: initialStudyPlanState,
    tasksState: initialTasksState,
    gamificationState: initialGamificationState,
    themeState: initialThemeState,
    aiInteractionState: initialAIInteractionState,
    musicState: initialMusicState,
    smartSettingsState: initialSmartSettingsState,
    pomodoroState: initialPomodoroState,
    bookmarksState: initialBookmarksState,
    notesState: initialNotesState,
    highlightsState: initialHighlightsState,
    upcomingExamsState: initialUpcomingExamsState,
};

const rootReducer = (state: AppDataState, action: AppDataAction): AppDataState => ({
    examState: examReducer(state.examState, action as any),
    studyAidsState: studyAidsReducer(state.studyAidsState, action as any),
    studyPlanState: studyPlanReducer(state.studyPlanState, action as any),
    tasksState: tasksReducer(state.tasksState, action as any),
    gamificationState: fullGamificationReducer(state.gamificationState, action as any),
    themeState: themeReducer(state.themeState, action as any),
    aiInteractionState: aiInteractionReducer(state.aiInteractionState, action as any),
    musicState: musicReducer(state.musicState, action as any),
    smartSettingsState: smartSettingsReducer(state.smartSettingsState, action as any),
    pomodoroState: pomodoroReducer(state.pomodoroState, action as any),
    bookmarksState: bookmarksReducer(state.bookmarksState, action as any),
    notesState: notesReducer(state.notesState, action as any),
    highlightsState: highlightsReducer(state.highlightsState, action as any),
    upcomingExamsState: upcomingExamsReducer(state.upcomingExamsState, action as any),
});

const AppDataStateContext = createContext<AppDataState>(initialState);
const AppDataDispatchContext = createContext<Dispatch<AppDataAction>>(() => null);

// --- Persisted Reducer Hook ---

const usePersistedReducer = (reducer: typeof rootReducer, key: string, initial: AppDataState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                // SAFE MERGE:
                // Only assume it's valid if it's an object. 
                // We create a fresh initial state and carefully merge persisted keys.
                // This prevents crashes if the localStorage has old data with missing keys or wrong shapes (e.g. from before the migration).
                const mergedState = { ...initialState };
                
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    Object.keys(initialState).forEach(k => {
                        const stateKey = k as keyof AppDataState;
                        const storedSubState = parsed[stateKey];
                        // If the sub-state exists in storage and is an object, merge it. 
                        // Otherwise, keep the fresh initial sub-state.
                        if (storedSubState && typeof storedSubState === 'object' && !Array.isArray(storedSubState)) {
                            // @ts-ignore
                            mergedState[stateKey] = { ...initialState[stateKey], ...storedSubState };
                        }
                    });
                    return mergedState;
                }
            }
            return initialState;
        } catch (error) {
            console.error("Error parsing state from localStorage", error);
            // If error, return clean state to recover from corruption
            return initialState;
        }
    });

    useEffect(() => {
        try {
            // Prune volatile state before saving
            const stateToSave = {
                ...state,
                examState: { ...state.examState, loading: false, error: null },
                studyPlanState: { ...state.studyPlanState, loading: false, error: null },
                aiInteractionState: { ...state.aiInteractionState, isThinking: false },
                pomodoroState: { ...state.pomodoroState, isActive: false, showSummary: false }
            };
            localStorage.setItem(key, JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Error saving state to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

// --- Provider & Hook ---

export function AppDataProvider({ children }: { children?: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(rootReducer, 'studySparkBackend', initialState);

  // Theme side-effects
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'calm');
    root.classList.add(state.themeState.theme);
    root.setAttribute('data-accent', state.themeState.accentColor);
    root.setAttribute('data-font', state.themeState.font);
  }, [state.themeState.theme, state.themeState.accentColor, state.themeState.font]);


  return (
    <AppDataStateContext.Provider value={state}>
      <AppDataDispatchContext.Provider value={dispatch}>
        {children}
      </AppDataDispatchContext.Provider>
    </AppDataStateContext.Provider>
  );
}

export const useAppData = () => {
  const state = useContext(AppDataStateContext);
  const dispatch = useContext(AppDataDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return { state, dispatch };
};