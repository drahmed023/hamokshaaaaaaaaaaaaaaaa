import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { NotesState, NotesAction, NotesActionType, Note } from '../types';

const initialState: NotesState = {
  notes: [],
};

export const NotesStateContext = createContext<NotesState>(initialState);
export const NotesDispatchContext = createContext<Dispatch<NotesAction>>(() => null);

const notesReducer = (state: NotesState, action: NotesAction): NotesState => {
  switch (action.type) {
    case NotesActionType.SET_NOTE:
      const existingNoteIndex = state.notes.findIndex(n => n.questionId === action.payload.questionId);
      if (existingNoteIndex > -1) {
        // Update existing note
        const newNotes = [...state.notes];
        newNotes[existingNoteIndex] = action.payload;
        return { ...state, notes: newNotes };
      }
      // Add new note
      return { ...state, notes: [...state.notes, action.payload] };
    case NotesActionType.DELETE_NOTE:
      return {
        ...state,
        notes: state.notes.filter(n => n.questionId !== action.payload.questionId),
      };
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof notesReducer, key: string, initial: NotesState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialState;
        } catch (error) {
            console.error("Error parsing notes state from localStorage", error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving notes state to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

export function NotesProvider({ children }: { children?: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(notesReducer, 'studySparkNotes', initialState);

  return (
    <NotesStateContext.Provider value={state}>
      <NotesDispatchContext.Provider value={dispatch}>
        {children}
      </NotesDispatchContext.Provider>
    </NotesStateContext.Provider>
  );
};