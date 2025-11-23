import { useContext } from 'react';
import { HighlightsStateContext, HighlightsDispatchContext } from '../context/HighlightContext';

export const useHighlights = () => {
  const state = useContext(HighlightsStateContext);
  const dispatch = useContext(HighlightsDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useHighlights must be used within a HighlightProvider');
  }
  return { ...state, dispatch };
};