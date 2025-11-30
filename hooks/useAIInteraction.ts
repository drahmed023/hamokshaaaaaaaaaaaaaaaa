import { useAppData } from '../context/AppDataContext';

export const useAIInteraction = () => {
  const { state, dispatch } = useAppData();
  return { ...state.aiInteractionState, dispatch };
};
