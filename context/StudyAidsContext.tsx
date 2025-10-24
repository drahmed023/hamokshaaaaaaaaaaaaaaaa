import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { StudyAidsState, StudyAidsAction, StudyAidsActionType, FlashcardDeck } from '../types';

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
      return { ...state, summaries: [action.payload, ...state.summaries] };
    case StudyAidsActionType.DELETE_SUMMARY:
      return { ...state, summaries: state.summaries.filter(s => s.id !== action.payload.id) };
    
    case StudyAidsActionType.ADD_FLASHCARD_DECK:
      return { ...state, flashcardDecks: [action.payload, ...state.flashcardDecks] };
    case StudyAidsActionType.DELETE_FLASHCARD_DECK:
        return { ...state, flashcardDecks: state.flashcardDecks.filter(d => d.id !== action.payload.id) };
    case StudyAidsActionType.UPDATE_FLASHCARD_DECK:
        return { 
            ...state, 
            flashcardDecks: state.flashcardDecks.map(deck => 
                deck.id === action.payload.id ? action.payload : deck
            ) 
        };

    case StudyAidsActionType.ADD_MIND_MAP:
      return { ...state, mindMaps: [action.payload, ...state.mindMaps] };
    case StudyAidsActionType.DELETE_MIND_MAP:
        return { ...state, mindMaps: state.mindMaps.filter(m => m.id !== action.payload.id) };

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
            console.error("Error parsing study aids state from localStorage", error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving study aids state to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

export const StudyAidsProvider = ({ children }: { children: ReactNode }) => {
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