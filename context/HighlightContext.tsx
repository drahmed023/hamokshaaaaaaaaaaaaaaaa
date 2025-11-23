import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { HighlightsState, HighlightsAction, HighlightsActionType, Highlight } from '../types';

const initialState: HighlightsState = {
  questionHighlights: [],
};

export const HighlightsStateContext = createContext<HighlightsState>(initialState);
export const HighlightsDispatchContext = createContext<Dispatch<HighlightsAction>>(() => null);

const highlightsReducer = (state: HighlightsState, action: HighlightsAction): HighlightsState => {
  switch (action.type) {
    case HighlightsActionType.SET_HIGHLIGHTS_FOR_QUESTION: {
      const existingIndex = state.questionHighlights.findIndex(h => h.questionId === action.payload.questionId);
      if (existingIndex > -1) {
        const newHighlights = [...state.questionHighlights];
        newHighlights[existingIndex] = action.payload;
        return { ...state, questionHighlights: newHighlights };
      }
      return { ...state, questionHighlights: [...state.questionHighlights, action.payload] };
    }
    case HighlightsActionType.CLEAR_HIGHLIGHTS_FOR_QUESTION: {
      return {
        ...state,
        questionHighlights: state.questionHighlights.filter(h => h.questionId !== action.payload.questionId),
      };
    }
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof highlightsReducer, key: string, initial: HighlightsState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialState;
        } catch (error) {
            console.error("Error parsing highlights state from localStorage", error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving highlights state to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

export function HighlightProvider({ children }: { children?: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(highlightsReducer, 'studySparkHighlights', initialState);

  return (
    <HighlightsStateContext.Provider value={state}>
      <HighlightsDispatchContext.Provider value={dispatch}>
        {children}
      </HighlightsDispatchContext.Provider>
    </HighlightsStateContext.Provider>
  );
};