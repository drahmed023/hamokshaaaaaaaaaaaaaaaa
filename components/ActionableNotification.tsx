





import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIInteraction } from '../hooks/useAIInteraction';
import { AIInteractionActionType } from '../types';
import Button from './Button';
import { BotIcon } from './icons/BotIcon';

function ActionableNotification() {
    const { navigationPrompt, dispatch } = useAIInteraction();
    const navigate = useNavigate();

    const handleConfirm = () => {
        navigate(navigationPrompt.destination);
        dispatch({ type: AIInteractionActionType.HIDE_INTERACTION });
    };

    const handleCancel = () => {
        dispatch({ type: AIInteractionActionType.HIDE_INTERACTION });
    };

    if (!navigationPrompt.isOpen) {
        return null;
    }

    return (
        <div className="fixed bottom-28 right-6 z-50 w-full max-w-sm bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-4 ring-1 ring-black ring-opacity-5 animate-slide-in">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <BotIcon className="w-6 h-6 text-primary-500" />
                </div>
                <div className="flex-grow">
                    <p className="font-semibold text-sm">AI Assistant</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{navigationPrompt.message}</p>
                </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                {/* Fix: Added children to Button components to resolve missing prop errors. */}
                <Button onClick={handleCancel} variant="secondary" size="sm">No</Button>
                <Button onClick={handleConfirm} size="sm">Yes</Button>
            </div>
             <style>{`
                @keyframes slide-in {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
             `}</style>
        </div>
    );
};

export default ActionableNotification;