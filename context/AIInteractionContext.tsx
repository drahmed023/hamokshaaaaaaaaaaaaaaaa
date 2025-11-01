import React, { createContext, useReducer, ReactNode, Dispatch } from 'react';
import { AIInteractionState, AIInteractionAction, AIInteractionActionType, AIMessage } from '../types';

const defaultSystemMessage: AIMessage = {
    role: 'model',
    parts: [{text: "Hello! I'm your AI Study Companion. How can I help you today?"}]
};

const initialState: AIInteractionState = {
  messages: [defaultSystemMessage],
  isThinking: false,
  isOpen: false,
  // FIX: Initialize all state properties to match the AIInteractionState type.
  navigationPrompt: {
    isOpen: false,
    destination: '',
    message: '',
  },
  schedulingModal: {
    isOpen: false,
    taskDescription: '',
    dueDate: undefined,
  },
};

const AIInteractionStateContext = createContext<AIInteractionState>(initialState);
const AIInteractionDispatchContext = createContext<Dispatch<AIInteractionAction>>(() => null);

const aiInteractionReducer = (state: AIInteractionState, action: AIInteractionAction): AIInteractionState => {
  switch (action.type) {
    case AIInteractionActionType.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, action.payload] };
    case AIInteractionActionType.SET_IS_THINKING:
      return { ...state, isThinking: action.payload };
    case AIInteractionActionType.TOGGLE_WINDOW:
      return { ...state, isOpen: !state.isOpen };
    case AIInteractionActionType.CLEAR_MESSAGES:
      return { ...state, messages: [defaultSystemMessage] };
    // FIX: Add reducer cases for new actions to manage interactive UI states.
    case AIInteractionActionType.SHOW_NAVIGATION_PROMPT:
      return { ...state, navigationPrompt: { ...action.payload, isOpen: true }, isOpen: true };
    case AIInteractionActionType.SHOW_SCHEDULING_MODAL:
        return { ...state, schedulingModal: { ...action.payload, isOpen: true }, isOpen: true };
    case AIInteractionActionType.HIDE_INTERACTION:
        return { 
            ...state, 
            navigationPrompt: { ...state.navigationPrompt, isOpen: false }, 
            schedulingModal: { ...state.schedulingModal, isOpen: false }
        };
    default:
      return state;
  }
};

// FIX: Changed from a const arrow function to a function declaration to resolve issues with the 'children' prop type in deeply nested contexts.
export function AIInteractionProvider({ children }: { children?: ReactNode }) {
  const [state, dispatch] = useReducer(aiInteractionReducer, initialState);

  return (
    <AIInteractionStateContext.Provider value={state}>
      <AIInteractionDispatchContext.Provider value={dispatch}>
        {children}
      </AIInteractionDispatchContext.Provider>
    </AIInteractionStateContext.Provider>
  );
};

export { AIInteractionStateContext, AIInteractionDispatchContext };