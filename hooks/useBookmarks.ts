import { useAppData } from '../context/AppDataContext';

export const useBookmarks = () => {
  const { state, dispatch } = useAppData();
  return { ...state.bookmarksState, dispatch };
};
