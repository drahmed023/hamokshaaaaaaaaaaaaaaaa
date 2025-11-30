import { useAppData } from '../context/AppDataContext';

export const useStudyAids = () => {
  const { state, dispatch } = useAppData();
  return { ...state.studyAidsState, dispatch };
};
