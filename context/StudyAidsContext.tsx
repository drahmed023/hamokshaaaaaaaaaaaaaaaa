import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { StudyAidsState, StudyAidsAction, StudyAidsActionType } from '../types';

const initialState: StudyAidsState = {
  summaries: [],
  flashcardDecks: [],
  mindMaps: [],
};

const StudyAidsStateContext = createContext<StudyAidsState>(initialState);
const StudyAidsDispatchContext = createContext<Dispatch<StudyAidsAction>>(() => null);

const studyAidsReducer = (state: StudyAidsState, action: StudyAidsAction): StudyAidsState => {
  switch (action.type) {
    case StudyAidsActionType.ADD_SUMMARY:
      return { ...state, summaries: [...state.summaries, action.payload] };
    case StudyAidsActionType.UPDATE_SUMMARY:
      return { ...state, summaries: state.summaries.map(s => s.id === action.payload.id ? action.payload : s) };
    case StudyAidsActionType.DELETE_SUMMARY:
        return { ...state, summaries: state.summaries.filter(s => s.id !== action.payload) };
    case StudyAidsActionType.ADD_FLASHCARD_DECK:
        return { ...state, flashcardDecks: [...state.flashcardDecks, action.payload] };
    case StudyAidsActionType.UPDATE_FLASHCARD_DECK:
        return { ...state, flashcardDecks: state.flashcardDecks.map(d => d.id === action.payload.id ? action.payload : d) };
    case StudyAidsActionType.DELETE_FLASHCARD_DECK:
        return { ...state, flashcardDecks: state.flashcardDecks.filter(d => d.id !== action.payload) };
    case StudyAidsActionType.ADD_MIND_MAP:
        return { ...state, mindMaps: [...state.mindMaps, action.payload] };
    // Fix: Added case for UPDATE_MIND_MAP
    case StudyAidsActionType.UPDATE_MIND_MAP:
        return { ...state, mindMaps: state.mindMaps.map(m => m.id === action.payload.id ? action.payload : m) };
    case StudyAidsActionType.DELETE_MIND_MAP:
        return { ...state, mindMaps: state.mindMaps.filter(m => m.id !== action.payload) };
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof studyAidsReducer, key: string, initial: StudyAidsState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialState;
        } catch (error) {
            console.error("Error parsing state from localStorage", error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving state to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

// FIX: Changed from a const arrow function to a function declaration to resolve issues with the 'children' prop type in deeply nested contexts.
export function StudyAidsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(studyAidsReducer, 'studySparkAidsState', initialState);

  return (
    <StudyAidsStateContext.Provider value={state}>
      <StudyAidsDispatchContext.Provider value={dispatch}>
        {children}
      </StudyAidsDispatchContext.Provider>
    </StudyAidsStateContext.Provider>
  );
};

export { StudyAidsStateContext, StudyAidsDispatchContext };