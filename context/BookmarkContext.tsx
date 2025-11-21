import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { BookmarksState, BookmarksAction, BookmarksActionType, Bookmark } from '../types';

const initialState: BookmarksState = {
  bookmarks: [],
};

export const BookmarksStateContext = createContext<BookmarksState>(initialState);
export const BookmarksDispatchContext = createContext<Dispatch<BookmarksAction>>(() => null);

const bookmarksReducer = (state: BookmarksState, action: BookmarksAction): BookmarksState => {
  switch (action.type) {
    case BookmarksActionType.ADD_BOOKMARK:
      if (state.bookmarks.some(b => b.questionId === action.payload.questionId)) {
        return state; // Already exists
      }
      return { ...state, bookmarks: [...state.bookmarks, action.payload] };
    case BookmarksActionType.REMOVE_BOOKMARK:
      return {
        ...state,
        bookmarks: state.bookmarks.filter(b => b.questionId !== action.payload.questionId),
      };
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof bookmarksReducer, key: string, initial: BookmarksState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialState;
        } catch (error) {
            console.error("Error parsing bookmarks state from localStorage", error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving bookmarks state to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

export function BookmarkProvider({ children }: { children?: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(bookmarksReducer, 'studySparkBookmarks', initialState);

  return (
    <BookmarksStateContext.Provider value={state}>
      <BookmarksDispatchContext.Provider value={dispatch}>
        {children}
      </BookmarksDispatchContext.Provider>
    </BookmarksStateContext.Provider>
  );
};
