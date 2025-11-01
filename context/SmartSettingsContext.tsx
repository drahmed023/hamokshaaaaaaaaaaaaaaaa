import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { SmartSettingsState, SmartSettingsAction, SmartSettingsActionType, AIVoice } from '../types';

const initialState: SmartSettingsState = {
  aiPersona: 'friendly',
  adaptiveLearning: false,
  autoPlanner: false,
  aiVoiceTutor: false,
  aiVoice: 'Kore',
};

const SmartSettingsStateContext = createContext<SmartSettingsState>(initialState);
const SmartSettingsDispatchContext = createContext<Dispatch<SmartSettingsAction>>(() => null);

const smartSettingsReducer = (state: SmartSettingsState, action: SmartSettingsAction): SmartSettingsState => {
  switch (action.type) {
    case SmartSettingsActionType.SET_AI_PERSONA:
      return { ...state, aiPersona: action.payload };
    case SmartSettingsActionType.SET_ADAPTIVE_LEARNING:
      return { ...state, adaptiveLearning: action.payload };
    case SmartSettingsActionType.SET_AUTO_PLANNER:
        return { ...state, autoPlanner: action.payload };
    case SmartSettingsActionType.SET_AI_VOICE_TUTOR:
        return { ...state, aiVoiceTutor: action.payload };
    case SmartSettingsActionType.SET_AI_VOICE:
        return { ...state, aiVoice: action.payload };
    case SmartSettingsActionType.SET_ALL_SETTINGS:
        return { ...state, ...action.payload };
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof smartSettingsReducer, key: string, initial: SmartSettingsState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? { ...initialState, ...JSON.parse(stored) } : initialState;
        } catch (error) {
            console.error("Error parsing smart settings from localStorage", error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving smart settings to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

// FIX: Changed from a const arrow function to a function declaration to resolve issues with the 'children' prop type in deeply nested contexts.
export function SmartSettingsProvider({ children }: { children?: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(smartSettingsReducer, 'smartSettings', initialState);

  return (
    <SmartSettingsStateContext.Provider value={state}>
      <SmartSettingsDispatchContext.Provider value={dispatch}>
        {children}
      </SmartSettingsDispatchContext.Provider>
    </SmartSettingsStateContext.Provider>
  );
};

export { SmartSettingsStateContext, SmartSettingsDispatchContext };