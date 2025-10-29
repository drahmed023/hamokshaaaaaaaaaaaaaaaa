import { useContext } from 'react';
import { PomodoroStateContext, PomodoroDispatchContext } from '../context/PomodoroContext';

export const usePomodoro = () => {
  const state = useContext(PomodoroStateContext);
  const dispatch = useContext(PomodoroDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return { state, dispatch };
};