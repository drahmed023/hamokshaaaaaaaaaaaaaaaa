
import { useContext } from 'react';
import { ExamStateContext, ExamDispatchContext } from '../context/ExamContext';

export const useExam = () => {
  const state = useContext(ExamStateContext);
  const dispatch = useContext(ExamDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return { ...state, dispatch };
};
