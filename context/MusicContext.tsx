import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { MusicState, MusicAction, MusicActionType } from '../types';

const initialState: MusicState = {
  currentTrackId: null,
  isPlaying: false,
  volume: 0.5,
};

const MusicStateContext = createContext<MusicState>(initialState);
const MusicDispatchContext = createContext<Dispatch<MusicAction>>(() => null);

const musicReducer = (state: MusicState, action: MusicAction): MusicState => {
  switch (action.type) {
    case MusicActionType.SET_TRACK:
      // FIX: Only keep playing if music was already playing.
      // This prevents autoplay on the first non-interactive selection and fixes the error.
      const shouldKeepPlaying = state.isPlaying && !!action.payload;
      return { ...state, currentTrackId: action.payload, isPlaying: shouldKeepPlaying };
    case MusicActionType.TOGGLE_PLAY:
      // Can only play if a track is selected
      return { ...state, isPlaying: state.currentTrackId ? !state.isPlaying : false };
    case MusicActionType.SET_VOLUME:
      return { ...state, volume: action.payload };
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof musicReducer, key: string, initial: MusicState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            const parsed = stored ? JSON.parse(stored) : initialState;
            // Don't auto-play on load
            return { ...parsed, isPlaying: false };
        } catch (error) {
            console.error("Error parsing music state from localStorage", error);
            return { ...initialState, isPlaying: false };
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving music state to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

// FIX: Changed from a const arrow function to a function declaration to resolve issues with the 'children' prop type in deeply nested contexts.
export function MusicProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(musicReducer, 'musicSettings', initialState);
  
  return (
    // FIX: The value passed to MusicStateContext must match its type, which is MusicState.
    // The useMusic hook correctly combines state and dispatch to provide action functions.
    <MusicStateContext.Provider value={state}>
      <MusicDispatchContext.Provider value={dispatch}>
        {children}
      </MusicDispatchContext.Provider>
    </MusicStateContext.Provider>
  );
};

export { MusicStateContext, MusicDispatchContext };