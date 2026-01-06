
import React, { createContext, useReducer, ReactNode, Dispatch, useEffect, useContext, useCallback } from 'react';
import {
    AppDataState, AppDataAction, AppDataActionType,
    AppState, Action, ExamActionType,
    StudyAidsState, StudyAidsAction, StudyAidsActionType,
    StudyPlanState, StudyPlanAction, StudyPlanActionType,
    TasksState, TasksAction, TasksActionType,
    GamificationState, GamificationAction, GamificationActionType,
    ThemeState, ThemeAction, ThemeActionType,
    AIInteractionState, AIInteractionAction, AIInteractionActionType, AIMessage,
    MusicState, MusicAction, MusicActionType,
    SmartSettingsState, SmartSettingsAction, SmartSettingsActionType,
    PomodoroState, PomodoroAction, PomodoroActionType, TimerMode,
    BookmarksState, BookmarksAction, BookmarksActionType,
    NotesState, NotesAction, NotesActionType,
    HighlightsState, HighlightsAction, HighlightsActionType,
    UpcomingExamsState, UpcomingExamsAction, UpcomingExamsActionType,
    ProfileState, ProfileAction, ProfileActionType,
    AuthState
} from '../types';
import { getAchievement } from '../data/achievements';
import { toastDispatcher } from './GamificationContext';

const initialExamState: AppState = { exams: [], results: [], loading: false, error: null };
const initialStudyAidsState: StudyAidsState = { summaries: [], flashcardDecks: [], mindMaps: [] };
const initialStudyPlanState: StudyPlanState = { plans: [], activePlanId: null, loading: false };
const initialTasksState: TasksState = { tasks: [] };
const initialGamificationState: GamificationState = { xp: 0, level: 1, lastStudiedDate: null, streak: 0, unlockedAchievements: [] };
const initialThemeState: ThemeState = { theme: 'light', accentColor: 'indigo', isAutoTheme: false, background: 'default', font: 'modern', buttonShape: 'rounded', focusMode: false, mood: 'neutral', avatarId: 'avatar1', phoneNumber: '', reduceMotion: false };
const defaultSystemMessage: AIMessage = { role: 'model', parts: [{text: "Hello! I'm your AI Study Companion. How can I help you today?"}] };
const initialAIInteractionState: AIInteractionState = { messages: [defaultSystemMessage], isThinking: false, isOpen: false, navigationPrompt: { isOpen: false, destination: '', message: '' }, schedulingModal: { isOpen: false, taskDescription: '', dueDate: undefined } };
const initialMusicState: MusicState = { currentTrackId: null, isPlaying: false, volume: 0.5 };
const initialSmartSettingsState: SmartSettingsState = { aiPersona: 'friendly', adaptiveLearning: false, autoPlanner: false, aiVoiceTutor: false, aiVoice: 'Kore', aiThinkingBudget: 0, autoSaveResults: true, compactMode: false };
const initialPomodoroState: PomodoroState = { mode: 'pomodoro', timeLeft: 25 * 60, isActive: false, cycles: 0, showSummary: false, sessionsToday: 0, totalFocusTime: 0, sessionType: 'focus', pomodoroDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, lastSessionDate: null };
const initialBookmarksState: BookmarksState = { bookmarks: [] };
const initialNotesState: NotesState = { notes: [] };
const initialHighlightsState: HighlightsState = { questionHighlights: [] };
const initialUpcomingExamsState: UpcomingExamsState = { upcomingExams: [] };
const initialAuthState: AuthState = { isLoggedIn: false, isInitialized: false };
const initialProfileState: ProfileState = { 
    fullName: 'Study Spark User', 
    email: '', 
    major: 'General Science', 
    educationLevel: 'University', 
    bio: 'Passionate about learning and AI.', 
    studyGoal: 'Complete all courses with distinction.',
    subjects: ['Artificial Intelligence', 'Medicine'],
    links: {}
};

const initialState: AppDataState = {
    authState: initialAuthState,
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
    profileState: initialProfileState,
};

const profileReducer = (state: ProfileState, action: ProfileAction): ProfileState => {
  switch (action.type) {
    case ProfileActionType.UPDATE_PROFILE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const examReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case ExamActionType.ADD_EXAM:
      return { ...state, exams: [...state.exams, action.payload] };
    case ExamActionType.UPDATE_EXAM:
      return { ...state, exams: state.exams.map(e => e.id === action.payload.id ? action.payload : e) };
    case ExamActionType.ADD_RESULT:
      return { ...state, results: [...state.results.filter(r => r.examId !== action.payload.examId), action.payload] };
    case ExamActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    case ExamActionType.SET_ERROR:
      return { ...state, error: action.payload };
    case ExamActionType.DELETE_RESULT:
      return { ...state, results: state.results.filter(r => r.examId !== action.payload) };
    default:
      return state;
  }
};

const studyPlanReducer = (state: StudyPlanState, action: StudyPlanAction): StudyPlanState => {
    switch (action.type) {
        case StudyPlanActionType.ADD_PLAN: return { ...state, plans: [...state.plans, action.payload], activePlanId: action.payload.id };
        case StudyPlanActionType.SET_ACTIVE_PLAN: return { ...state, activePlanId: action.payload };
        case StudyPlanActionType.DELETE_PLAN: return { ...state, plans: state.plans.filter(p => p.id !== action.payload), activePlanId: state.activePlanId === action.payload ? null : state.activePlanId };
        case StudyPlanActionType.SET_LOADING: return { ...state, loading: action.payload };
        default: return state;
    }
}

const studyAidsReducer = (state: StudyAidsState, action: StudyAidsAction): StudyAidsState => {
    switch(action.type) {
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

const tasksReducer = (state: TasksState, action: TasksAction): TasksState => {
    switch (action.type) {
        case TasksActionType.ADD_TASK: return { ...state, tasks: [...state.tasks, action.payload] };
        case TasksActionType.TOGGLE_TASK: return { ...state, tasks: state.tasks.map(t => t.id === action.payload ? { ...t, completed: !t.completed } : t) };
        case TasksActionType.DELETE_TASK: return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
        case TasksActionType.EDIT_TASK: return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, text: action.payload.text } : t) };
        case TasksActionType.SET_TASKS: return { ...state, tasks: action.payload };
        default: return state;
    }
};

const fullGamificationReducer = (state: GamificationState, action: GamificationAction): GamificationState => {
    switch (action.type) {
        case GamificationActionType.ADD_XP: {
            const newXp = state.xp + action.payload;
            const xpForNextLevel = 100 * Math.pow(2, state.level - 1);
            if (newXp >= xpForNextLevel) {
                const newLevel = state.level + 1;
                const remainingXp = newXp - xpForNextLevel;
                toastDispatcher('Level Up!', `Congratulations! You've reached Level ${newLevel}!`);
                return { ...state, level: newLevel, xp: remainingXp };
            }
            return { ...state, xp: newXp };
        }
        case GamificationActionType.CHECK_STREAK: {
            const today = new Date().toISOString().split('T')[0];
            if (state.lastStudiedDate === today) return state;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const newStreak = state.lastStudiedDate === yesterdayStr ? state.streak + 1 : 1;
            let newState = { ...state, streak: newStreak, lastStudiedDate: today };
            if (newStreak === 3 && !state.unlockedAchievements.includes('streak_3')) {
                newState.unlockedAchievements = [...newState.unlockedAchievements, 'streak_3'];
            }
            return newState;
        }
        case GamificationActionType.UNLOCK_ACHIEVEMENT: {
            if (state.unlockedAchievements.includes(action.payload)) return state;
            return { ...state, unlockedAchievements: [...state.unlockedAchievements, action.payload] };
        }
        default: return state;
    }
};

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
    switch (action.type) {
        case ThemeActionType.TOGGLE_THEME: return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
        case ThemeActionType.SET_ACCENT_COLOR: return { ...state, accentColor: action.payload };
        case ThemeActionType.TOGGLE_AUTO_THEME: return { ...state, isAutoTheme: !state.isAutoTheme };
        case ThemeActionType.SET_THEME_AND_ACCENT: return { ...state, theme: action.payload.theme, accentColor: action.payload.accent };
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

const aiInteractionReducer = (state: AIInteractionState, action: AIInteractionAction): AIInteractionState => {
    switch (action.type) {
        case AIInteractionActionType.ADD_MESSAGE: return { ...state, messages: [...state.messages, action.payload] };
        case AIInteractionActionType.SET_IS_THINKING: return { ...state, isThinking: action.payload };
        case AIInteractionActionType.TOGGLE_WINDOW: return { ...state, isOpen: !state.isOpen };
        case AIInteractionActionType.CLEAR_MESSAGES: return { ...state, messages: [defaultSystemMessage] };
        case AIInteractionActionType.SHOW_NAVIGATION_PROMPT: return { ...state, isOpen: false, navigationPrompt: { isOpen: true, ...action.payload } };
        case AIInteractionActionType.SHOW_SCHEDULING_MODAL: return { ...state, isOpen: false, schedulingModal: { isOpen: true, ...action.payload } };
        case AIInteractionActionType.HIDE_INTERACTION: return { ...state, navigationPrompt: { ...state.navigationPrompt, isOpen: false }, schedulingModal: { ...state.schedulingModal, isOpen: false } };
        default: return state;
    }
};

const musicReducer = (state: MusicState, action: MusicAction): MusicState => {
    switch (action.type) {
        case MusicActionType.SET_TRACK: return { ...state, currentTrackId: action.payload, isPlaying: !!action.payload };
        case MusicActionType.TOGGLE_PLAY: return { ...state, isPlaying: !state.isPlaying };
        case MusicActionType.SET_VOLUME: return { ...state, volume: action.payload };
        default: return state;
    }
};

const smartSettingsReducer = (state: SmartSettingsState, action: SmartSettingsAction): SmartSettingsState => {
    switch (action.type) {
        case SmartSettingsActionType.SET_AI_PERSONA: return { ...state, aiPersona: action.payload };
        case SmartSettingsActionType.SET_ADAPTIVE_LEARNING: return { ...state, adaptiveLearning: action.payload };
        case SmartSettingsActionType.SET_AUTO_PLANNER: return { ...state, autoPlanner: action.payload };
        case SmartSettingsActionType.SET_AI_VOICE_TUTOR: return { ...state, aiVoiceTutor: action.payload };
        case SmartSettingsActionType.SET_AI_VOICE: return { ...state, aiVoice: action.payload };
        case SmartSettingsActionType.SET_THINKING_BUDGET: return { ...state, aiThinkingBudget: action.payload };
        case SmartSettingsActionType.SET_AUTO_SAVE_RESULTS: return { ...state, autoSaveResults: action.payload };
        case SmartSettingsActionType.SET_COMPACT_MODE: return { ...state, compactMode: action.payload };
        case SmartSettingsActionType.SET_ALL_SETTINGS: return action.payload;
        default: return state;
    }
};

const pomodoroReducer = (state: PomodoroState, action: PomodoroAction): PomodoroState => {
    switch (action.type) {
        case PomodoroActionType.SET_MODE:
            const newTime = action.payload === 'pomodoro' ? state.pomodoroDuration * 60 : action.payload === 'shortBreak' ? state.shortBreakDuration * 60 : state.longBreakDuration * 60;
            return { ...state, mode: action.payload, timeLeft: newTime, isActive: false };
        case PomodoroActionType.TICK:
            return { ...state, timeLeft: Math.max(0, state.timeLeft - 1), totalFocusTime: state.mode === 'pomodoro' ? state.totalFocusTime + 1 : state.totalFocusTime };
        case PomodoroActionType.TOGGLE_ACTIVE:
            const today = new Date().toISOString().split('T')[0];
            const sessionsToday = state.lastSessionDate === today ? state.sessionsToday : 0;
            return { ...state, isActive: !state.isActive, sessionsToday: sessionsToday, lastSessionDate: today };
        case PomodoroActionType.RESET:
            const resetTime = state.mode === 'pomodoro' ? state.pomodoroDuration * 60 : state.mode === 'shortBreak' ? state.shortBreakDuration * 60 : state.longBreakDuration * 60;
            return { ...state, timeLeft: resetTime, isActive: false };
        case PomodoroActionType.FINISH_SESSION: {
            let nextMode: TimerMode;
            let newCycles = state.cycles;
            if (state.mode === 'pomodoro') {
                newCycles++;
                nextMode = newCycles % 4 === 0 ? 'longBreak' : 'shortBreak';
            } else {
                nextMode = 'pomodoro';
            }
            const nextTime = nextMode === 'pomodoro' ? state.pomodoroDuration * 60 : nextMode === 'shortBreak' ? state.shortBreakDuration * 60 : nextMode === 'longBreak' ? state.longBreakDuration * 60 : state.pomodoroDuration * 60;
            return { ...state, isActive: false, mode: nextMode, timeLeft: nextTime, cycles: newCycles, showSummary: state.mode === 'pomodoro', sessionsToday: state.mode === 'pomodoro' ? state.sessionsToday + 1 : state.sessionsToday };
        }
        case PomodoroActionType.CLOSE_SUMMARY: return { ...state, showSummary: false };
        case PomodoroActionType.EXTEND_SESSION: return { ...state, timeLeft: state.timeLeft + action.payload };
        case PomodoroActionType.SET_SESSION_TYPE: return { ...state, sessionType: action.payload };
        case PomodoroActionType.SET_DURATIONS:
             return { ...state, pomodoroDuration: action.payload.pomodoro, shortBreakDuration: action.payload.short, longBreakDuration: action.payload.long };
        default: return state;
    }
};

const bookmarksReducer = (state: BookmarksState, action: BookmarksAction): BookmarksState => {
    switch (action.type) {
        case BookmarksActionType.ADD_BOOKMARK: return { ...state, bookmarks: [...state.bookmarks, action.payload] };
        case BookmarksActionType.REMOVE_BOOKMARK: return { ...state, bookmarks: state.bookmarks.filter(b => b.questionId !== action.payload.questionId) };
        default: return state;
    }
};

const notesReducer = (state: NotesState, action: NotesAction): NotesState => {
    switch (action.type) {
        case NotesActionType.SET_NOTE:
            const existingNote = state.notes.find(n => n.questionId === action.payload.questionId);
            if (existingNote) {
                return { ...state, notes: state.notes.map(n => n.questionId === action.payload.questionId ? action.payload : n) };
            }
            return { ...state, notes: [...state.notes, action.payload] };
        case NotesActionType.DELETE_NOTE: return { ...state, notes: state.notes.filter(n => n.questionId !== action.payload.questionId) };
        default: return state;
    }
};

const highlightsReducer = (state: HighlightsState, action: HighlightsAction): HighlightsState => {
    switch (action.type) {
        case HighlightsActionType.SET_HIGHLIGHTS_FOR_QUESTION:
            const existingHighlight = state.questionHighlights.find(h => h.questionId === action.payload.questionId);
            if (existingHighlight) {
                return { ...state, questionHighlights: state.questionHighlights.map(h => h.questionId === action.payload.questionId ? action.payload : h) };
            }
            return { ...state, questionHighlights: [...state.questionHighlights, action.payload] };
        case HighlightsActionType.CLEAR_HIGHLIGHTS_FOR_QUESTION:
            return { ...state, questionHighlights: state.questionHighlights.filter(h => h.questionId !== action.payload.questionId) };
        default: return state;
    }
};

const upcomingExamsReducer = (state: UpcomingExamsState, action: UpcomingExamsAction): UpcomingExamsState => {
    switch (action.type) {
        case UpcomingExamsActionType.ADD_UPCOMING_EXAM: return { ...state, upcomingExams: [...state.upcomingExams, action.payload] };
        case UpcomingExamsActionType.DELETE_UPCOMING_EXAM: return { ...state, upcomingExams: state.upcomingExams.filter(e => e.id !== action.payload) };
        default: return state;
    }
};

const rootReducer = (state: AppDataState, action: AppDataAction): AppDataState => {
    if (action.type === AppDataActionType.SET_AUTH_STATE) {
        if (!action.payload.isLoggedIn) {
            return { ...initialState, authState: { isLoggedIn: false, isInitialized: true } };
        }
        return { ...state, authState: action.payload };
    }
    if (action.type === AppDataActionType.LOAD_STATE) {
        return { 
            ...initialState, 
            ...action.payload, 
            authState: { isLoggedIn: true, isInitialized: true } 
        };
    }

    return {
        ...state,
        examState: examReducer(state.examState, action as Action),
        studyAidsState: studyAidsReducer(state.studyAidsState, action as StudyAidsAction),
        studyPlanState: studyPlanReducer(state.studyPlanState, action as StudyPlanAction),
        tasksState: tasksReducer(state.tasksState, action as TasksAction),
        gamificationState: fullGamificationReducer(state.gamificationState, action as GamificationAction),
        themeState: themeReducer(state.themeState, action as ThemeAction),
        aiInteractionState: aiInteractionReducer(state.aiInteractionState, action as AIInteractionAction),
        musicState: musicReducer(state.musicState, action as MusicAction),
        smartSettingsState: smartSettingsReducer(state.smartSettingsState, action as SmartSettingsAction),
        pomodoroState: pomodoroReducer(state.pomodoroState, action as PomodoroAction),
        bookmarksState: bookmarksReducer(state.bookmarksState, action as BookmarksAction),
        notesState: notesReducer(state.notesState, action as NotesAction),
        highlightsState: highlightsReducer(state.highlightsState, action as HighlightsAction),
        upcomingExamsState: upcomingExamsReducer(state.upcomingExamsState, action as UpcomingExamsAction),
        profileState: profileReducer(state.profileState, action as ProfileAction),
    };
};

const AppDataStateContext = createContext<AppDataState>(initialState);
const AppDataDispatchContext = createContext<Dispatch<AppDataAction>>(() => null);

const BACKEND_STORAGE_KEY = 'studySparkBackend';

export function AppDataProvider({ children }: { children?: ReactNode }) {
    const [state, dispatch] = useReducer(rootReducer, initialState);

    useEffect(() => {
        const isLoggedIn = !!localStorage.getItem(BACKEND_STORAGE_KEY);
        if (isLoggedIn) {
            fetchDataFromStorage();
        } else {
            dispatch({ type: AppDataActionType.SET_AUTH_STATE, payload: { isLoggedIn: false, isInitialized: true } });
        }
    }, []);

    useEffect(() => {
        if (state.authState.isLoggedIn && state.authState.isInitialized) {
            saveDataToStorage(state);
        }
    }, [state]);

    const fetchDataFromStorage = useCallback(() => {
        try {
            const stored = localStorage.getItem(BACKEND_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                dispatch({ type: AppDataActionType.LOAD_STATE, payload: parsed });
            } else {
                 dispatch({ type: AppDataActionType.SET_AUTH_STATE, payload: { isLoggedIn: true, isInitialized: true } });
            }
        } catch (error) {
            localStorage.removeItem(BACKEND_STORAGE_KEY);
            dispatch({ type: AppDataActionType.SET_AUTH_STATE, payload: { isLoggedIn: false, isInitialized: true } });
        }
    }, []);

    const saveDataToStorage = useCallback((currentState: AppDataState) => {
        try {
            const stateToSave = {
                examState: { ...currentState.examState, loading: false, error: null },
                studyAidsState: currentState.studyAidsState,
                studyPlanState: currentState.studyPlanState,
                tasksState: currentState.tasksState,
                gamificationState: currentState.gamificationState,
                themeState: currentState.themeState,
                aiInteractionState: { ...initialAIInteractionState, isOpen: currentState.aiInteractionState.isOpen },
                musicState: currentState.musicState,
                smartSettingsState: currentState.smartSettingsState,
                pomodoroState: { ...currentState.pomodoroState, isActive: false, showSummary: false },
                bookmarksState: currentState.bookmarksState,
                notesState: currentState.notesState,
                highlightsState: currentState.highlightsState,
                upcomingExamsState: currentState.upcomingExamsState,
                profileState: currentState.profileState,
            };
            localStorage.setItem(BACKEND_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {}
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'calm');
        root.classList.add(state.themeState.theme);
        root.setAttribute('data-accent', state.themeState.accentColor);
        root.setAttribute('data-font', state.themeState.font);
        root.setAttribute('data-reduce-motion', String(state.themeState.reduceMotion));
    }, [state.themeState.theme, state.themeState.accentColor, state.themeState.font, state.themeState.reduceMotion]);

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
