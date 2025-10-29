import { useContext } from 'react';
import { TasksStateContext, TasksDispatchContext } from '../context/TasksContext';

export const useTasks = () => {
  const state = useContext(TasksStateContext);
  const dispatch = useContext(TasksDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return { ...state, dispatch };
};
