
import { useContext } from 'react';
import { StudyPlanStateContext, StudyPlanDispatchContext } from '../context/StudyPlanContext';

export const useStudyPlan = () => {
  const state = useContext(StudyPlanStateContext);
  const dispatch = useContext(StudyPlanDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useStudyPlan must be used within a StudyPlanProvider');
  }
  return { ...state, dispatch };
};
