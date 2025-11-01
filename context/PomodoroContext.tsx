
import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { PomodoroState, PomodoroAction, PomodoroActionType, TimerMode } from '../types';

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

// FIX: Replaced the previous sound file with a reliable, browser-compatible notification sound file.
const NOTIFICATION_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';

// Singleton for AudioContext and buffer to avoid re-initialization
let audioContext: AudioContext | null = null;
let notificationBuffer: AudioBuffer | null = null;

const initializeAudio = async () => {
    // Ensure this runs only in the browser
    if (typeof window !== 'undefined' && !audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            // Fetch and decode the audio file into a buffer
            const response = await fetch(NOTIFICATION_SOUND_URL);
            const arrayBuffer = await response.arrayBuffer();
            notificationBuffer = await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error("Error initializing audio:", error);
            // This handles the "Unable to decode audio data" error by logging it.
            // Using a reliable .ogg file should prevent this error in the first place.
        }
    }
};

const playNotificationSound = () => {
    if (audioContext && notificationBuffer && audioContext.state === 'running') {
        const source = audioContext.createBufferSource();
        source.buffer = notificationBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }
};

const getTimeForMode = (mode: TimerMode, state: PomodoroState): number => {
    switch (mode) {
        case 'pomodoro': return state.pomodoroDuration * 60;
        case 'shortBreak': return state.shortBreakDuration * 60;
        case 'longBreak': return state.longBreakDuration * 60;
        default: return state.pomodoroDuration * 60;
    }
};

const initialState: PomodoroState = {
  mode: 'pomodoro',
  timeLeft: POMODORO_TIME,
  isActive: false,
  cycles: 0,
  showSummary: false,
  sessionsToday: 0,
  totalFocusTime: 0,
  sessionType: 'focus',
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  lastSessionDate: null,
};

const PomodoroStateContext = createContext<PomodoroState>(initialState);
const PomodoroDispatchContext = createContext<Dispatch<PomodoroAction>>(() => null);

const pomodoroReducer = (state: PomodoroState, action: PomodoroAction): PomodoroState => {
  switch (action.type) {
    case PomodoroActionType.SET_MODE:
      return {
        ...state,
        mode: action.payload,
        timeLeft: getTimeForMode(action.payload, state),
        isActive: false,
      };
    case PomodoroActionType.TICK: {
      if (!state.isActive) return state;
      const newTimeLeft = state.timeLeft - 1;
      const newTotalFocusTime = state.mode === 'pomodoro' ? state.totalFocusTime + 1 : state.totalFocusTime;
      return { ...state, timeLeft: newTimeLeft, totalFocusTime: newTotalFocusTime };
    }
    case PomodoroActionType.TOGGLE_ACTIVE:
      // This is the user interaction that unlocks the audio context.
      if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume();
      }
      return { ...state, isActive: !state.isActive };
    case PomodoroActionType.RESET: {
      return {
        ...state,
        timeLeft: getTimeForMode(state.mode, state),
        isActive: false,
      };
    }
    case PomodoroActionType.FINISH_SESSION: {
      playNotificationSound(); // Play sound when session finishes.
      if (state.mode === 'pomodoro') {
        const newCycles = state.cycles + 1;
        const nextMode: TimerMode = newCycles % 4 === 0 ? 'longBreak' : 'shortBreak';
        const today = new Date().toISOString().split('T')[0];
        const newSessionsToday = state.lastSessionDate === today ? state.sessionsToday + 1 : 1;

        return {
          ...state,
          isActive: false,
          mode: nextMode,
          timeLeft: getTimeForMode(nextMode, state),
          cycles: newCycles,
          sessionsToday: newSessionsToday,
          showSummary: true,
          lastSessionDate: today,
        };
      } else {
        const nextMode: TimerMode = 'pomodoro';
        return {
          ...state,
          isActive: false,
          mode: nextMode,
          timeLeft: getTimeForMode(nextMode, state),
        };
      }
    }
    case PomodoroActionType.CLOSE_SUMMARY:
      return { ...state, showSummary: false };
    case PomodoroActionType.EXTEND_SESSION:
      return { ...state, timeLeft: state.timeLeft + action.payload };
    case PomodoroActionType.SET_SESSION_TYPE:
      return { ...state, sessionType: action.payload };
    case PomodoroActionType.SET_DURATIONS:
      const newState = {
        ...state,
        pomodoroDuration: action.payload.pomodoro,
        shortBreakDuration: action.payload.short,
        longBreakDuration: action.payload.long,
      };
      // If not active, update current timer immediately
      if (!state.isActive) {
        newState.timeLeft = getTimeForMode(state.mode, newState);
      }
      return newState;
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof pomodoroReducer, key: string, initial: PomodoroState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            const parsed = stored ? JSON.parse(stored) : initialState;
            
            // Daily reset logic
            const today = new Date().toISOString().split('T')[0];
            if (parsed.lastSessionDate !== today) {
                parsed.sessionsToday = 0;
                parsed.totalFocusTime = 0;
            }

            // Ensure timeLeft is reset based on stored durations
            const loadedState = { ...initialState, ...parsed, isActive: false, showSummary: false };
            loadedState.timeLeft = getTimeForMode(loadedState.mode, loadedState);
            return loadedState;
        } catch (error) {
            console.error("Error parsing pomodoro state from localStorage", error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify({ ...state, isActive: false, showSummary: false }));
        } catch (error) {
            console.error("Error saving pomodoro state to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};


// FIX: Changed from a const arrow function to a function declaration to resolve issues with the 'children' prop type in deeply nested contexts.
export function PomodoroProvider({ children }: { children?: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(pomodoroReducer, 'pomodoroState', initialState);

  // Initialize audio context once when the app loads.
  useEffect(() => {
    initializeAudio();
  }, []);

  useEffect(() => {
    let interval: number | null = null;
    if (state.isActive && state.timeLeft > 0) {
      interval = window.setInterval(() => {
        dispatch({ type: PomodoroActionType.TICK });
      }, 1000);
    } else if (state.isActive && state.timeLeft <= 0) {
      dispatch({ type: PomodoroActionType.FINISH_SESSION });
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [state.isActive, state.timeLeft]);

  return (
    <PomodoroStateContext.Provider value={state}>
      <PomodoroDispatchContext.Provider value={dispatch}>
        {children}
      </PomodoroDispatchContext.Provider>
    </PomodoroStateContext.Provider>
  );
};

export { PomodoroStateContext, PomodoroDispatchContext };