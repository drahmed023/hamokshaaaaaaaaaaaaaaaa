import { useAppData } from '../context/AppDataContext';

export const useHighlights = () => {
  const { state, dispatch } = useAppData();
  return { ...state.highlightsState, dispatch };
};
