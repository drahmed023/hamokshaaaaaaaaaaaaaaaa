import { useContext } from 'react';
import { NotesStateContext, NotesDispatchContext } from '../context/NotesContext';

export const useNotes = () => {
  const state = useContext(NotesStateContext);
  const dispatch = useContext(NotesDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return { ...state, dispatch };
};