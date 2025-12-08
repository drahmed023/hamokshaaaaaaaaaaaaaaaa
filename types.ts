import React, { SVGProps } from 'react';

// General
export type ThemeName = 'light' | 'dark' | 'calm';
export type AccentColorName = 'indigo' | 'sky' | 'rose' | 'emerald' | 'orange';
export type BackgroundName = 'default' | 'sunset' | 'galaxy' | 'office';
export type Font = 'modern' | 'classic' | 'study';
export type ButtonShape = 'rounded' | 'sharp' | 'pill';
export type Mood = 'neutral' | 'focused' | 'relaxed' | 'motivated';
export type AvatarId = 'avatar1' | 'avatar2' | 'avatar3' | 'avatar4' | 'avatar5' | 'avatar6';

// Exam
export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface Exam {
  id: string;
  title: string;
  questions: Question[];
  sourceFileName: string;
  subject?: string;
}

export interface ExamResult {
  examId: string;
  score: number;
  answers: { questionId: string; answer: string }[];
  submittedAt: string;
}

export interface AppState {
  exams: Exam[];
  results: ExamResult[];
  loading: boolean;
  error: string | null;
}

export enum ExamActionType {
  ADD_EXAM = 'ADD_EXAM',
  UPDATE_EXAM = 'UPDATE_EXAM',
  ADD_RESULT = 'ADD_RESULT',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  DELETE_RESULT = 'DELETE_RESULT',
}

export type Action =
  | { type: ExamActionType.ADD_EXAM; payload: Exam }
  | { type: ExamActionType.UPDATE_EXAM; payload: Exam }
  | { type: ExamActionType.ADD_RESULT; payload: ExamResult }
  | { type: ExamActionType.SET_LOADING; payload: boolean }
  | { type: ExamActionType.SET_ERROR; payload: string | null }
  | { type: ExamActionType.DELETE_RESULT; payload: string };

// Study Aids
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  nextReview: string;
  interval: number;
  easeFactor: number;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  cards: Flashcard[];
}

export interface Summary {
  id: string;
  title: string;
  content: string;
}

export interface MindMapNodeData {
  id: string;
  topic: string;
  children?: MindMapNodeData[];
}

export interface MindMap {
  id: string;
  title: string;
  root: MindMapNodeData;
}

export interface StudyAidsState {
  summaries: Summary[];
  flashcardDecks: FlashcardDeck[];
  mindMaps: MindMap[];
}

export enum StudyAidsActionType {
  ADD_SUMMARY = 'ADD_SUMMARY',
  UPDATE_SUMMARY = 'UPDATE_SUMMARY',
  DELETE_SUMMARY = 'DELETE_SUMMARY',
  ADD_FLASHCARD_DECK = 'ADD_FLASHCARD_DECK',
  UPDATE_FLASHCARD_DECK = 'UPDATE_FLASHCARD_DECK',
  DELETE_FLASHCARD_DECK = 'DELETE_FLASHCARD_DECK',
  ADD_MIND_MAP = 'ADD_MIND_MAP',
  UPDATE_MIND_MAP = 'UPDATE_MIND_MAP',
  DELETE_MIND_MAP = 'DELETE_MIND_MAP',
}

export type StudyAidsAction =
  | { type: StudyAidsActionType.ADD_SUMMARY, payload: Summary }
  | { type: StudyAidsActionType.UPDATE_SUMMARY, payload: Summary }
  | { type: StudyAidsActionType.DELETE_SUMMARY, payload: string }
  | { type: StudyAidsActionType.ADD_FLASHCARD_DECK, payload: FlashcardDeck }
  | { type: StudyAidsActionType.UPDATE_FLASHCARD_DECK, payload: FlashcardDeck }
  | { type: StudyAidsActionType.DELETE_FLASHCARD_DECK, payload: string }
  | { type: StudyAidsActionType.ADD_MIND_MAP, payload: MindMap }
  | { type: StudyAidsActionType.UPDATE_MIND_MAP, payload: MindMap }
  | { type: StudyAidsActionType.DELETE_MIND_MAP, payload: string };

// Study Plan
export interface StudyResource {
  type: 'video' | 'article' | 'pdf';
  title: string;
  url?: string;
  searchQuery?: string;
  source: string; // e.g., 'YouTube', 'Amboss', 'Lecturio'
}

export interface StudyTask {
    task: string;
    duration: number; // in minutes
    priority: 'High' | 'Medium' | 'Low';
    resources?: StudyResource[];
}

export interface StudyDay {
    dayOfWeek: string;
    tasks: StudyTask[];
    isRestDay: boolean;
}

export interface StudyWeek {
    weekNumber: number;
    weeklyGoal: string;
    days: StudyDay[];
}

export interface StudyPlan {
    id: string;
    planTitle: string;
    weeks: StudyWeek[];
    createdAt: string;
    groundingMetadata?: { web?: { uri: string, title: string } }[];
}

export interface StudyPlanState {
    plans: StudyPlan[];
    activePlanId: string | null;
    loading: boolean;
    error: string | null;
}

export enum StudyPlanActionType {
    ADD_PLAN = 'ADD_PLAN',
    DELETE_PLAN = 'DELETE_PLAN',
    SET_ACTIVE_PLAN = 'SET_ACTIVE_PLAN',
    SET_LOADING = 'SET_LOADING',
    SET_ERROR = 'SET_ERROR',
}

export type StudyPlanAction =
    | { type: StudyPlanActionType.ADD_PLAN, payload: StudyPlan }
    | { type: StudyPlanActionType.DELETE_PLAN, payload: string }
    | { type: StudyPlanActionType.SET_ACTIVE_PLAN, payload: string | null }
    | { type: StudyPlanActionType.SET_LOADING, payload: boolean }
    | { type: StudyPlanActionType.SET_ERROR, payload: string | null };

// Tasks
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  source: 'user' | 'study_plan';
  planId?: string;
}

export interface TasksState {
  tasks: Task[];
}

export enum TasksActionType {
  ADD_TASK = 'ADD_TASK',
  TOGGLE_TASK = 'TOGGLE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  EDIT_TASK = 'EDIT_TASK',
  SET_TASKS = 'SET_TASKS',
  DELETE_PLAN_TASKS = 'DELETE_PLAN_TASKS',
}

export type TasksAction =
  | { type: TasksActionType.ADD_TASK, payload: Task }
  | { type: TasksActionType.TOGGLE_TASK, payload: string }
  | { type: TasksActionType.DELETE_TASK, payload: string }
  | { type: TasksActionType.EDIT_TASK, payload: { id: string, text: string } }
  | { type: TasksActionType.SET_TASKS, payload: Task[] }
  | { type: TasksActionType.DELETE_PLAN_TASKS, payload: string };

// Gamification
export type AchievementId = 'exam_1' | 'exam_5' | 'score_100' | 'aid_1' | 'aid_10' | 'streak_3' | 'streak_7' | 'pomodoro_1';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: React.FC<SVGProps<SVGSVGElement>>;
}

export interface GamificationState {
  xp: number;
  level: number;
  lastStudiedDate: string | null;
  streak: number;
  unlockedAchievements: AchievementId[];
}

export enum GamificationActionType {
    ADD_XP = 'ADD_XP',
    CHECK_STREAK = 'CHECK_STREAK',
    UNLOCK_ACHIEVEMENT = 'UNLOCK_ACHIEVEMENT',
    RESET_GAMIFICATION = 'RESET_GAMIFICATION'
}

export type GamificationAction =
    | { type: GamificationActionType.ADD_XP, payload: number }
    | { type: GamificationActionType.CHECK_STREAK }
    | { type: GamificationActionType.UNLOCK_ACHIEVEMENT, payload: AchievementId }
    | { type: GamificationActionType.RESET_GAMIFICATION };
    
// AI Interaction
export type AIPersona = 'friendly' | 'formal' | 'motivational' | 'academic';
export type AIVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface AIMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface AIInteractionState {
  messages: AIMessage[];
  isThinking: boolean;
  isOpen: boolean;
  navigationPrompt: {
    isOpen: boolean;
    destination: string;
    message: string;
  };
  schedulingModal: {
    isOpen: boolean;
    taskDescription: string;
    dueDate?: string;
  }
}

export enum AIInteractionActionType {
    ADD_MESSAGE = 'ADD_MESSAGE',
    SET_IS_THINKING = 'SET_IS_THINKING',
    TOGGLE_WINDOW = 'TOGGLE_WINDOW',
    CLEAR_MESSAGES = 'CLEAR_MESSAGES',
    SHOW_NAVIGATION_PROMPT = 'SHOW_NAVIGATION_PROMPT',
    SHOW_SCHEDULING_MODAL = 'SHOW_SCHEDULING_MODAL',
    HIDE_INTERACTION = 'HIDE_INTERACTION',
}

export type AIInteractionAction = 
    | { type: AIInteractionActionType.ADD_MESSAGE, payload: AIMessage }
    | { type: AIInteractionActionType.SET_IS_THINKING, payload: boolean }
    | { type: AIInteractionActionType.TOGGLE_WINDOW }
    | { type: AIInteractionActionType.CLEAR_MESSAGES }
    | { type: AIInteractionActionType.SHOW_NAVIGATION_PROMPT, payload: { destination: string, message: string } }
    | { type: AIInteractionActionType.SHOW_SCHEDULING_MODAL, payload: { taskDescription: string, dueDate?: string } }
    | { type: AIInteractionActionType.HIDE_INTERACTION };

// Music
export interface MusicTrack {
  id: string;
  name: string;
  url: string;
}
export interface MusicState {
  currentTrackId: string | null;
  isPlaying: boolean;
  volume: number;
}
export enum MusicActionType {
  SET_TRACK = 'SET_TRACK',
  TOGGLE_PLAY = 'TOGGLE_PLAY',
  SET_VOLUME = 'SET_VOLUME',
}
export type MusicAction =
  | { type: MusicActionType.SET_TRACK, payload: string | null }
  | { type: MusicActionType.TOGGLE_PLAY }
  | { type: MusicActionType.SET_VOLUME, payload: number };

// Smart Settings
export interface SmartSettingsState {
  aiPersona: AIPersona;
  adaptiveLearning: boolean;
  autoPlanner: boolean;
  aiVoiceTutor: boolean;
  aiVoice: AIVoice;
}
export enum SmartSettingsActionType {
  SET_AI_PERSONA = 'SET_AI_PERSONA',
  SET_ADAPTIVE_LEARNING = 'SET_ADAPTIVE_LEARNING',
  SET_AUTO_PLANNER = 'SET_AUTO_PLANNER',
  SET_AI_VOICE_TUTOR = 'SET_AI_VOICE_TUTOR',
  SET_AI_VOICE = 'SET_AI_VOICE',
  SET_ALL_SETTINGS = 'SET_ALL_SETTINGS',
}
export type SmartSettingsAction =
  | { type: SmartSettingsActionType.SET_AI_PERSONA, payload: AIPersona }
  | { type: SmartSettingsActionType.SET_ADAPTIVE_LEARNING, payload: boolean }
  | { type: SmartSettingsActionType.SET_AUTO_PLANNER, payload: boolean }
  | { type: SmartSettingsActionType.SET_AI_VOICE_TUTOR, payload: boolean }
  | { type: SmartSettingsActionType.SET_AI_VOICE, payload: AIVoice }
  | { type: SmartSettingsActionType.SET_ALL_SETTINGS, payload: SmartSettingsState };

// Pomodoro
export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';
export type SessionType = 'focus' | 'review' | 'mock-exam';

export interface PomodoroState {
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  cycles: number;
  showSummary: boolean;
  sessionsToday: number;
  totalFocusTime: number; // in seconds
  sessionType: SessionType;
  pomodoroDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  lastSessionDate: string | null;
}
export enum PomodoroActionType {
  SET_MODE = 'SET_MODE',
  TICK = 'TICK',
  TOGGLE_ACTIVE = 'TOGGLE_ACTIVE',
  RESET = 'RESET',
  FINISH_SESSION = 'FINISH_SESSION',
  CLOSE_SUMMARY = 'CLOSE_SUMMARY',
  EXTEND_SESSION = 'EXTEND_SESSION',
  SET_SESSION_TYPE = 'SET_SESSION_TYPE',
  SET_DURATIONS = 'SET_DURATIONS',
}
export type PomodoroAction =
  | { type: PomodoroActionType.SET_MODE, payload: TimerMode }
  | { type: PomodoroActionType.TICK }
  | { type: PomodoroActionType.TOGGLE_ACTIVE }
  | { type: PomodoroActionType.RESET }
  | { type: PomodoroActionType.FINISH_SESSION }
  | { type: PomodoroActionType.CLOSE_SUMMARY }
  | { type: PomodoroActionType.EXTEND_SESSION, payload: number } // seconds
  | { type: PomodoroActionType.SET_SESSION_TYPE, payload: SessionType }
  | { type: PomodoroActionType.SET_DURATIONS, payload: { pomodoro: number, short: number, long: number } };

// Toast
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  title: string;
}

// Bookmarks
export interface Bookmark {
  examId: string;
  questionId: string;
}

export interface BookmarksState {
  bookmarks: Bookmark[];
}

export enum BookmarksActionType {
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  REMOVE_BOOKMARK = 'REMOVE_BOOKMARK',
}

export type BookmarksAction =
  | { type: BookmarksActionType.ADD_BOOKMARK, payload: Bookmark }
  | { type: BookmarksActionType.REMOVE_BOOKMARK, payload: { questionId: string } };

// Notes
export interface Note {
  examId: string;
  questionId: string;
  text: string;
}

export interface NotesState {
  notes: Note[];
}

export enum NotesActionType {
  SET_NOTE = 'SET_NOTE',
  DELETE_NOTE = 'DELETE_NOTE',
}

export type NotesAction =
  | { type: NotesActionType.SET_NOTE, payload: Note }
  | { type: NotesActionType.DELETE_NOTE, payload: { questionId: string } };
  
// Highlights
export interface Highlight {
  questionId: string;
  highlightedHtml: string;
}

export interface HighlightsState {
  questionHighlights: Highlight[];
}

export enum HighlightsActionType {
  SET_HIGHLIGHTS_FOR_QUESTION = 'SET_HIGHLIGHTS_FOR_QUESTION',
  CLEAR_HIGHLIGHTS_FOR_QUESTION = 'CLEAR_HIGHLIGHTS_FOR_QUESTION',
}

export type HighlightsAction =
  | { type: HighlightsActionType.SET_HIGHLIGHTS_FOR_QUESTION, payload: Highlight }
  | { type: HighlightsActionType.CLEAR_HIGHLIGHTS_FOR_QUESTION, payload: { questionId: string } };

// NEW: Unified state for settings, theme, avatar, etc.
export interface ThemeState {
  theme: ThemeName;
  accentColor: AccentColorName;
  isAutoTheme: boolean;
  background: BackgroundName;
  font: Font;
  buttonShape: ButtonShape;
  focusMode: boolean;
  mood: Mood;
  avatarId: AvatarId;
  phoneNumber: string;
  reduceMotion: boolean;
}

export enum ThemeActionType {
    TOGGLE_THEME = 'TOGGLE_THEME',
    SET_ACCENT_COLOR = 'SET_ACCENT_COLOR',
    TOGGLE_AUTO_THEME = 'TOGGLE_AUTO_THEME',
    SET_THEME_AND_ACCENT = 'SET_THEME_AND_ACCENT',
    SET_BACKGROUND = 'SET_BACKGROUND',
    SET_FONT = 'SET_FONT',
    SET_BUTTON_SHAPE = 'SET_BUTTON_SHAPE',
    SET_FOCUS_MODE = 'SET_FOCUS_MODE',
    SET_MOOD = 'SET_MOOD',
    SET_AVATAR_ID = 'SET_AVATAR_ID',
    SET_PHONE_NUMBER = 'SET_PHONE_NUMBER',
    SET_REDUCE_MOTION = 'SET_REDUCE_MOTION',
}

export type ThemeAction =
    | { type: ThemeActionType.TOGGLE_THEME }
    | { type: ThemeActionType.SET_ACCENT_COLOR, payload: AccentColorName }
    | { type: ThemeActionType.TOGGLE_AUTO_THEME }
    | { type: ThemeActionType.SET_THEME_AND_ACCENT, payload: { theme: ThemeName, accent: AccentColorName } }
    | { type: ThemeActionType.SET_BACKGROUND, payload: BackgroundName }
    | { type: ThemeActionType.SET_FONT, payload: Font }
    | { type: ThemeActionType.SET_BUTTON_SHAPE, payload: ButtonShape }
    | { type: ThemeActionType.SET_FOCUS_MODE, payload: boolean }
    | { type: ThemeActionType.SET_MOOD, payload: Mood }
    | { type: ThemeActionType.SET_AVATAR_ID, payload: AvatarId }
    | { type: ThemeActionType.SET_PHONE_NUMBER, payload: string }
    | { type: ThemeActionType.SET_REDUCE_MOTION, payload: boolean };

// Upcoming Exams
export interface UpcomingExam {
  id: string;
  title: string;
  date: string;
}

export interface UpcomingExamsState {
  upcomingExams: UpcomingExam[];
}

export enum UpcomingExamsActionType {
  ADD_UPCOMING_EXAM = 'ADD_UPCOMING_EXAM',
  DELETE_UPCOMING_EXAM = 'DELETE_UPCOMING_EXAM',
}

export type UpcomingExamsAction =
  | { type: UpcomingExamsActionType.ADD_UPCOMING_EXAM, payload: UpcomingExam }
  | { type: UpcomingExamsActionType.DELETE_UPCOMING_EXAM, payload: string };


// Master state for the entire application
export interface AppDataState {
    examState: AppState;
    studyAidsState: StudyAidsState;
    studyPlanState: StudyPlanState;
    tasksState: TasksState;
    gamificationState: GamificationState;
    themeState: ThemeState;
    aiInteractionState: AIInteractionState;
    musicState: MusicState;
    smartSettingsState: SmartSettingsState;
    pomodoroState: PomodoroState;
    bookmarksState: BookmarksState;
    notesState: NotesState;
    highlightsState: HighlightsState;
    upcomingExamsState: UpcomingExamsState;
}

export type AppDataAction =
    | Action
    | StudyAidsAction
    | StudyPlanAction
    | TasksAction
    | GamificationAction
    | ThemeAction
    | AIInteractionAction
    | MusicAction
    | SmartSettingsAction
    | PomodoroAction
    | BookmarksAction
    | NotesAction
    | HighlightsAction
    | UpcomingExamsAction;