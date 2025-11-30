import { useAppData } from '../context/AppDataContext';

export const useTasks = () => {
  const { state, dispatch } = useAppData();
  return { ...state.tasksState, dispatch };
};
