import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { GamificationState, GamificationAction, GamificationActionType } from '../types';
import { getAchievement } from '../data/achievements';

const initialState: GamificationState = {
  xp: 0,
  level: 1,
  lastStudiedDate: null,
  streak: 0,
  unlockedAchievements: [],
};

// This is a bit of a hack to dispatch toasts from the reducer.
// In a larger app, this would be handled by a middleware or a thunk.
let toastDispatcher: (title: string, message: string) => void = () => {};
export const setGamificationToastDispatcher = (dispatcher: (title: string, message: string) => void) => {
    toastDispatcher = dispatcher;
};


const GamificationStateContext = createContext<GamificationState>(initialState);
const GamificationDispatchContext = createContext<Dispatch<GamificationAction>>(() => null);

const getXpForLevel = (level: number) => 100 * Math.pow(2, level - 1);

const gamificationReducer = (state: GamificationState, action: GamificationAction): GamificationState => {
  switch (action.type) {
    case GamificationActionType.ADD_XP: {
      let newXp = state.xp + action.payload;
      let newLevel = state.level;
      let xpForNextLevel = getXpForLevel(newLevel);
      let leveledUp = false;

      while (newXp >= xpForNextLevel) {
        newXp -= xpForNextLevel;
        newLevel++;
        leveledUp = true;
        xpForNextLevel = getXpForLevel(newLevel);
      }
      
      if (leveledUp) {
          toastDispatcher('Leveled Up!', `Congratulations! You've reached Level ${newLevel}!`);
      }
      
      const today = new Date().toISOString().split('T')[0];

      return { ...state, xp: newXp, level: newLevel, lastStudiedDate: today };
    }
    case GamificationActionType.CHECK_STREAK: {
        if (!state.lastStudiedDate) {
            return { ...state, streak: 0 };
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastStudied = new Date(state.lastStudiedDate);
        lastStudied.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - lastStudied.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        let newStreak = state.streak;
        if(diffDays > 1) {
            newStreak = 0; // Streak broken
        }

        const newAchievements = new Set(state.unlockedAchievements);
        if (newStreak >= 3 && !newAchievements.has('streak_3')) {
            newAchievements.add('streak_3');
            const ach = getAchievement('streak_3');
            if (ach) toastDispatcher(`Achievement Unlocked!`, ach.name);
        }
        if (newStreak >= 7 && !newAchievements.has('streak_7')) {
            newAchievements.add('streak_7');
            const ach = getAchievement('streak_7');
            if (ach) toastDispatcher(`Achievement Unlocked!`, ach.name);
        }

        return { ...state, streak: newStreak, unlockedAchievements: Array.from(newAchievements) };
    }
    case GamificationActionType.UNLOCK_ACHIEVEMENT: {
        if (state.unlockedAchievements.includes(action.payload)) {
            return state; // Already unlocked
        }
        const achievement = getAchievement(action.payload);
        if (achievement) {
            toastDispatcher('Achievement Unlocked!', achievement.name);
        }
        return { ...state, unlockedAchievements: [...state.unlockedAchievements, action.payload] };
    }
    case GamificationActionType.RESET_GAMIFICATION: {
        return initialState;
    }
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof gamificationReducer, key: string, initial: GamificationState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            const parsed = stored ? JSON.parse(stored) : initialState;
            // Migration for streak, ensuring it's a number
            if (typeof parsed.streak !== 'number') {
                parsed.streak = 0;
            }
            return parsed;
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
export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(gamificationReducer, 'studySparkGamificationState', initialState);

  return (
    <GamificationStateContext.Provider value={state}>
      <GamificationDispatchContext.Provider value={dispatch}>
        {children}
      </GamificationDispatchContext.Provider>
    </GamificationStateContext.Provider>
  );
};

export { GamificationStateContext, GamificationDispatchContext };