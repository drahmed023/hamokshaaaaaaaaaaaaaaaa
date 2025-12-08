import { useAppData } from '../context/AppDataContext';

export const useUpcomingExams = () => {
  const { state, dispatch } = useAppData();
  return { ...state.upcomingExamsState, dispatch };
};
