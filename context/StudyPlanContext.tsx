import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { StudyPlanState, StudyPlanAction, StudyPlanActionType } from '../types';

const initialState: StudyPlanState = {
  plans: [],
  activePlanId: null,
  loading: false,
  error: null,
};

const StudyPlanStateContext = createContext<StudyPlanState>(initialState);
const StudyPlanDispatchContext = createContext<Dispatch<StudyPlanAction>>(() => null);

const studyPlanReducer = (state: StudyPlanState, action: StudyPlanAction): StudyPlanState => {
  switch (action.type) {
    case StudyPlanActionType.ADD_PLAN:
      return { ...state, plans: [...state.plans, action.payload], loading: false, error: null };
    case StudyPlanActionType.DELETE_PLAN:
      return {
        ...state,
        plans: state.plans.filter(p => p.id !== action.payload),
        activePlanId: state.activePlanId === action.payload ? null : state.activePlanId,
      };
    case StudyPlanActionType.SET_ACTIVE_PLAN:
      return { ...state, activePlanId: action.payload };
    case StudyPlanActionType.SET_LOADING:
      return { ...state, loading: action.payload };
    case StudyPlanActionType.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof studyPlanReducer, key: string, initial: StudyPlanState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialState;
        } catch (error) {
            console.error("Error parsing study plan state from localStorage", error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving study plan to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

export function StudyPlanProvider({ children }: { children?: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(studyPlanReducer, 'studySparkPlanState', initialState);

  return (
    <StudyPlanStateContext.Provider value={state}>
      <StudyPlanDispatchContext.Provider value={dispatch}>
        {children}
      </StudyPlanDispatchContext.Provider>
    </StudyPlanStateContext.Provider>
  );
};

export { StudyPlanStateContext, StudyPlanDispatchContext };