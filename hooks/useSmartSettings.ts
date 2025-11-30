import { useAppData } from '../context/AppDataContext';

export const useSmartSettings = () => {
  const { state, dispatch } = useAppData();
  return { ...state.smartSettingsState, dispatch };
};
