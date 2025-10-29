import React, { ReactNode } from "react";

// General
// NOTE: Removed conflicting ActionType that was causing issues with the enum.
// export type ActionType = {
//   type: string;
//   payload?: any;
// };

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
  sourceFileName?: string;
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

// FIX: Renamed ActionType to ExamActionType to avoid name collision.
export enum ExamActionType {
  ADD_EXAM = 'ADD_EXAM',
  UPDATE_EXAM = 'UPDATE_EXAM',
  ADD_RESULT = 'ADD_RESULT',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
}

export type Action =
  | { type: ExamActionType.ADD_EXAM; payload: Exam }
  | { type: ExamActionType.UPDATE_EXAM; payload: Exam }
  | { type: ExamActionType.ADD_RESULT; payload: ExamResult }
  | { type: ExamActionType.SET_LOADING; payload: boolean }
  | { type: ExamActionType.SET_ERROR; payload: string | null };

// Study Aids
export interface Summary {
  id: string;
  title: string;
  content: string;
}

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    // For spaced repetition
    nextReview: string;
    interval: number; // in days
    easeFactor: number;
}

export interface FlashcardDeck {
    id: string;
    title: string;
    cards: Flashcard[];
}

export interface MindMapNodeData {
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
  | { type: StudyAidsActionType.ADD_SUMMARY; payload: Summary }
  | { type: StudyAidsActionType.UPDATE_SUMMARY; payload: Summary }
  | { type: StudyAidsActionType.DELETE_SUMMARY; payload: string }
  | { type: StudyAidsActionType.ADD_FLASHCARD_DECK; payload: FlashcardDeck }
  | { type: StudyAidsActionType.UPDATE_FLASHCARD_DECK; payload: FlashcardDeck }
  | { type: StudyAidsActionType.DELETE_FLASHCARD_DECK; payload: string }
  | { type: StudyAidsActionType.ADD_MIND_MAP; payload: MindMap }
  | { type: StudyAidsActionType.UPDATE_MIND_MAP; payload: MindMap }
  | { type: StudyAidsActionType.DELETE_MIND_MAP; payload: string };

// Theme
export type ThemeName = 'light' | 'dark' | 'calm';
export type AccentColorName = 'indigo' | 'sky' | 'rose' | 'emerald' | 'orange';
export type BackgroundName = 'default' | 'sunset' | 'galaxy' | 'office';
export type Font = 'modern' | 'classic' | 'study';
export type ButtonShape = 'rounded' | 'sharp' | 'pill';
export type Mood = 'neutral' | 'focused' | 'relaxed' | 'motivated';


// Tasks
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  // FIX: Add optional source property to track where a task originated.
  source?: 'user' | 'study_plan';
}

export interface TasksState {
  tasks: Task[];
}

export enum TasksActionType {
  ADD_TASK = 'ADD_TASK',
  TOGGLE_TASK = 'TOGGLE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  EDIT_TASK = 'EDIT_TASK',
}

export type TasksAction =
  | { type: TasksActionType.ADD_TASK; payload: Task }
  | { type: TasksActionType.TOGGLE_TASK; payload: string }
  | { type: TasksActionType.DELETE_TASK; payload: string }
  | { type: TasksActionType.EDIT_TASK; payload: { id: string; text: string } };

// Study Plan
export interface StudyTask {
  task: string;
  duration: number; // in minutes
  priority: 'High' | 'Medium' | 'Low';
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
  // FIX: Add optional startDate property to track when a plan was created.
  startDate?: string;
}

export interface StudyPlanState {
  plan: StudyPlan | null;
  loading: boolean;
  error: string | null;
}

export enum StudyPlanActionType {
  SET_PLAN = 'SET_PLAN',
  CLEAR_PLAN = 'CLEAR_PLAN',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
}

export type StudyPlanAction =
  | { type: StudyPlanActionType.SET_PLAN; payload: StudyPlan }
  | { type: StudyPlanActionType.CLEAR_PLAN }
  | { type: StudyPlanActionType.SET_LOADING; payload: boolean }
  | { type: StudyPlanActionType.SET_ERROR; payload: string | null };

// Gamification
// FIX: Added 'pomodoro_1' to AchievementId to support Pomodoro achievements.
export type AchievementId = 'exam_1' | 'exam_5' | 'score_100' | 'aid_1' | 'aid_10' | 'streak_3' | 'streak_7' | 'pomodoro_1';


export interface Achievement {
    id: AchievementId;
    name: string;
    description: string;
    // FIX: Imported React namespace to correctly type icon components.
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
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
    RESET_GAMIFICATION = 'RESET_GAMIFICATION',
}

export type GamificationAction =
  | { type: GamificationActionType.ADD_XP; payload: number }
  | { type: GamificationActionType.CHECK_STREAK }
  | { type: GamificationActionType.UNLOCK_ACHIEVEMENT; payload: AchievementId }
  | { type: GamificationActionType.RESET_GAMIFICATION };
// FIX: Add AI Interaction types to resolve missing type errors.
// AI Interaction
export interface AIMessage {
  role: 'user' | 'model' | 'system';
  parts: { text: string }[];
  toolCalls?: any[];
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
  };
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
  | { type: AIInteractionActionType.ADD_MESSAGE; payload: AIMessage }
  | { type: AIInteractionActionType.SET_IS_THINKING; payload: boolean }
  | { type: AIInteractionActionType.TOGGLE_WINDOW }
  | { type: AIInteractionActionType.CLEAR_MESSAGES }
  | { type: AIInteractionActionType.SHOW_NAVIGATION_PROMPT; payload: { destination: string; message: string } }
  | { type: AIInteractionActionType.SHOW_SCHEDULING_MODAL; payload: { taskDescription: string, dueDate?: string } }
  | { type: AIInteractionActionType.HIDE_INTERACTION };

// Toast
export type ToastMessage = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  title: string;
};

// Avatar
export type AvatarId = 'avatar1' | 'avatar2' | 'avatar3' | 'avatar4' | 'avatar5' | 'avatar6';

// Music
export type MusicTrack = {
  id: string;
  name: string;
  url: string;
};

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
export type AIPersona = 'friendly' | 'formal' | 'motivational' | 'academic';
export type AIVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

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
    | { type: SmartSettingsActionType.SET_AI_PERSONA; payload: AIPersona }
    | { type: SmartSettingsActionType.SET_ADAPTIVE_LEARNING; payload: boolean }
    | { type: SmartSettingsActionType.SET_AUTO_PLANNER; payload: boolean }
    | { type: SmartSettingsActionType.SET_AI_VOICE_TUTOR; payload: boolean }
    | { type: SmartSettingsActionType.SET_AI_VOICE; payload: AIVoice }
    | { type: SmartSettingsActionType.SET_ALL_SETTINGS; payload: SmartSettingsState };
// FIX: Add Pomodoro types to resolve missing type errors.
// Pomodoro Timer
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
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
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
  | { type: PomodoroActionType.SET_MODE; payload: TimerMode }
  | { type: PomodoroActionType.TICK }
  | { type: PomodoroActionType.TOGGLE_ACTIVE }
  | { type: PomodoroActionType.RESET }
  | { type: PomodoroActionType.FINISH_SESSION }
  | { type: PomodoroActionType.CLOSE_SUMMARY }
  | { type: PomodoroActionType.EXTEND_SESSION; payload: number }
  | { type: PomodoroActionType.SET_SESSION_TYPE; payload: SessionType }
  | { type: PomodoroActionType.SET_DURATIONS; payload: { pomodoro: number; short: number; long: number } };