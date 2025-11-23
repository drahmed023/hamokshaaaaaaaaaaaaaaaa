// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useAIInteraction } from '../hooks/useAIInteraction';
import { AIInteractionActionType, AIMessage } from '../types';
import { getAIResponse } from '../services/geminiService';
import { useSmartSettings } from '../hooks/useSmartSettings';
import Button from './Button';
import { BotIcon } from './icons/BotIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SendIcon } from './icons/SendIcon';
import Loader from './Loader';

// Mapping of page names the AI can use to actual app routes
const pagePaths: Record<string, string> = {
    "home": "/", "create exam": "/create-exam", "history": "/history", "analytics": "/analytics",
    "achievements": "/achievements", "study aids": "/study-aids", "study plan": "/study-plan",
    "saved items": "/saved-items", "explainer": "/explainer", "tasks": "/tasks", "calendar": "/calendar",
    "settings": "/settings", "drive": "/drive", "notion": "/notion", "diagram explainer": "/diagram-explainer"
};


function AICompanion() {
  const { messages, isThinking, isOpen, dispatch } = useAIInteraction();
  const { aiPersona } = useSmartSettings();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFunctionCalls = (functionCalls: any[]) => {
      for (const fc of functionCalls) {
          if (fc.name === 'navigateTo') {
              const page = fc.args.page.toLowerCase();
              const destination = pagePaths[page];
              if (destination) {
                  dispatch({
                      type: AIInteractionActionType.SHOW_NAVIGATION_PROMPT,
                      payload: {
                          destination,
                          message: `The AI would like to navigate to the ${page} page. Proceed?`
                      }
                  });
              }
          } else if (fc.name === 'scheduleTask') {
              dispatch({
                  type: AIInteractionActionType.SHOW_SCHEDULING_MODAL,
                  payload: {
                      taskDescription: fc.args.description,
                      dueDate: fc.args.dueDate,
                  }
              });
          }
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isThinking) return;

    const userMessage: AIMessage = { role: 'user', parts: [{ text: newMessage }] };
    dispatch({ type: AIInteractionActionType.ADD_MESSAGE, payload: userMessage });
    const currentMessage = newMessage;
    setNewMessage('');
    dispatch({ type: AIInteractionActionType.SET_IS_THINKING, payload: true });

    try {
      const response = await getAIResponse(messages, currentMessage, aiPersona);

      if (response.functionCalls && response.functionCalls.length > 0) {
          handleFunctionCalls(response.functionCalls);
      }
      
      // The model might return text along with a function call, or just text.
      if (response.text) {
          const modelMessage: AIMessage = { role: 'model', parts: [{ text: response.text }] };
          dispatch({ type: AIInteractionActionType.ADD_MESSAGE, payload: modelMessage });
      }

    } catch (error) {
      console.error("AI response error:", error);
      const errorMessage: AIMessage = {
        role: 'model',
        parts: [{ text: "Sorry, I encountered an error. Please try again." }],
      };
      dispatch({ type: AIInteractionActionType.ADD_MESSAGE, payload: errorMessage });
    } finally {
      dispatch({ type: AIInteractionActionType.SET_IS_THINKING, payload: false });
    }
  };
  
  const toggleWindow = () => {
      dispatch({type: AIInteractionActionType.TOGGLE_WINDOW});
  }

  return (
    <>
      <button
        onClick={toggleWindow}
        className="hide-in-focus fixed bottom-6 right-6 z-50 w-16 h-16 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-transform hover:scale-110"
        aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
      >
        {isOpen ? <XCircleIcon className="w-8 h-8"/> : <BotIcon className="w-8 h-8" />}
      </button>

      {isOpen && (
        <div className="hide-in-focus fixed bottom-24 right-6 z-50 w-full max-w-sm h-[60vh] bg-white/70 dark:bg-slate-800/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 rounded-lg shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200/80 dark:border-slate-700/60 flex-shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <BotIcon className="w-5 h-5 text-primary-500" />
                AI Study Companion
            </h3>
            <button onClick={() => dispatch({type: AIInteractionActionType.CLEAR_MESSAGES})} className="text-xs text-slate-500 hover:text-primary-500">Clear</button>
          </div>

          {/* Messages */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && <BotIcon className="w-6 h-6 text-slate-400 flex-shrink-0 mt-1" />}
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-slate-100/50 dark:bg-slate-700/50 rounded-bl-none'
                  }`}
                >
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {isThinking && <div className="flex justify-start"><Loader text="Thinking..." /></div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-700/60 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full p-2 border border-slate-300/50 rounded-lg bg-white/30 dark:bg-slate-700/50 dark:border-slate-600/50"
                disabled={isThinking}
              />
              <Button type="submit" disabled={isThinking || !newMessage.trim()} className="!p-2.5">
                <SendIcon className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AICompanion;