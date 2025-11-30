import { useAppData } from '../context/AppDataContext';

export const useGamification = () => {
  const { state, dispatch } = useAppData();
  return { ...state.gamificationState, dispatch };
};
