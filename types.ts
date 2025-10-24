export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
}

export interface Exam {
  id: string;
  title: string;
  questions: Question[];
  sourceFileName?: string;
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

export enum ActionType {
  ADD_EXAM = 'ADD_EXAM',
  ADD_RESULT = 'ADD_RESULT',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
}

export type Action =
  | { type: ActionType.ADD_EXAM; payload: Exam }
  | { type: ActionType.ADD_RESULT; payload: ExamResult }
  | { type: ActionType.SET_LOADING; payload: boolean }
  | { type: ActionType.SET_ERROR; payload: string | null };

// Study Aids
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  // Spaced Repetition fields
  nextReview: string; // ISO date string
  interval: number; // in days
  easeFactor: number; // difficulty factor
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
  DELETE_SUMMARY = 'DELETE_SUMMARY',
  ADD_FLASHCARD_DECK = 'ADD_FLASHCARD_DECK',
  DELETE_FLASHCARD_DECK = 'DELETE_FLASHCARD_DECK',
  UPDATE_FLASHCARD_DECK = 'UPDATE_FLASHCARD_DECK',
  ADD_MIND_MAP = 'ADD_MIND_MAP',
  DELETE_MIND_MAP = 'DELETE_MIND_MAP',
}

export type StudyAidsAction =
  | { type: StudyAidsActionType.ADD_SUMMARY; payload: Summary }
  | { type: StudyAidsActionType.DELETE_SUMMARY; payload: { id: string } }
  | { type: StudyAidsActionType.ADD_FLASHCARD_DECK; payload: FlashcardDeck }
  | { type: StudyAidsActionType.DELETE_FLASHCARD_DECK; payload: { id: string } }
  | { type: StudyAidsActionType.UPDATE_FLASHCARD_DECK; payload: FlashcardDeck }
  | { type: StudyAidsActionType.ADD_MIND_MAP; payload: MindMap }
  | { type: StudyAidsActionType.DELETE_MIND_MAP; payload: { id: string } };

// Tasks
export interface Task {
    id: string;
    text: string;
    completed: boolean;
}
