
import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
// FIX: Updated to use renamed ExamActionType to avoid type conflicts.
import { AppState, Action, ExamActionType, Exam, ExamResult } from '../types';

const initialState: AppState = {
  exams: [],
  results: [],
  loading: false,
  error: null,
};

const ExamStateContext = createContext<AppState>(initialState);
const ExamDispatchContext = createContext<Dispatch<Action>>(() => null);

const examReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    // FIX: Using ExamActionType for correct type narrowing.
    case ExamActionType.ADD_EXAM:
      return { ...state, exams: [...state.exams, action.payload] };
    // FIX: Using ExamActionType for correct type narrowing.
    case ExamActionType.UPDATE_EXAM:
      return {
        ...state,
        exams: state.exams.map(exam =>
          exam.id === action.payload.id ? action.payload : exam
        ),
      };
    // FIX: Using ExamActionType for correct type narrowing.
    case ExamActionType.ADD_RESULT:
      return { ...state, results: [...state.results.filter(r => r.examId !== action.payload.examId), action.payload] };
    // FIX: Using ExamActionType for correct type narrowing.
    case ExamActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    // FIX: Using ExamActionType for correct type narrowing.
    case ExamActionType.SET_ERROR:
        return { ...state, error: action.payload, loading: false };
    case ExamActionType.DELETE_RESULT:
      return {
        ...state,
        results: state.results.filter(r => r.examId !== action.payload),
      };
    default:
      return state;
  }
};

// Custom hook for persisting state to localStorage
const usePersistedReducer = (reducer: typeof examReducer, key: string, initial: AppState) => {
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
export function ExamProvider({ children }: { children?: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(examReducer, 'aiExamMakerState', initialState);

  return (
    <ExamStateContext.Provider value={state}>
      <ExamDispatchContext.Provider value={dispatch}>
        {children}
      </ExamDispatchContext.Provider>
    </ExamStateContext.Provider>
  );
};

export { ExamStateContext, ExamDispatchContext };