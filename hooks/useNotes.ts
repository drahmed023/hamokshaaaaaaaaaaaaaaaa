import { useAppData } from '../context/AppDataContext';

export const useNotes = () => {
  const { state, dispatch } = useAppData();
  return { ...state.notesState, dispatch };
};
