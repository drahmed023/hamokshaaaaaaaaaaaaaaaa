import { useAppData } from '../context/AppDataContext';

export const useExam = () => {
  const { state, dispatch } = useAppData();
  // Return the specific slice of state and the global dispatch
  return { ...state.examState, dispatch };
};
