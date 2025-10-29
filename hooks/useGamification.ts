import { useContext } from 'react';
import { GamificationStateContext, GamificationDispatchContext } from '../context/GamificationContext';

export const useGamification = () => {
  const state = useContext(GamificationStateContext);
  const dispatch = useContext(GamificationDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return { ...state, dispatch };
};
