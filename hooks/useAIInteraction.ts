import { useContext } from 'react';
import { AIInteractionStateContext, AIInteractionDispatchContext } from '../context/AIInteractionContext';

export const useAIInteraction = () => {
  const state = useContext(AIInteractionStateContext);
  const dispatch = useContext(AIInteractionDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useAIInteraction must be used within an AIInteractionProvider');
  }
  return { ...state, dispatch };
};