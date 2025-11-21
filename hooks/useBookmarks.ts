import { useContext } from 'react';
import { BookmarksStateContext, BookmarksDispatchContext } from '../context/BookmarkContext';

export const useBookmarks = () => {
  const state = useContext(BookmarksStateContext);
  const dispatch = useContext(BookmarksDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return { ...state, dispatch };
};
