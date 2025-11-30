import { useAppData } from '../context/AppDataContext';

export const useStudyPlan = () => {
  const { state, dispatch } = useAppData();
  return { ...state.studyPlanState, dispatch };
};
