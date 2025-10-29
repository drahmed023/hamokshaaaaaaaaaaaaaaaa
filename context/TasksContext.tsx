import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { TasksState, TasksAction, TasksActionType, Task } from '../types';

const initialState: TasksState = {
  tasks: [],
};

const TasksStateContext = createContext<TasksState>(initialState);
const TasksDispatchContext = createContext<Dispatch<TasksAction>>(() => null);

const tasksReducer = (state: TasksState, action: TasksAction): TasksState => {
  switch (action.type) {
    case TasksActionType.ADD_TASK:
      return { ...state, tasks: [...state.tasks, action.payload] };
    case TasksActionType.TOGGLE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload ? { ...task, completed: !task.completed } : task
        ),
      };
    case TasksActionType.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case TasksActionType.EDIT_TASK:
        return {
            ...state,
            tasks: state.tasks.map(task =>
                task.id === action.payload.id ? { ...task, text: action.payload.text } : task
            ),
        };
    default:
      return state;
  }
};

const usePersistedReducer = (reducer: typeof tasksReducer, key: string, initial: TasksState) => {
    const [state, dispatch] = useReducer(reducer, initial, (initialState) => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialState;
        } catch (error) {
            console.error("Error parsing tasks state from localStorage", error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving tasks state to localStorage", error);
        }
    }, [state, key]);

    return [state, dispatch] as const;
};

// FIX: Changed from a const arrow function to a function declaration to resolve issues with the 'children' prop type in deeply nested contexts.
export function TasksProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(tasksReducer, 'studySparkTasks', initialState);

  return (
    <TasksStateContext.Provider value={state}>
      <TasksDispatchContext.Provider value={dispatch}>
        {children}
      </TasksDispatchContext.Provider>
    </TasksStateContext.Provider>
  );
};

export { TasksStateContext, TasksDispatchContext };