import { useContext } from 'react';
import { StudyAidsStateContext, StudyAidsDispatchContext } from '../context/StudyAidsContext';

export const useStudyAids = () => {
  const state = useContext(StudyAidsStateContext);
  const dispatch = useContext(StudyAidsDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useStudyAids must be used within a StudyAidsProvider');
  }
  return { ...state, dispatch };
};
